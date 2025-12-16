# GEO Analyzer v2.0

Local GEO (Generative Engine Optimization) analysis powered by Claude Sonnet 4.5. Zero external dependencies - just add your Anthropic API key and go.

[![npm version](https://img.shields.io/npm/v/@houtini/geo-analyzer)](https://www.npmjs.com/package/@houtini/geo-analyzer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What is GEO?

Generative Engine Optimization (GEO) prepares content for AI-powered search engines like ChatGPT, Claude, Perplexity, and Google's AI Overviews. Unlike traditional SEO that optimizes for keyword rankings, GEO focuses on making content easily extractable, citable, and parsable by Large Language Models.

## Features

- 🚀 **Instant Setup** - Single npx command, no accounts or deployments
- 🎯 **Research-Based** - Built on MIT's GEO methodology
- 🤖 **Claude Sonnet 4.5** - State-of-art semantic analysis
- 📊 **Interactive Artifacts** - Beautiful visual dashboards
- 🔒 **Privacy-First** - Runs entirely locally with your API key
- ⚡ **Fast** - Results in ~8 seconds

## Installation

### Claude Desktop (MCP)

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "geo-analyzer": {
      "command": "npx",
      "args": ["-y", "@houtini/geo-analyzer@latest"],
      "env": {
        "ANTHROPIC_API_KEY": "sk-ant-..."
      }
    }
  }
}
```

**Config location:**
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

Then restart Claude Desktop.

## Usage

### Analyze a URL

```
Analyze https://example.com/your-article for "your topic"
```

### Analyze Text

```
Analyze this text for "content optimization":

[Paste your content here - minimum 500 characters]
```

### Summary Mode

```
Analyze https://example.com with output_format=summary
```

## What It Analyzes

### Pattern Analysis (MIT Research)
- **Sentence Length** - Target: 15-20 words for optimal AI parsing
- **Claim Density** - Target: 4+ claims per 100 words
- **Date Markers** - Temporal context for freshness
- **Structure** - Headings, lists, table of contents

### Semantic Analysis (Claude Sonnet 4.5)
- **Semantic Triples** - (subject, predicate, object) relationships
- **Named Entities** - PERSON, ORG, PRODUCT, LOCATION, DATE, MEASUREMENT
- **Entity Diversity** - Breadth of entity types
- **Content Chunking** - Semantic coherence analysis

### Output Scores (0-10)
- **Overall Score** - Weighted average of all factors
- **Extractability** - How easily AI can extract facts
- **Readability** - How well-structured for AI parsing
- **Citability** - How quotable and attributable

### Recommendations
- Priority-sorted (high/medium/low)
- Location-specific improvements
- Before/after examples
- Clear rationale for each suggestion

## Interactive Artifacts

Results are displayed in a beautiful React dashboard with:
- Score cards with color-coded grades
- Progress bars for key metrics
- Collapsible detailed analysis
- Problematic sentence highlighting
- Semantic triple visualization

## Performance

- **URL Analysis:** ~8-10 seconds
- **Text Analysis:** ~5-7 seconds
- **Cost:** ~$0.14 per analysis (Sonnet 4.5)

## API Tools

### analyze_url

Analyzes published web pages.

**Parameters:**
- `url` (required): URL to analyze
- `query` (optional): Topic context (default: "general content analysis")
- `output_format` (optional): 'detailed' | 'summary'

### analyze_text

Analyzes pasted content.

**Parameters:**
- `content` (required): Text to analyze (min 500 chars)
- `query` (optional): Topic context
- `output_format` (optional): 'detailed' | 'summary'

## Troubleshooting

### "Cannot find module" error
Restart Claude Desktop after adding the config.

### "ANTHROPIC_API_KEY is required" error
Add your Anthropic API key to the `env` section in config.

### "Content too short" error
Minimum 500 characters required for analysis.

### Paywalled content
The analyzer can only access publicly available content.

## Migration from v1.x

v2.0 removes Cloudflare Workers and Jina dependencies:

**Old (v1.x):**
```json
{
  "env": {
    "GEO_WORKER_URL": "https://...",
    "JINA_API_KEY": "jina_..."
  }
}
```

**New (v2.0):**
```json
{
  "env": {
    "ANTHROPIC_API_KEY": "sk-ant-..."
  }
}
```

## Research Foundation

Based on:
- [Generative Engine Optimization (GEO)](https://arxiv.org/abs/2311.09735) - MIT research paper
- Production testing on simracingcockpit.gg
- Analysis of 50+ high-performing AI-cited articles

## Development

```bash
# Clone repository
git clone https://github.com/houtini-ai/geo-analyzer.git
cd geo-analyzer

# Install dependencies
npm install

# Build
npm run build

# Run locally
node dist/index.js
```

## License

MIT © [Houtini.ai](https://houtini.ai)

## Links

- [npm Package](https://www.npmjs.com/package/@houtini/geo-analyzer)
- [GitHub Repository](https://github.com/houtini-ai/geo-analyzer)
- [MIT GEO Research Paper](https://arxiv.org/abs/2311.09735)
- [Houtini.ai](https://houtini.ai)

## Changelog

### v2.0.1 (2024-12-16)
- Fixed Lucide icon destructuring error in artifacts
- Standardized light theme design
- Improved artifact visual consistency

### v2.0.0 (2024-12-16)
- Complete rewrite for local execution
- Removed Cloudflare Workers dependency
- Removed Jina API dependency
- Upgraded to Claude Sonnet 4.5 for semantic analysis
- Added interactive React artifact dashboards
- Simplified setup to single npx command
- Built-in content scraping with cheerio
