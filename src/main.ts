import { log } from 'apify';
import { Similar } from 'tomba';

import { InputError, queryInt, queryList, runActor } from './standby.js';
import type { RunOptions } from './tomba.js';
import { callTomba, getClient, normalizeDomain, runPool, unique } from './tomba.js';

interface SimilarFinderInput extends RunOptions {
    domains?: string[];
    maxResults?: number;
}

const SOURCE = 'tomba_similar_finder';

await runActor<SimilarFinderInput>({
    title: 'Similar Finder',
    count: (input) => input.domains?.length ?? 0,
    fromQuery: (query) => ({
        domains: queryList(query, 'domain', 'domains'),
        maxResults: queryInt(query, 'maxResults'),
    }),
    run: async (input, { push, isDone, markDone, standby }) => {
        if (!input.domains?.length) throw new InputError('Input must contain at least one domain in "domains".');

        const maxResults = input.maxResults ?? 50;
        const similar = new Similar(getClient());
        const domains = unique(input.domains.map(normalizeDomain));
        const pending = domains.filter((domain) => !isDone(domain));
        if (pending.length < domains.length) {
            log.info(`Resuming: ${domains.length - pending.length} domains already processed.`);
        }
        if (!standby) log.info(`Finding similar domains for ${pending.length} domains`);

        let pushed = 0;
        const full = () => pushed >= maxResults;

        await runPool(
            pending,
            async (domain) => {
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

                // Another domain reached maxResults while this request was running: not a "no results" answer.
                if (items.length === 0 && websites.length > 0) return;

                if (items.length > 0) {
                    pushed += items.length;
                    await push(items);
                    log.info(`${domain}: ${items.length} similar domains${res.cached ? ' (cached)' : ''}`);
                } else {
                    await push({
                        input_domain: domain,
                        similar_domain: null,
                        source: SOURCE,
                        charged: res.charged,
                        cached: res.cached,
                        error: res.error ?? 'No similar domains found',
                    });
                    log.info(`${domain}: ${res.error ?? 'no similar domains found'}`);
                }

                markDone(domain);
            },
            undefined,
            full,
        );
    },
});
