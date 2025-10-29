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

- Each domain analyzed = 1 Tomba API request
- Monitor your Tomba usage dashboard
- Consider Tomba's pricing tiers for volume usage

## FAQ

### General Questions

**Q: What does similar domain finding do?**
A: Similar domain finding analyzes a website and discovers other domains that are similar in content, industry, business model, or target audience. It helps identify competitors, partners, and related businesses.

**Q: How are similar domains determined?**
A: Similarity is calculated based on website content, industry classification, business model, technology usage, and audience overlap using advanced matching algorithms.

**Q: How many similar domains can I expect to find?**
A: Results typically include 10-50 similar domains per input domain, depending on the industry and how unique the business is. Popular industries tend to have more similar domains.

### Technical Questions

**Q: Can I find similar domains for any website?**
A: You can analyze most business websites. Very niche or new websites might have fewer similar domains. Established companies in common industries typically yield better results.

**Q: How should I interpret similarity scores?**
A: Higher similarity scores indicate closer matches. Use scores to prioritize which similar domains are most relevant for your specific use case.

**Q: What if no similar domains are found?**
A: This might indicate a very unique business model, new industry, or highly specialized niche. Consider broadening your search or analyzing related industry domains.

### Business Applications

**Q: How can this help with competitive research?**
A: Discover direct and indirect competitors you might not have known about, analyze their strategies, and identify market gaps or opportunities.

**Q: Is this useful for finding partnership opportunities?**
A: Yes! Similar domains often represent potential partners, especially those serving complementary markets or using compatible business models.

**Q: Can I use this for market expansion?**
A: Absolutely! Similar domains show you how others address similar markets, reveal new market segments, and inspire expansion strategies.

## Keywords

similar domains, competitive analysis, domain finder, business intelligence, market research, competitor discovery, website similarity, industry analysis, lead generation, company discovery, market mapping, business development

## Support

If you need any help, have questions, or encounter any issues while using Tomba.io, please don't hesitate to reach out to our support team. You can contact us via:

- **Email**: support@tomba.io
- **Live chat**: Available on the Tomba.io website during business hours

## Contributing

We welcome contributions to improve this actor. Please feel free to submit issues, feature requests, or pull requests to help make this tool even better for the community.

## About Tomba

Founded in 2020, Tomba prides itself on being the most reliable, accurate, and in-depth source of email address data available anywhere. We process terabytes of data to produce our Email finder API.

![Tomba Logo](https://tomba.io/logo.png)
