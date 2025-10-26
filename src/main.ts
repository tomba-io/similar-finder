import { Actor } from 'apify';
import { Similar, TombaClient } from 'tomba';

interface SimilarFinderInput {
    tombaApiKey: string;
    tombaApiSecret: string;
    domains: string[];
    maxResults?: number;
}

// Rate limiting function - 150 requests per minute
async function rateLimit(lastRequestTime: number): Promise<void> {
    const minInterval = 60000 / 150; // 150 requests per minute
    const timeSinceLastRequest = Date.now() - lastRequestTime;

    if (timeSinceLastRequest < minInterval) {
        const delay = minInterval - timeSinceLastRequest;
        await new Promise<void>((resolve) => {
            setTimeout(() => resolve(), delay);
        });
    }
}

await Actor.init();

try {
    const input = await Actor.getInput<SimilarFinderInput>();

    if (!input) {
        throw new Error('Input is required');
    }

    const { tombaApiKey, tombaApiSecret, domains, maxResults = 50 } = input;

    if (!tombaApiKey || !tombaApiSecret) {
        throw new Error('Tomba API key and secret are required');
    }

    if (!domains || !Array.isArray(domains) || domains.length === 0) {
        throw new Error('At least one domain is required');
    }

    // Initialize Tomba client
    const client = new TombaClient();
    const similar = new Similar(client);

    client.setKey(tombaApiKey).setSecret(tombaApiSecret);

    console.log(`Starting similar domain search for ${domains.length} domains`);

    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;
    let lastRequestTime = 0;
    const startTime = Date.now();

    for (const domain of domains) {
        if (processedCount >= maxResults) {
            console.log(`Reached maximum results limit of ${maxResults}`);
            break;
        }

        try {
            // Apply rate limiting
            await rateLimit(lastRequestTime);
            lastRequestTime = Date.now();

            console.log(`Finding similar domains for: ${domain}`);

            const result = await similar.websites(domain);

            if (result && typeof result === 'object') {
                const resultData = result as Record<string, unknown>;

                if (resultData.data && Array.isArray(resultData.data)) {
                    const websites = resultData.data;

                    // Handle the response which contains similar domains
                    if (websites.length > 0) {
                        for (const website of websites) {
                            if (typeof website === 'object' && website !== null) {
                                const siteData = website as Record<string, unknown>;

                                const similarDomainResult = {
                                    input_domain: domain,
                                    similar_domain: siteData.website_url ? String(siteData.website_url) : undefined,
                                    company_name: siteData.name ? String(siteData.name) : undefined,
                                    industries: siteData.industries ? String(siteData.industries) : undefined,
                                    website_url: siteData.website_url ? String(siteData.website_url) : undefined,
                                    source: 'tomba_similar_finder',
                                };

                                await Actor.pushData(similarDomainResult);
                                processedCount++;
                                successCount++;

                                console.log(
                                    `Found similar domain: ${similarDomainResult.similar_domain} (Company: ${similarDomainResult.company_name})`,
                                );
                            }
                        }
                    } else {
                        console.log(`No similar domains found for: ${domain}`);

                        const noResultsData = {
                            input_domain: domain,
                            similar_domain: null,
                            source: 'tomba_similar_finder',
                            error: 'No similar domains found',
                        };

                        await Actor.pushData(noResultsData);
                        processedCount++;
                        errorCount++;
                    }
                } else {
                    console.log(`No data returned for domain: ${domain}`);

                    const errorResult = {
                        input_domain: domain,
                        similar_domain: null,
                        source: 'tomba_similar_finder',
                        error: 'No data returned from API',
                    };

                    await Actor.pushData(errorResult);
                    processedCount++;
                    errorCount++;
                }
            } else {
                console.log(`Invalid response for domain: ${domain}`);

                const errorResult = {
                    input_domain: domain,
                    similar_domain: null,
                    source: 'tomba_similar_finder',
                    error: 'Invalid API response',
                };

                await Actor.pushData(errorResult);
                processedCount++;
                errorCount++;
            }
        } catch (error) {
            console.error(`Error finding similar domains for ${domain}:`, error);

            const errorResult = {
                input_domain: domain,
                similar_domain: null,
                source: 'tomba_similar_finder',
                error: error instanceof Error ? error.message : 'Unknown error',
            };

            await Actor.pushData(errorResult);
            processedCount++;
            errorCount++;
        }

        // Small delay between requests
        await new Promise<void>((resolve) => {
            setTimeout(() => resolve(), 100);
        });
    }

    const endTime = Date.now();
    const executionTime = Math.round((endTime - startTime) / 1000);
    const successRate = processedCount > 0 ? Math.round((successCount / processedCount) * 100) : 0;
    const avgTimePerDomain = processedCount > 0 ? Math.round(executionTime / processedCount) : 0;

    // Log comprehensive summary
    console.log('\n SIMILAR FINDER SUMMARY');
    console.log('================================');
    console.log(`Total domains processed: ${processedCount}/${domains.length}`);
    console.log(`Successful searches: ${successCount}`);
    console.log(`Failed searches: ${errorCount}`);
    console.log(`Success rate: ${successRate}%`);
    console.log(`Total execution time: ${executionTime} seconds`);
    console.log(`Average time per domain: ${avgTimePerDomain} seconds`);
    console.log(`API requests made: ${domains.length}`);
    console.log(`Rate limiting: 150 requests/minute (${Math.round(60000 / 150)}ms interval)`);
    console.log('================================');

    console.log(`Similar domain search completed. Processed ${processedCount} results.`);
} catch (error) {
    console.error('Similar domain search failed:', error);
    throw error;
}

await Actor.exit();
