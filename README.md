# GEO Analyzer

[![npm version](https://img.shields.io/npm/v/@houtini/geo-analyzer)](https://www.npmjs.com/package/@houtini/geo-analyzer)
[![Known Vulnerabilities](https://snyk.io/test/github/houtini-ai/geo-analyzer/badge.svg)](https://snyk.io/test/github/houtini-ai/geo-analyzer)
[![MCP Registry](https://img.shields.io/badge/MCP-Registry-blue?style=flat-square)](https://registry.modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Status: Prototype** - This was our initial implementation. We've since built a production version at [aiseo.houtini.com](https://aiseo.houtini.com) using Gemini 3.0 Flash (the API behind Google Search) for better semantic intelligence.

Content analysis for AI search visibility. Measures what actually matters when ChatGPT, Claude, Perplexity, and Google AI Overviews decide which sources to cite.

## What This Does

I built this to answer a specific question: what makes content quotable to AI systems? Not what we think should matter, but what actually moves the needle when AI models scan thousands of sources.

The analyser examines content for signals AI systems use:

- **Claim Density** - Extractable facts per 100 words (target: 4+)
- **Information Density** - Optimal word count vs predicted AI coverage
- **Answer Frontloading** - How quickly you provide the answer (not buried in paragraph 5)
- **Semantic Triples** - Structured relationships AI can extract cleanly
- **Entity Recognition** - Named entities AI can reference without ambiguity
- **Sentence Structure** - Length optimised for AI chunking (~15 words)

This runs locally using Claude Sonnet 4.5 for semantic extraction. No external services. Your content doesn't leave your machine.

## Installation

### Claude Desktop

Add this to your `claude_desktop_config.json`:

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

**Config locations:**
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

Restart Claude Desktop after saving.

### Requirements

- Node.js 18+ (20+ recommended)
- Anthropic API key from [console.anthropic.com](https://console.anthropic.com)

## Usage

### Analyse a Published URL

```
Analyse https://example.com/article for "topic keywords"
```

The topic context helps score relevance but isn't required:

```
Analyse https://example.com/article
```

### Analyse Text Directly

Paste content for analysis (minimum 500 characters):

```
Analyse this content for "sim racing wheels":

[Your content here]
```

### Summary Mode

Get condensed output without detailed recommendations:

```
Analyse https://example.com/article with output_format=summary
```

## What You Get

### Scores (0-10)

| Score | What It Measures |
|-------|----------|
| **Overall** | Weighted average of all factors |
| **Extractability** | How easily AI can pull facts |
| **Readability** | Structure quality for AI parsing |
| **Citability** | How quotable and attributable your content is |

### Key Metrics

**Information Density:**
- Word count with coverage prediction
- Optimal range: 800-1,500 words
- What I've found: pages under 1K words get ~61% AI coverage, whilst pages over 3K words drop to ~13%

**Answer Frontloading:**
- Claims and entities in first 100/300 words
- Position of first claim
- Score showing how quickly you answer the question

**Claim Density:**
- Target: 4+ claims per 100 words
- Extractable facts, statistics, measurements
- This is critical - AI needs facts to cite, not fluff

**Sentence Length:**
- Target: 15-20 words average
- Matches Google's ~15.5 word chunk extraction pattern

### Recommendations

You'll get prioritised suggestions with:
- Specific locations in your content
- Before/after examples where relevant
- Rationale based on research (not guesswork)

## Tools

### analyze_url

Fetches and analyses published web pages.

| Parameter | Required | What It Does |
|-----------|----------|-------------|
| `url` | Yes | URL to analyse |
| `query` | No | Topic context for relevance scoring |
| `output_format` | No | `detailed` (default) or `summary` |

### analyze_text

Analyses pasted content directly.

| Parameter | Required | What It Does |
|-----------|----------|-------------|
| `content` | Yes | Text to analyse (min 500 chars) |
| `query` | No | Topic context for relevance scoring |
| `output_format` | No | `detailed` (default) or `summary` |

## Troubleshooting

**"ANTHROPIC_API_KEY is required"**
Add your API key to the `env` section in config.

**"Cannot find module" after config change**
Restart Claude Desktop completely. I mean fully close and reopen it.

**"Content too short"**
Minimum 500 characters required. The semantic analysis needs enough text to work with.

**Paywalled content returns errors**
The analyser can only access publicly available pages. It's not going to bypass authentication.

## Performance

- URL analysis: ~8-10 seconds
- Text analysis: ~5-7 seconds  
- Cost: ~$0.14 per analysis (Sonnet 4.5 pricing)

## Migration from v1.x

v2.0 removed external dependencies. Update your config:

**Old (v1.x):**
```json
{
  "env": {
    "GEO_WORKER_URL": "https://...",
    "JINA_API_KEY": "jina_..."
  }
}
```

**New (v2.x):**
```json
{
  "env": {
    "ANTHROPIC_API_KEY": "sk-ant-..."
  }
}
```

## What This Is Based On

The analysis methodology comes from peer-reviewed research and empirical studies, not marketing intuition.

### MIT GEO Paper (2024)
Aggarwal et al., "GEO: Generative Engine Optimization" - ACM SIGKDD

Key findings I've applied:
- Claim density target of 4+ per 100 words
- Optimal sentence length of 15-20 words
- 40% improvement in AI citation rates with extractability focus

[arxiv.org/abs/2311.09735](https://arxiv.org/abs/2311.09735)

### Dejan AI Grounding Research (2025)
Empirical analysis of 7,060 queries and 2,275 pages

What matters from their findings:
- ~2,000 word total grounding budget per query
- Rank #1 source gets 531 words (28% of budget)
- Rank #5 source gets 266 words (13% of budget)
- Average extraction chunk: 15.5 words
- Pages <1K words: 61% coverage
- Pages 3K+ words: 13% coverage

[dejan.ai/blog/how-big-are-googles-grounding-chunks](https://dejan.ai/blog/how-big-are-googles-grounding-chunks/)  
[dejan.ai/blog/googles-ranking-signals](https://dejan.ai/blog/googles-ranking-signals/)

### Production Testing
I've tested this across SimRacingCockpit.gg content and analysed 50+ high-performing AI-cited articles to validate the patterns.

## Development

```bash
git clone https://github.com/houtini-ai/geo-analyzer.git
cd geo-analyzer
npm install
npm run build
```

Test locally:
```bash
node dist/index.js
```

## About the Production Version

Whilst this MCP prototype works well, we've built [aiseo.houtini.com](https://aiseo.houtini.com) with Gemini 3.0 Flash for production use. Gemini powers Google Search, which means better semantic understanding and more reliable entity extraction. Worth checking out if you're doing this at scale.

---

MIT License - [Houtini.ai](https://houtini.ai)
