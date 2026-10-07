# Tomba Similar Finder

[![Price](https://img.shields.io/badge/Price-%243.12%20per%201K%20domains-brightgreen)](#pricing)
[![No signup](https://img.shields.io/badge/Tomba%20account-not%20needed-blue)](#quick-start)
[![No rate limit](https://img.shields.io/badge/Rate%20limit-none-brightgreen)](#built-for-big-lists)

**Turn one great customer or competitor into a list of look-alike companies.** Paste a list of domains and get the websites most similar to each one, with company name and industry, ready to export.

No Tomba account. No API key. No subscription. **You pay $0.00312 per domain, and only when we find something.**

## Why teams choose this Actor

- **Start in 30 seconds**: Open the Actor, paste your domains, click Start. Nothing to sign up for
- **Pay only for results**: Domains with no similar websites, errors and invalid inputs are free
- **$3.12 per 1,000 domains**: One price per domain, however many look-alikes it returns. No monthly plan, no credits that expire
- **Built for big lists**: No rate limit. Up to 1,000 domains per run, processed in parallel
- **Never pay twice**: Domains you looked up in the last 24 hours come back from cache for free
- **Clean input, clean output**: Paste URLs or domains in any format; duplicates are removed automatically
- **Export anywhere**: Download as CSV, Excel or JSON, or send results straight to your CRM with Apify integrations

## What you can do with it

| Goal                          | How similar websites help                                               |
| ----------------------------- | ----------------------------------------------------------------------- |
| **Clone your best customers** | Feed in your top accounts and get look-alike companies to prospect next |
| **Map your competition**      | Discover direct and indirect competitors you didn't know about          |
| **Find partners**             | Spot companies with similar audiences and business models               |
| **Expand to new markets**     | See who else serves the same market as the companies you already know   |
| **Research an industry**      | Build a list of players around a few well-known names                   |

## Quick start

1. Click **Try for free**
2. Paste your domains into **Domains** (for example `stripe.com`, `hubspot.com`)
3. Click **Start**, then download your results as CSV, Excel or JSON

That's it. No Tomba account or API key is needed.

## Input

| Field            | Required | Default | Description                                                                                       |
| ---------------- | -------- | ------- | ------------------------------------------------------------------------------------------------- |
| `domains`        | Yes      |         | Domains to find look-alikes for (up to 1,000). URLs like `https://www.stripe.com/` are cleaned up |
| `maxResults`     | No       | `50`    | Maximum number of similar-website rows for the whole run (up to 10,000)                           |
| `maxConcurrency` | No       | `10`    | How many domains to process at the same time (1–50)                                               |
| `maxRetries`     | No       | `3`     | How many times to retry a temporary failure (0–10)                                                |
| `useCache`       | No       | `true`  | Reuse results from your previous runs for free                                                    |
| `cacheTtlHours`  | No       | `24`    | How long cached results stay valid (`0` turns the cache off)                                      |

`maxResults` counts rows across all your domains. When it is reached the run stops, so raise it when you submit many domains.

```json
{
    "domains": ["stripe.com", "hubspot.com", "notion.so"],
    "maxResults": 1000
}
```

## Output

You get one row per similar website:

```json
{
    "input_domain": "stripe.com",
    "similar_domain": "paypal.com",
    "company_name": "PayPal",
    "industries": "Financial Services",
    "website_url": "paypal.com",
    "source": "tomba_similar_finder",
    "charged": true,
    "cached": false
}
```

| Field            | Description                                          |
| ---------------- | ---------------------------------------------------- |
| `input_domain`   | The domain you submitted                             |
| `similar_domain` | The similar website found                            |
| `company_name`   | Name of the company behind the similar website       |
| `industries`     | Industry of the similar company                      |
| `website_url`    | Website of the similar company                       |
| `source`         | Always `tomba_similar_finder`                        |
| `charged`        | `true` if this lookup was billed                     |
| `cached`         | `true` if this result came from the cache (free)     |
| `error`          | Why no similar websites were returned, if applicable |

The dataset has three ready-made views: **Overview**, **Detailed View** and **Successful Matches**.

## Pricing

**$0.00312 per domain ($3.12 per 1,000).** No subscription and no Tomba account needed.

You are only charged when Tomba returns a usable answer:

| What happens                                    | Charged |
| ----------------------------------------------- | ------- |
| Similar websites found for the domain           | Yes     |
| No similar websites found for the domain        | No      |
| Invalid domain or any other error               | No      |
| Temporary failure (it is retried automatically) | No      |
| Result served from the cache                    | No      |

You pay once per domain, whether it returns 3 or 30 similar websites. Every row shows `charged` and `cached`, so you always know what you paid for. To cap your spend, set **Maximum cost per run** in the run options: the Actor stops cleanly when the limit is reached.

## Built for big lists

- **No rate limit**: up to 50 domains are processed at the same time
- **Automatic retries**: temporary failures are retried for you, and never billed
- **Resumable**: if a run is interrupted, it continues where it stopped without charging you again
- **Cache**: repeat lookups within 24 hours are free

## Real-time API

Need results instantly inside your own app? This Actor also runs as a **real-time API** (Apify Standby mode): no run to start, no dataset to fetch, just an HTTP request that returns JSON in seconds. Pricing is the same.

```bash
curl "https://<your-standby-url>/?domain=stripe.com&domain=shopify.com&maxResults=20" \
  -H "Authorization: Bearer <YOUR_APIFY_TOKEN>"
```

You can also `POST` the same JSON input as a normal run:

```bash
curl -X POST "https://<your-standby-url>/" \
  -H "Authorization: Bearer <YOUR_APIFY_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"domains": ["stripe.com", "shopify.com"], "maxResults": 20}'
```

The response is `{ "items": [...] }`, with the same rows as the dataset. Find your Standby URL and the full OpenAPI description in the **API** tab of this Actor.

## Integrations

Run it on a schedule, call it from the Apify API, or connect it to Zapier, Make, Google Sheets, HubSpot, Slack and hundreds of other apps with [Apify integrations](https://docs.apify.com/platform/integrations). Webhooks let you trigger your own workflow as soon as a run finishes.

Tip: feed the `similar_domain` column into **Tomba Domain Search** to get the verified emails of the people at each look-alike company.

## FAQ

**Do I need a Tomba account or API key?**
No. Everything is built in. You only pay the per-domain price on Apify.

**How much does it cost?**
$0.00312 per domain with results ($3.12 per 1,000). Domains with no results, errors and cached lookups are free.

**How many domains can I analyze in one run?**
Up to 1,000 per run, processed in parallel. There is no rate limit.

**Why did my run stop before all my domains were processed?**
`maxResults` (default 50) limits the total number of rows in the run. Raise it when you submit many domains.

**What domain format should I use?**
Anything works: `stripe.com`, `bbc.co.uk`, subdomains like `blog.stripe.com`, `www.stripe.com` or `https://stripe.com/pricing`. We clean it up and remove duplicates.

**Why are there no results for some domains?**
Very new or very niche websites may have no known look-alikes yet. You are not charged for them. Established companies give the best results.

**What if my run is interrupted?**
It picks up where it stopped. Domains already processed are not charged again.

**How do I limit what I spend?**
Set **Maximum cost per run** before you start. The Actor stops as soon as the limit is reached.

## Support

Questions or feedback? We're happy to help:

- **Email**: support@tomba.io
- **Live chat**: on [tomba.io](https://tomba.io) during business hours
- **Issues**: use the **Issues** tab on this Actor's page

## About Tomba

Founded in 2020, [Tomba](https://tomba.io) is a B2B data platform for finding, verifying and enriching business contacts. Our Email Finder, Domain Search and Email Verifier help sales and marketing teams reach the right people.

![Tomba Logo](https://tomba.io/logo.png)
