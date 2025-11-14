# Quick MCP Fix Checklist

## Current Status
- ✅ Worker deployed and working (confirmed via PowerShell tests)
- ✅ Worker endpoints tested and functional
- ❌ MCP server not passing JINA_API_KEY to worker
- ✅ Code changes committed and pushed

## Immediate Action Required

### Step 1: Restart Claude Desktop
The config now uses local build instead of npx to avoid caching issues.

### Step 2: Check the Logs
```powershell
Get-Content "C:\Users\Richard Baxter\AppData\Roaming\Claude\logs\mcp-server-geo-analyzer.log" -Tail 50
```

Look for:
- Server version (should be 1.0.6 or higher, NOT 1.0.0)
- Warning about JINA_API_KEY (if it's missing)
- Any error messages

### Step 3: Test the MCP Tool
Try calling the analyze_url tool with a simple URL:
```
analyze_url: https://example.com
query: test
```

Expected: Should return full analysis
Actual (if broken): 404 or 500 error

### Step 4: If Still Broken - Add Debug Logging
Edit: C:\MCP\geo-analyzer\packages\mcp-server\src\index.ts

After line 11, add:
```typescript
console.error('=== MCP DEBUG ===');
console.error('GEO_WORKER_URL:', GEO_API_URL);
console.error('JINA_API_KEY:', JINA_API_KEY ? 'SET (length: ' + JINA_API_KEY.length + ')' : 'UNDEFINED');
console.error('=================');
```

Then rebuild:
```powershell
cd C:\MCP\geo-analyzer\packages\mcp-server
npm run build
```

Restart Claude Desktop and check logs again.

### Step 5: Nuclear Option - Test Standalone
If nothing works, test the MCP server independently:

```powershell
cd C:\MCP\geo-analyzer\packages\mcp-server
$env:GEO_WORKER_URL="https://geo-analyzer.fluidjobs.workers.dev"
$env:JINA_API_KEY="jina_acd9dc7ee529415b8bd3dc6af6d28524yrbtI0a3BwHu-mldhugV4CHJluja"
node dist/index.js
```

This will show if the problem is Node.js not receiving env vars from Claude Desktop.

## Root Cause Possibilities

1. **npx caching** (bypassed by using local build)
2. **Claude Desktop not passing env vars** (test with debug logging)
3. **Windows process spawning issue** (test standalone)
4. **JSON.stringify stripping undefined** (confirmed, but why is it undefined?)

## Files to Check
- Config: `C:\Users\Richard Baxter\AppData\Roaming\Claude\claude_desktop_config.json`
- Logs: `C:\Users\Richard Baxter\AppData\Roaming\Claude\logs\mcp-server-geo-analyzer.log`
- Source: `C:\MCP\geo-analyzer\packages\mcp-server\src\index.ts`
- Built: `C:\MCP\geo-analyzer\packages\mcp-server\dist\index.js`
