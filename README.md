# Tomba Similar Finder Actor

[![Actor](https://img.shields.io/badge/Apify-Actor-blue)](https://apify.com/actors)
[![Tomba API](https://img.shields.io/badge/Tomba-API-green)](https://tomba.io)
[![Rate Limit](https://img.shields.io/badge/Rate%20Limit-150%2Fmin-orange)](https://tomba.io/api)

A powerful Apify Actor that discovers and retrieves similar domains based on a specific domain using the **Tomba Similar Finder API**. Perfect for competitive analysis, market research, and discovering related businesses in your industry or niche.

## Key Features

- **Similar Domain Discovery**: Find websites similar to your target domain
- **Company Information**: Retrieve company names and descriptions for similar domains
- **Industry Classification**: Understand the industry categories of similar websites
- **Bulk Processing**: Process multiple domains efficiently with rate limiting
- **Rate Limited**: Respects Tomba's 150 requests per minute limit
- **Rich Data Output**: Comprehensive domain profiles with metadata
- **Built-in Error Handling**: Robust processing with comprehensive error reporting

## How it works

The Actor leverages Tomba's powerful Similar Finder API to discover domains similar to your input:

### Process Flow

1. **Authentication**: Connects to Tomba API using your credentials
2. **Input Processing**: Accepts array of domains to analyze
3. **Similar Domain Discovery**: Uses Tomba's `websites` method for each domain
4. **Data Enrichment**: Extracts company, industry, and similarity information
5. **Rate Limiting**: Automatically handles 150 requests/minute limit
6. **Data Storage**: Saves results to Apify dataset

### What You Get

For each similar domain found, you'll receive:

- **Similar Domain**: The discovered similar website domain
- **Company Info**: Company name and description
- **Industry**: Industry category classification
- **Website URL**: Full website URL for easy access
- **Source Tracking**: Data source identification

## Quick Start

### Prerequisites

1. **Tomba Account**: Sign up at [Tomba.io](https://app.tomba.io/api) to get your API credentials

### Getting Your API Keys

1. Visit [Tomba API Dashboard](https://app.tomba.io/api)
2. Copy your **API Key** (starts with `ta_`)
3. Copy your **Secret Key** (starts with `ts_`)

## Input Configuration

### Required Parameters

| Parameter        | Type       | Description                                   |
| ---------------- | ---------- | --------------------------------------------- |
| `tombaApiKey`    | `string`   | Your Tomba API key (ta_xxxx)                  |
| `tombaApiSecret` | `string`   | Your Tomba secret key (ts_xxxx)               |
| `domains`        | `string[]` | Array of domains to find similar websites for |

### Optional Parameters

| Parameter    | Type     | Default | Description                         |
| ------------ | -------- | ------- | ----------------------------------- |
| `maxResults` | `number` | `50`    | Maximum number of results to return |

### Example Input

```json
{
    "tombaApiKey": "ta_xxxxxxxxxxxxxxxxxxxx",
    "tombaApiSecret": "ts_xxxxxxxxxxxxxxxxxxxx",
    "domains": ["example.com", "google.com", "github.com"],
    "maxResults": 100
}
```

### Best Practices

- **Domain Format**: Use clean domain names without protocols (e.g., 'example.com' not 'https://example.com')
- **Batch Size**: Process 10-20 domains at a time for optimal performance
- **Rate Limits**: The Actor automatically handles Tomba's 150 requests/minute limit
- **Quality Results**: Use established, well-known domains for better similarity matches
- **Data Analysis**: Focus on similarity scores to identify the most relevant matches

## Output Data Structure

The Actor returns comprehensive information for each similar domain found:

```json
{
    "input_domain": "example.com",
    "similar_domain": "hunter.io",
    "company_name": "Hunter",
    "industries": "Information Technology and Services",
    "website_url": "hunter.io",
    "source": "tomba_similar_finder"
}
```

### Data Fields Explained

- **input_domain**: The original domain you searched for
- **similar_domain**: The discovered similar domain (from website_url field)
- **company_name**: Name of the company behind the similar domain
- **industries**: Industries associated with the similar domain
- **website_url**: Full URL of the similar website
- **source**: Data source identifier (tomba_similar_finder)
- **error**: Error message if the search failed

## Use Cases

### Competitive Analysis

- **Competitor Discovery**: Find direct and indirect competitors in your market
- **Market Landscape**: Understand the competitive landscape of your industry
- **Feature Comparison**: Discover similar services to analyze and compare

### Business Development

- **Partnership Opportunities**: Identify potential partners with similar business models
- **Market Expansion**: Find similar companies in different geographic markets
- **Acquisition Targets**: Discover companies with similar offerings for potential acquisition

### Market Research

- **Industry Analysis**: Understand market trends and player distribution
- **Customer Research**: Find similar companies to understand target audiences
- **Trend Identification**: Spot emerging players and market directions

### Sales & Marketing

- **Lead Generation**: Find similar companies as potential customers
- **Account-Based Marketing**: Identify companies similar to your best customers
- **Sales Prospecting**: Discover new prospects in similar market segments

## Data Views

The Actor provides specialized data views:

### Overview View

Quick summary showing input domain, similar domain, company, and industry information

### Detailed View

Comprehensive view with all similarity data, company information, and technical details

### Successful Matches View

Filtered view showing only domains where similar matches were found, excluding errors

## Resources & Documentation

### API Documentation

- [Tomba API Docs](https://tomba.io/api) - Complete API reference
- [Similar Finder Endpoint](https://docs.tomba.io/api/similar) - Specific similarity documentation
- [Authentication Guide](https://app.tomba.io/api) - Get your API keys
- [Pricing & Limits](https://tomba.io/pricing) - Understand rate limits and costs

### Rate Limiting

- Tomba limits to **150 requests per minute**
- Actor automatically handles rate limiting with delays
- Large domain lists may take time to complete

### Cost Considerations

- Each domain similarity search = 1 Tomba API request
- Monitor your Tomba usage dashboard
- Consider Tomba's pricing tiers for volume usage
