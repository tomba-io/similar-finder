// End-to-end tests: run the Actor against a mock Tomba API.
import assert from 'node:assert/strict';
import { after, afterEach, describe, it } from 'node:test';

import type { MockHandler, MockServer } from './helpers.js';
import {
    inputSchemaErrors,
    removeStorage,
    runActor,
    startMockTomba,
    startStandbyActor,
    totalCharges,
} from './helpers.js';

const SIMILAR = [
    { website_url: 'paypal.com', name: 'PayPal', industries: 'Financial Services' },
    { website_url: 'adyen.com', name: 'Adyen', industries: 'Financial Services' },
    { website_url: 'square.com', name: 'Square', industries: 'Information Technology and Services' },
];

/** Default Tomba behaviour: known domains return similar websites, everything else returns no data. */
const tomba: MockHandler = (req) => {
    assert.equal(req.method, 'GET');
    assert.equal(req.path, '/similar');
    if (req.query.domain === 'empty.com') return { body: { data: [] } };
    if (req.query.domain === 'null.com') return { body: { data: null } };
    if (req.query.domain === 'invalid.com') return { status: 422, body: { errors: { message: 'Invalid domain' } } };
    if (req.query.domain === 'html.com') return { raw: '<html>Bad gateway</html>' };
    return { body: { data: SIMILAR } };
};

const servers: MockServer[] = [];
const dirs: string[] = [];

async function mock(handler: MockHandler = tomba): Promise<MockServer> {
    const server = await startMockTomba(handler);
    servers.push(server);
    return server;
}

async function run(...args: Parameters<typeof runActor>) {
    const result = await runActor(...args);
    dirs.push(result.storageDir);
    return result;
}

async function slow(handler: MockHandler, ms: number): Promise<MockServer> {
    return mock(async (req) => {
        await new Promise((r) => {
            setTimeout(r, ms);
        });
        return handler(req);
    });
}

afterEach(async () => {
    await Promise.all(servers.splice(0).map(async (s) => s.close()));
});

after(async () => {
    await Promise.all(dirs.map(removeStorage));
});

describe('similar-finder', () => {
    it('returns similar websites and charges one event per billable domain', async () => {
        const server = await mock();
        const result = await run({ input: { domains: ['stripe.com', 'empty.com'] }, endpoint: server.url });

        assert.equal(result.code, 0, result.output);
        const found = result.items.filter((i) => i.similar_domain);
        assert.equal(found.length, 3);
        assert.deepEqual(found[0], {
            input_domain: 'stripe.com',
            similar_domain: 'paypal.com',
            company_name: 'PayPal',
            industries: 'Financial Services',
            website_url: 'paypal.com',
            source: 'tomba_similar_finder',
            charged: true,
            cached: false,
        });

        const empty = result.items.find((i) => i.input_domain === 'empty.com');
        assert.deepEqual(empty, {
            input_domain: 'empty.com',
            similar_domain: null,
            source: 'tomba_similar_finder',
            charged: false,
            cached: false,
            error: 'No similar domains found',
        });

        assert.deepEqual(result.chargeCounts, { 'tomba-request': 1 });
    });

    it('sends the built-in credentials to Tomba', async () => {
        const server = await mock();
        await run({ input: { domains: ['stripe.com'] }, endpoint: server.url });
        assert.equal(server.requests[0].headers['x-tomba-key'], 'ta_test_key');
        assert.equal(server.requests[0].headers['x-tomba-secret'], 'ts_test_secret');
    });

    it('normalizes and deduplicates domains', async () => {
        const server = await mock();
        await run({
            input: { domains: ['https://www.Stripe.com/pricing', 'stripe.com', ' STRIPE.COM '] },
            endpoint: server.url,
        });
        assert.deepEqual(
            server.requests.map((r) => r.query),
            [{ domain: 'stripe.com' }],
        );
    });

    it('does not charge null data', async () => {
        const server = await mock();
        const result = await run({ input: { domains: ['null.com'] }, endpoint: server.url });
        assert.equal(result.items[0].charged, false);
        assert.equal(result.items[0].error, 'No similar domains found');
        assert.equal(totalCharges(result), 0);
    });

    it('does not charge Tomba error statuses and does not retry them', async () => {
        const server = await mock();
        const result = await run({ input: { domains: ['invalid.com'] }, endpoint: server.url });
        assert.equal(result.code, 0, result.output);
        assert.equal(server.requests.length, 1);
        assert.equal(result.items[0].charged, false);
        assert.match(String(result.items[0].error), /422: Invalid domain/);
        assert.equal(totalCharges(result), 0);
    });

    it('does not charge a non-JSON body', async () => {
        const server = await mock();
        const result = await run({ input: { domains: ['html.com'] }, endpoint: server.url });
        assert.equal(result.items[0].charged, false);
        assert.match(String(result.items[0].error), /Invalid response/);
        assert.equal(totalCharges(result), 0);
    });

    it('retries 429 and 5xx responses, then charges the success once', async () => {
        let calls = 0;
        const server = await mock(async (req) => {
            calls++;
            if (calls === 1)
                return {
                    status: 429,
                    body: { errors: { message: 'Too many requests' } },
                    headers: { 'retry-after': '1' },
                };
            if (calls === 2) return { status: 503, body: {} };
            return tomba(req);
        });
        const result = await run({ input: { domains: ['stripe.com'], maxRetries: 3 }, endpoint: server.url });
        assert.equal(server.requests.length, 3);
        assert.equal(result.items.length, 3);
        assert.ok(result.items.every((i) => i.charged === true));
        assert.deepEqual(result.chargeCounts, { 'tomba-request': 1 });
    });

    it('serves repeated runs from the cache for free', async () => {
        const server = await mock();
        const first = await run({ input: { domains: ['stripe.com'] }, endpoint: server.url });
        const second = await run({
            input: { domains: ['stripe.com'] },
            endpoint: server.url,
            storageDir: first.storageDir,
        });

        assert.equal(server.requests.length, 1);
        assert.equal(second.items.length, 3);
        assert.ok(second.items.every((i) => i.cached === true && i.charged === false));
        assert.equal(totalCharges(second), 0);
    });

    it('calls Tomba again when the cache is disabled', async () => {
        const server = await mock();
        const first = await run({ input: { domains: ['stripe.com'], useCache: false }, endpoint: server.url });
        await run({
            input: { domains: ['stripe.com'], useCache: false },
            endpoint: server.url,
            storageDir: first.storageDir,
        });
        assert.equal(server.requests.length, 2);
    });

    it('stops at the max charge limit and resumes without reprocessing', async () => {
        const server = await mock();
        const domains = ['a.com', 'b.com', 'c.com', 'd.com', 'e.com'];
        const input = { domains, maxConcurrency: 1, useCache: false, maxResults: 100 };

        // Locally every event costs $1, so a $2 budget allows two billable requests.
        const first = await run({ input, endpoint: server.url, maxTotalChargeUsd: 2 });
        assert.equal(first.code, 0, first.output);
        assert.equal(totalCharges(first), 2);
        assert.equal(server.requests.length, 2);
        assert.equal(first.items.length, 6);

        const second = await run({ input, endpoint: server.url, storageDir: first.storageDir, keepStorage: true });
        assert.equal(second.code, 0, second.output);
        assert.deepEqual(
            server.requests.map((r) => r.query.domain),
            domains,
        );
        assert.equal(second.items.length, 15);
    });

    it('respects maxResults', async () => {
        const server = await mock();
        const result = await run({
            input: { domains: ['a.com', 'b.com'], maxResults: 2, maxConcurrency: 1 },
            endpoint: server.url,
        });
        assert.equal(server.requests.length, 1);
        assert.equal(result.items.length, 2);
    });

    it('does not report "no results" for domains cut off by maxResults in parallel', async () => {
        const server = await slow(tomba, 100);
        const result = await run({
            input: { domains: ['a.com', 'b.com', 'c.com'], maxResults: 1, maxConcurrency: 3 },
            endpoint: server.url,
        });
        assert.equal(result.code, 0, result.output);
        assert.equal(result.items.length, 1);
        assert.equal(result.items[0].similar_domain, 'paypal.com');
        assert.ok(result.items.every((i) => i.error === undefined));
    });

    it('runs requests in parallel', async () => {
        let active = 0;
        let peak = 0;
        const server = await mock(async (req) => {
            active++;
            peak = Math.max(peak, active);
            await new Promise((r) => {
                setTimeout(r, 100);
            });
            active--;
            return tomba(req);
        });
        const domains = Array.from({ length: 8 }, (_, i) => `site${i}.com`);
        await run({ input: { domains, maxConcurrency: 4, maxResults: 1000 }, endpoint: server.url });
        assert.equal(server.requests.length, 8);
        assert.ok(peak > 1 && peak <= 4, `peak concurrency ${peak}`);
    });

    it('fails without Tomba credentials and never calls the API', async () => {
        const server = await mock();
        const result = await run({ input: { domains: ['stripe.com'] }, endpoint: server.url, withCredentials: false });
        assert.notEqual(result.code, 0);
        assert.match(result.output, /misconfigured/);
        assert.doesNotMatch(result.output, /ta_test_key|ts_test_secret/);
        assert.equal(server.requests.length, 0);
    });

    it('fails on empty input', async () => {
        const server = await mock();
        const result = await run({ input: { domains: [] }, endpoint: server.url });
        assert.notEqual(result.code, 0);
        assert.equal(server.requests.length, 0);
    });
});

describe('similar-finder standby (real-time API)', () => {
    it('answers the readiness probe and a bare GET with usage info', async () => {
        const server = await mock();
        const actor = await startStandbyActor({ endpoint: server.url });
        try {
            const probe = await actor.call('/', { headers: { 'x-apify-container-server-readiness-probe': '1' } });
            assert.equal(probe.status, 200);
            const usage = await actor.call('/');
            assert.equal(usage.status, 200);
            assert.match(String(usage.body.usage), /GET/);
            assert.equal(server.requests.length, 0);
        } finally {
            await actor.stop();
        }
    });

    it('looks up domains from GET query parameters and charges per billable domain', async () => {
        const server = await mock();
        const actor = await startStandbyActor({ endpoint: server.url });
        let stopped;
        try {
            const res = await actor.call('/?domain=https://www.Stripe.com/pricing&domain=empty.com');
            assert.equal(res.status, 200);
            const items = res.body.items as Record<string, unknown>[];
            assert.equal(items.filter((i) => i.similar_domain).length, 3);
            assert.equal(items.find((i) => i.input_domain === 'empty.com')?.error, 'No similar domains found');
            assert.deepEqual(server.requests.map((r) => r.query.domain).sort(), ['empty.com', 'stripe.com']);
        } finally {
            stopped = await actor.stop();
        }
        assert.deepEqual(stopped.chargeCounts, { 'tomba-request': 1 });
    });

    it('accepts a POST with the same JSON input as a normal run', async () => {
        const server = await mock();
        const actor = await startStandbyActor({ endpoint: server.url });
        try {
            const res = await actor.call('/', { body: { domains: ['stripe.com', 'adyen.com'], maxResults: 4 } });
            assert.equal(res.status, 200);
            assert.equal((res.body.items as unknown[]).length, 4);
        } finally {
            await actor.stop();
        }
    });

    it('serves repeated requests from the cache for free', async () => {
        const server = await mock();
        const actor = await startStandbyActor({ endpoint: server.url });
        let stopped;
        try {
            await actor.call('/?domain=stripe.com');
            const second = await actor.call('/?domain=stripe.com');
            assert.ok((second.body.items as Record<string, unknown>[]).every((i) => i.cached === true));
            assert.equal(server.requests.length, 1);
        } finally {
            stopped = await actor.stop();
        }
        assert.deepEqual(stopped.chargeCounts, { 'tomba-request': 1 });
    });

    it('keeps serving after a request hits maxResults', async () => {
        const server = await mock();
        const actor = await startStandbyActor({ endpoint: server.url });
        try {
            const first = await actor.call('/?domains=a.com,b.com&maxResults=1');
            assert.equal((first.body.items as unknown[]).length, 1);
            const second = await actor.call('/?domain=c.com');
            assert.equal((second.body.items as unknown[]).length, 3);
        } finally {
            await actor.stop();
        }
    });

    it('rejects invalid input with 400 and unknown paths with 404', async () => {
        const server = await mock();
        const actor = await startStandbyActor({ endpoint: server.url });
        try {
            assert.equal((await actor.call('/', { body: {} })).status, 400);
            assert.equal((await actor.call('/', { body: 'not json' })).status, 400);
            assert.equal((await actor.call('/?maxResults=abc&domain=a.com')).status, 400);
            assert.equal((await actor.call('/nope')).status, 404);
            assert.equal((await actor.call('/', { method: 'DELETE' })).status, 405);
            assert.equal(server.requests.length, 0);
        } finally {
            await actor.stop();
        }
    });

    it('returns 402 once the max charge limit is reached', async () => {
        const server = await mock();
        const actor = await startStandbyActor({ endpoint: server.url, maxTotalChargeUsd: 1 });
        try {
            const first = await actor.call('/?domain=a.com');
            assert.equal(first.status, 200);
            const second = await actor.call('/?domain=b.com');
            assert.equal(second.status, 402);
            assert.equal(server.requests.length, 1);
        } finally {
            await actor.stop();
        }
    });
});

describe('input schema', () => {
    it('accepts multi-part domains, subdomains and URLs', () => {
        assert.deepEqual(
            inputSchemaErrors({
                domains: ['bbc.co.uk', 'https://bbc.co.uk/', 'blog.stripe.com', 'https://www.Stripe.com/pricing'],
            }),
            [],
        );
    });
});
