import { readFileSync } from 'node:fs';

/**
 * The single source of truth for the server version.
 *
 * Read from package.json at runtime rather than hardcoded, so the MCP handshake
 * and the analysis payload can never drift from the published version - they had
 * both drifted by 3.0.4 (index.ts said 3.0.3, the analysis said 3.0.1).
 */
export const SERVER_VERSION: string = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8')
).version;
