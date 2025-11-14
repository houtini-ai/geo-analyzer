# 🚀 GEO Analyzer for Claude Desktop

<div align="center">

[![npm version](https://img.shields.io/npm/v/@houtini/geo-analyzer.svg)](https://www.npmjs.com/package/@houtini/geo-analyzer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)

**Optimize your content for AI-generated search results directly in Claude Desktop**

Get professional Generative Engine Optimization (GEO) analysis without leaving your conversation with Claude. Analyze any URL or text content and receive actionable recommendations based on peer-reviewed research.

[Quick Start](#-quick-start) • [Example Analysis](#-example-analysis) • [Configuration](#-configuration)

</div>

---

## 🎯 What is GEO?

Generative Engine Optimization (GEO) is content optimization for AI search engines like ChatGPT, Claude, Perplexity, and Gemini. Unlike traditional SEO which targets Google's algorithms, GEO focuses on making your content more extractable, citable, and useful for AI systems that generate answers.

### Why GEO Matters

When users ask AI assistants questions, the AI needs to:
1. **Extract** clear facts and claims from your content
2. **Understand** relationships between concepts (semantic triples)
3. **Cite** your content as a trusted source

This tool analyzes how well your content performs on these dimensions and provides specific improvements.

### The Research Behind It

This tool implements methodologies from "GEO: Generative Engine Optimization" by Aggarwal et al. (ACM SIGKDD 2024). The research analyzed 10,000 queries across multiple AI systems to identify what makes content more likely to appear in AI-generated responses.

**Key Finding**: Content with high claim density (4+ verifiable facts per 100 words) and rich semantic structure was 40% more likely to be cited by AI systems.

---

## 📊 Example Analysis

Here's what you get when you analyze a URL:

```
You: Analyze https://simracingcockpit.gg/sim-racing-black-friday-deals-2025/
     for "sim racing Black Friday deals"

Claude: I'll analyze that page for GEO optimization...
```

**Results:**

```json
{
  "summary": {
    "overall_score": 6.1,
    "rating": "Good",
    "primary_issues": [
      "Low extractability score - content may be difficult for AI engines to parse",
      "Limited citability - lacking verifiable claims and semantic triples"
    ],
    "quick_wins": [
      "Increase claim density from 1.5 to 4.0 per 100 words",
      "Add author credentials to establish expertise",
      "Include research citations for trustworthiness"
    ]
  },
  "scores": {
    "overall": 6.1,
    "extractability": 5.3,
    "readability": 7.3,
    "citability": 5.8
  }
}
```

**High Priority Recommendations:**

1. **Claim Density Enhancement** (High Impact)
   - Current: 1.5 claims per 100 words
   - Target: 4.0 claims per 100 words
   - Why: Specific facts and statistics are easier for AI to extract and cite
   - Example: Instead of "great deals available", say "15-20% discounts on Moza Racing wheels"

2. **Add Author Credentials** (High Impact)
   - Missing: Author bio with expertise
   - Add: Professional background in sim racing, years of experience
   - Why: Credentials signal expertise and build trust with AI systems

3. **Include Research Citations** (High Impact)
   - Missing: No authoritative source references
   - Add: Link to manufacturer specifications, industry reports
   - Why: Cited content is 35% more likely to appear in AI responses

---

## ⚡ Quick Start

### Step 1: Deploy Your Cloudflare Worker

The GEO Analyzer requires your own Cloudflare Worker for privacy and control. Deploy in 2 minutes:

```bash
# Clone and setup
git clone https://github.com/houtini-ai/geo-analyzer.git
cd geo-analyzer/packages/cloudflare-worker

# Login to Cloudflare (first time only)
npx wrangler login

# Deploy
npx wrangler deploy
```

**Save your Worker URL** - it looks like:
```
https://geo-analyzer.YOUR-SUBDOMAIN.workers.dev
```

### Step 2: Configure Claude Desktop

**Find your config file:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

**Add this configuration:**

```json
{
  "mcpServers": {
    "geo-analyzer": {
      "command": "npx",
      "args": ["-y", "@houtini/geo-analyzer@latest"],
      "env": {
        "GEO_WORKER_URL": "https://geo-analyzer.YOUR-SUBDOMAIN.workers.dev",
        "JINA_API_KEY": "your-jina-api-key-optional"
      }
    }
  }
}
```

**Configuration Details:**

| Variable | Required | Description |
|----------|----------|-------------|
| `GEO_WORKER_URL` | ✅ **Yes** | Your deployed Cloudflare Worker URL |
| `JINA_API_KEY` | ⚠️ Recommended | Free tier: 1M tokens/month ([Get key](https://jina.ai/reader)) |

**About Jina Reader API:**
- Extracts clean content from web pages (removes ads, navigation, clutter)
- Dramatically improves analysis accuracy
- Free tier sufficient for most users
- Without it: Analysis uses basic extraction (less accurate)

### Step 3: Restart Claude Desktop

Close Claude Desktop completely and reopen it. The MCP server will connect automatically.

### Step 4: Test It

Ask Claude:

```
Analyze https://example.com for "your topic here"
```

Claude will use the GEO Analyzer tool and provide detailed metrics with recommendations.

---

## 💡 How to Use

### Analyze Any URL

```
Analyze https://yoursite.com/article for "content marketing tips"
```

**What you get:**
- Overall GEO score (0-10)
- Extractability, readability, and citability scores
- Claim density analysis
- Semantic triple extraction
- Prioritized recommendations with before/after examples

### Analyze Text Content

```
Analyze this text for GEO optimization:

[Paste your content here]

Target query: "your topic"
```

**Perfect for:**
- Draft content before publishing
- Comparing different writing approaches
- Quick optimization checks

### Real Example

**User Query:**
```
Analyze this content about my company:

The name Basic Machines comes from computational theory, where complex 
systems can be built by combining simple, understandable parts. We believe 
technology should enhance human agency, not diminish it.
```

**Claude's Response:**
```json
{
  "overall_score": 4.2,
  "rating": "Fair",
  "primary_issues": [
    "Zero claim density - no verifiable facts",
    "No structural headings",
    "Missing author credentials"
  ],
  "quick_wins": [
    "Add specific metrics: 'Founded in 2023', '1,000+ developers'",
    "Include headings: 'Our Philosophy', 'What We Build'",
    "Add author byline with credentials"
  ]
}
```

**High Priority Fixes:**
1. Add claim density: "Founded in 2023 by [name], Basic Machines has helped 1,000+ developers..."
2. Add structure with headings
3. Include temporal markers: "As of 2024..."
4. Add author credentials

---

## 🎨 Key Metrics Explained

### Extractability Score (0-10)

**What it measures:** How easily AI systems can pull discrete facts from your content

**Factors:**
- **Sentence length**: Target 15-20 words (AI parses better)
- **Claim density**: Target 4+ verifiable claims per 100 words
- **Temporal markers**: Dates provide freshness signals ("As of 2024...")

**Example - Low Extractability (Score: 3.3):**
> "We make great tools that help people build better websites efficiently"

**Example - High Extractability (Score: 8.5):**
> "Since 2023, Basic Machines has served 1,200+ developers. Our framework reduces bundle size by 40% compared to Next.js."

### Readability Score (0-10)

**What it measures:** How well-structured your content is for AI parsing

**Factors:**
- Clear heading hierarchy
- List formatting
- Logical section breaks
- Average section length

**Low Readability:** Wall of text, no structure
**High Readability:** Clear sections with descriptive headers

### Citability Score (0-10)

**What it measures:** How quotable and attributable your content is

**Factors:**
- **Semantic triples**: Subject-predicate-object relationships
  - Example: "Claude" → "supports" → "Model Context Protocol"
- **Entity diversity**: Mix of PERSON, ORG, PRODUCT entities
- **Named references**: Specific people, companies, products (not generic "we", "it", "they")

**Low Citability:** Vague references, no specific entities
**High Citability**: Rich with specific names, clear relationships, verifiable claims

---

## 🔧 Advanced Features

### Choose Your AI Model

The tool supports multiple Cloudflare AI models. Specify in your request:

```
Analyze https://example.com using Mistral model for "your query"
```

**Available Models:**

| Model | Speed | Quality | Best For |
|-------|-------|---------|----------|
| `llama-3.3-70b` (default) | Fast | Highest | Production use |
| `llama-3-8b` | Faster | Good | Quick checks |
| `llama-3.1-8b` | Fastest | Basic | Development |
| `mistral-7b` | Fast | Alternative | Testing |

### Output Format Options

**Detailed (Default):**
```
Analyze https://example.com - give me detailed output
```
- Full metrics
- All recommendations
- Complete examples

**Summary:**
```
Analyze https://example.com - just give me a summary
```
- Key scores only
- Top 3 issues
- Quick wins

---

## 🏗️ Architecture & Privacy

### How It Works

```
Claude Desktop
    ↓ (MCP Protocol)
MCP Server (Local on your machine)
    ↓ (HTTPS)
Your Cloudflare Worker
    ↓ (Content fetch)
Jina Reader API (optional)
    ↓ (Semantic analysis)
Cloudflare Workers AI (Llama 3.3)
```

### Privacy & Security

**Your Data:**
- ✅ No storage: Content analyzed in real-time only
- ✅ No tracking: Zero analytics or logging
- ✅ Your infrastructure: Runs on your Cloudflare account
- ✅ Your logs: Only you can access Worker metrics

**Why Self-Hosted:**
- Complete privacy control
- No shared API quotas
- Scalable (free tier sufficient)
- No central authentication

---

## 🛠️ Troubleshooting

### ❌ Tools Don't Appear in Claude

**Solution:**
1. Restart Claude Desktop **completely** (close all windows)
2. Verify config file location:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
3. Check JSON syntax at [JSONLint](https://jsonlint.com/)
4. Ensure `GEO_WORKER_URL` has NO trailing slash
5. Verify Worker is deployed: Visit URL in browser (should show `{"error":"Not found"}`)

### ❌ Analysis Fails with Error

**Check:**
1. Worker URL is correct (from `wrangler deploy` output)
2. Page is publicly accessible (not behind login)
3. Jina API key is valid (if using one)
4. Cloudflare Workers AI is enabled in your account

**Test Worker directly:**
```bash
cd packages/cloudflare-worker
npx wrangler tail
```

Run an analysis and watch for errors in real-time.

### ❌ "Environment variable not set"

**This means:**
- MCP server started but didn't receive `GEO_WORKER_URL`
- Check your Claude Desktop config JSON syntax
- Ensure no typos in variable names
- Restart Claude Desktop after config changes

### Get Help

1. Check Worker logs: `npx wrangler tail`
2. Test Worker in browser: Visit your Worker URL
3. Validate JSON config: Use JSONLint
4. Review MCP server logs (check Claude Desktop logs directory)

---

## 📋 Prerequisites

Before setup, you'll need:

- ✅ **Cloudflare Account** (free tier works) - [Sign up](https://dash.cloudflare.com/sign-up)
- ✅ **Claude Desktop** with MCP support - [Download](https://claude.ai/download)
- ✅ **Node.js 20+** - [Download](https://nodejs.org/)
- ⚠️ **Jina AI API Key** (recommended) - [Get free key](https://jina.ai/reader)

**Jina Reader Benefits:**
- 1M tokens/month free (250+ page analyses daily)
- Clean content extraction
- Better analysis accuracy
- Still works without it (uses basic extraction)

---

## 💰 Cost

**Cloudflare Workers:**
- Free tier: 100,000 requests/day
- Workers AI: 10,000 neurons/day free
- Typical analysis: ~50 neurons
- **Effectively free for personal use**

**Jina Reader API:**
- Free tier: 1M tokens/month
- Typical page: 2,000-5,000 tokens
- **200+ analyses per day free**

**Total monthly cost for typical use: $0**

---

## 🗺️ What's Next

### Planned Features

- Batch analysis: Process entire sitemaps
- Historical tracking: Monitor GEO scores over time
- Competitor analysis: Automated comparison reports
- WordPress plugin: Direct CMS integration
- CI/CD integration: Automated content checks

### Contributing

Found a bug? Have a feature idea? 

1. Open an issue on GitHub
2. Submit a PR
3. Contact: hello@houtini.ai

---

## 📚 Learn More

**Research Paper:**  
Aggarwal, P., et al. (2024). *GEO: Generative Engine Optimization.*  
ACM SIGKDD Conference ([arXiv:2311.09735](https://arxiv.org/abs/2311.09735))

**Key Findings:**
- Claim density is the strongest predictor of AI citation
- Semantic triples improve extraction by 40%
- Traditional keyword stuffing reduces AI visibility
- Entity diversity signals content comprehensiveness

---

**Built with ❤️ by [Houtini](https://houtini.ai)**

*Making AI infrastructure accessible to everyone*

Contact: hello@houtini.ai
