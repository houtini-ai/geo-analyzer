# GEO Analyzer MCP Debugging Prompt

## Context
The @houtini/geo-analyzer MCP server is failing to pass the JINA_API_KEY environment variable to the Cloudflare Worker, causing analyze_url to fail with 404 errors.

## Confirmed Working Components
✅ Cloudflare Worker is deployed and functional at: https://geo-analyzer.fluidjobs.workers.dev
✅ Worker /health endpoint returns: {"status":"healthy","version":"1.0.0"}
✅ Worker /api/analyze-text endpoint works WITHOUT Jina API key
✅ Worker /api/analyze endpoint works WITH Jina API key in request body
✅ Direct PowerShell tests confirm all worker endpoints function correctly

## The Problem
The MCP server receives JINA_API_KEY as undefined from Claude Desktop, causing JSON.stringify() to omit it from the request body sent to the worker.

## Claude Desktop Configuration
Located at: C:\Users\Richard Baxter\AppData\Roaming\Claude\claude_desktop_config.json

Current config:
```json
"geo-analyzer": {
  "command": "node",
  "args": ["C:\\MCP\\geo-analyzer\\packages\\mcp-server\\dist\\index.js"],
  "env": {
    "GEO_WORKER_URL": "https://geo-analyzer.fluidjobs.workers.dev",
    "JINA_API_KEY": "jina_acd9dc7ee529415b8bd3dc6af6d28524yrbtI0a3BwHu-mldhugV4CHJluja"
  }
}
```

## Expected Request/Response Examples

### 1. analyze_text Tool (Working)
**MCP Tool Call:**
```json
{
  "name": "analyze_text",
  "arguments": {
    "content": "Black Friday deals are coming soon...",
    "query": "sim racing deals",
    "output_format": "detailed"
  }
}
```

**MCP Should Send to Worker:**
```json
POST https://geo-analyzer.fluidjobs.workers.dev/api/analyze-text
Content-Type: application/json

{
  "content": "Black Friday deals are coming soon...",
  "query": "sim racing deals",
  "aiModel": null
}
```

**Worker Should Return:**
```json
{
  "request": {
    "query": "sim racing deals",
    "analyzedAt": "2025-11-14T..."
  },
  "geoAnalysis": {
    "scores": {
      "overall": 2.0,
      "extractability": 1.0,
      "readability": 2.7,
      "citability": 2.6
    },
    "recommendations": [...]
  },
  "usage": {...},
  "meta": {...}
}
```

### 2. analyze_url Tool (Currently Failing)
**MCP Tool Call:**
```json
{
  "name": "analyze_url",
  "arguments": {
    "url": "https://example.com",
    "query": "test analysis",
    "output_format": "detailed"
  }
}
```

**MCP Should Send to Worker:**
```json
POST https://geo-analyzer.fluidjobs.workers.dev/api/analyze
Content-Type: application/json

{
  "url": "https://example.com",
  "query": "test analysis",
  "jinaApiKey": "jina_acd9dc7ee529415b8bd3dc6af6d28524yrbtI0a3BwHu-mldhugV4CHJluja",
  "aiModel": null
}
```

**What Actually Happens (Bug):**
The MCP sends:
```json
{
  "url": "https://example.com",
  "query": "test analysis",
  "aiModel": null
}
```
Note: `jinaApiKey` field is MISSING because `JINA_API_KEY` is undefined and JSON.stringify() strips undefined values.

**Worker Returns 500 Error:**
```json
{
  "error": "Jina Reader failed: 401"
}
```

## MCP Server Code Location
File: C:\MCP\geo-analyzer\packages\mcp-server\src\index.ts

Key sections:
- Line 10-11: Environment variable reading
- Line 13-33: GEO_WORKER_URL validation (works)
- Line 35-56: JINA_API_KEY validation (newly added, should show warning)
- Line 238-250: analyze_url request construction (where jinaApiKey should be passed)
- Line 293-305: analyze_text request construction

## Debugging Tasks

### Task 1: Verify Environment Variable Reception
Add logging to see what the MCP process actually receives:
```typescript
console.error('DEBUG: GEO_WORKER_URL =', process.env.GEO_WORKER_URL);
console.error('DEBUG: JINA_API_KEY =', process.env.JINA_API_KEY ? 'SET' : 'UNDEFINED');
```

### Task 2: Check Logs After Restart
Location: C:\Users\Richard Baxter\AppData\Roaming\Claude\logs\mcp-server-geo-analyzer.log

Look for:
- Warning message about missing JINA_API_KEY
- Server version number (should be 1.0.6, not 1.0.0)
- Any error messages during initialization

### Task 3: Test MCP Server Directly
Run the MCP server with explicit environment variables:
```powershell
$env:GEO_WORKER_URL="https://geo-analyzer.fluidjobs.workers.dev"
$env:JINA_API_KEY="jina_acd9dc7ee529415b8bd3dc6af6d28524yrbtI0a3BwHu-mldhugV4CHJluja"
node C:\MCP\geo-analyzer\packages\mcp-server\dist\index.js
```

### Task 4: Alternative: Use Local Build Instead of npm
The Claude Desktop config has been updated to use the local build:
```json
"command": "node",
"args": ["C:\\MCP\\geo-analyzer\\packages\\mcp-server\\dist\\index.js"]
```

This bypasses npx caching issues entirely.

## Success Criteria
After fixing, this should work:
1. Start Claude Desktop
2. Check logs show version 1.0.6 and either no warning or warning about JINA_API_KEY
3. Call analyze_url tool
4. Receive full analysis results (not 404/500 error)

## Questions to Answer
1. Does the MCP server log show the JINA_API_KEY warning?
2. What version does the server report in logs (should be 1.0.6)?
3. If using local build, does it receive the environment variables?
4. Is there a Windows-specific issue with how Node.js receives env vars from Claude Desktop?

## Next Steps After Diagnosis
- If env vars aren't reaching the process: Investigate Claude Desktop's process spawning
- If env vars are received but still failing: Add more granular logging to trace the request
- If nothing works: Consider alternative approaches (config file, hardcoded values for testing)
