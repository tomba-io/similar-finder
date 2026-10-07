import { Actor, log } from 'apify';
import { Similar } from 'tomba';

import type { RunOptions } from './tomba.js';
import { callTomba, logSummary, normalizeDomain, runPool, setupTomba, stop, unique, useRunState } from './tomba.js';

interface SimilarFinderInput extends RunOptions {
    domains: string[];
    maxResults?: number;
}

const SOURCE = 'tomba_similar_finder';

await Actor.init();

const input = await Actor.getInput<SimilarFinderInput>();
if (!input?.domains?.length) {
    await Actor.fail('Input must contain at least one domain in "domains".');
}

const { domains: rawDomains, maxResults = 50, ...runOptions } = input!;
const client = await setupTomba(runOptions);
const similar = new Similar(client);
const state = await useRunState();

const domains = unique(rawDomains.map(normalizeDomain));
const pending = domains.filter((domain) => !state.done[domain]);
if (pending.length < domains.length) {
    log.info(`Resuming: ${domains.length - pending.length} domains already processed.`);
}

let pushed = 0;
const startedAt = Date.now();
log.info(`Finding similar domains for ${pending.length} domains`);

await runPool(pending, async (domain) => {
    if (pushed >= maxResults) {
        stop();
        return;
    }

    const res = await callTomba('similar', { domain }, async () => similar.websites(domain));
    if (res.skipped) return;

    const websites = Array.isArray(res.data) ? (res.data as Record<string, unknown>[]) : [];
    const items = websites.slice(0, Math.max(0, maxResults - pushed)).map((site) => ({
        input_domain: domain,
        similar_domain: site.website_url ? String(site.website_url) : undefined,
        company_name: site.name ? String(site.name) : undefined,
        industries: site.industries ? String(site.industries) : undefined,
        website_url: site.website_url ? String(site.website_url) : undefined,
        source: SOURCE,
        charged: res.charged,
        cached: res.cached,
    }));

    if (items.length === 0 && websites.length > 0) {
        // Another domain reached maxResults while this request was running: not a "no results" answer.
        stop();
        return;
    }

    if (items.length > 0) {
        pushed += items.length;
        await Actor.pushData(items);
        log.info(`${domain}: ${items.length} similar domains${res.cached ? ' (cached)' : ''}`);
    } else {
        await Actor.pushData({
            input_domain: domain,
            similar_domain: null,
            source: SOURCE,
            charged: res.charged,
            cached: res.cached,
            error: res.error ?? 'No similar domains found',
        });
        log.info(`${domain}: ${res.error ?? 'no similar domains found'}`);
    }

    state.done[domain] = true;
});

logSummary('Similar Finder', domains.length, startedAt);

await Actor.exit();
