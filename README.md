# GEO Analyzer

[![npm version](https://img.shields.io/npm/v/@houtini/geo-analyzer)](https://www.npmjs.com/package/@houtini/geo-analyzer)
[![Known Vulnerabilities](https://snyk.io/test/github/houtini-ai/geo-analyzer/badge.svg)](https://snyk.io/test/github/houtini-ai/geo-analyzer)
${badge_line}
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Content analysis for AI search visibility. Measures what actually matters for getting cited by ChatGPT, Claude, Perplexity, and Google AI Overviews.

## What It Does

GEO Analyzer examines content for the signals AI systems use when selecting sources to cite:

- **Claim Density** - Extractable facts per 100 words
- **Information Density** - Word count vs predicted AI coverage
- **Answer Frontloading** - How quickly key information appears
- **Semantic Triples** - Structured (subject, predicate, object) relationships
- **Entity Recognition** - Named entities AI can reference
- **Sentence Structure** - Optimal length for AI parsing

The analysis runs locally using Claude Sonnet 4.5 for semantic extraction. No external services, no data leaving your machine.

## Installation

### Claude Desktop

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

**Config locations:**
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

Restart Claude Desktop after saving.

### Requirements

- Node.js 20+
- Anthropic API key ([console.anthropic.com](https://console.anthropic.com))

## Usage Examples

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

## Output

### Scores (0-10)

| Score | Measures |
|-------|----------|
| **Overall** | Weighted average of all factors |
| **Extractability** | How easily AI can extract facts |
| **Readability** | Structure quality for AI parsing |
| **Citability** | How quotable and attributable |

### Key Metrics

**Information Density:**
- Word count with coverage prediction
- Optimal range: 800-1,500 words
- Pages under 1K words: ~61% AI coverage
- Pages over 3K words: ~13% AI coverage

**Answer Frontloading:**
- Claims and entities in first 100/300 words
- First claim position
- Score indicating answer immediacy

**Claim Density:**
- Target: 4+ claims per 100 words
- Extractable facts, statistics, measurements

**Sentence Length:**
- Target: 15-20 words average
- Matches Google's ~15.5 word chunk extraction

### Recommendations

Prioritised suggestions with:
- Specific locations in content
- Before/after examples
- Rationale based on research

## Tools

### analyze_url

Fetches and analyses published web pages.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `url` | Yes | URL to analyse |
| `query` | No | Topic context for relevance scoring |
| `output_format` | No | `detailed` (default) or `summary` |

### analyze_text

Analyses pasted content directly.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `content` | Yes | Text to analyse (min 500 chars) |
| `query` | No | Topic context for relevance scoring |
| `output_format` | No | `detailed` (default) or `summary` |

## Troubleshooting

**"ANTHROPIC_API_KEY is required"**
Add your API key to the `env` section in config.

**"Cannot find module" after config change**
Restart Claude Desktop completely.

**"Content too short"**
Minimum 500 characters required for meaningful analysis.

**Paywalled content returns errors**
The analyser can only access publicly available pages.

## Performance

- URL analysis: ~8-10 seconds
- Text analysis: ~5-7 seconds  
- Cost: ~$0.14 per analysis (Sonnet 4.5)

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

## Development

```bash
git clone https://github.com/houtini-ai/geo-analyzer.git
cd geo-analyzer
npm install
npm run build
```

## Research Foundation

The analysis methodology draws from peer-reviewed research and empirical studies:

### MIT GEO Paper (2024)
Aggarwal et al., "GEO: Generative Engine Optimization" - ACM SIGKDD

Key findings applied:
- Claim density target of 4+ per 100 words
- Optimal sentence length of 15-20 words
- 40% improvement in AI citation rates with extractability focus

[arxiv.org/abs/2311.09735](https://arxiv.org/abs/2311.09735)

### Dejan AI Grounding Research (2025)
Empirical analysis of 7,060 queries and 2,275 pages

Key findings applied:
- ~2,000 word total grounding budget per query
- Rank #1 source gets 531 words (28% of budget)
- Rank #5 source gets 266 words (13% of budget)
- Average extraction chunk: 15.5 words
- Pages <1K words: 61% coverage
- Pages 3K+ words: 13% coverage

[dejan.ai/blog/how-big-are-googles-grounding-chunks](https://dejan.ai/blog/how-big-are-googles-grounding-chunks/)  
[dejan.ai/blog/googles-ranking-signals](https://dejan.ai/blog/googles-ranking-signals/)

---

MIT License - [Houtini.ai](https://houtini.ai)
