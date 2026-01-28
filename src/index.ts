#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as z from 'zod';
import { GeoAnalyzer } from './services/geo-analyzer.js';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY environment variable is required');
  process.exit(1);
}

const geoAnalyzer = new GeoAnalyzer(ANTHROPIC_API_KEY);

const server = new McpServer({
  name: 'geo-analyzer',
  version: '2.1.0',
});

// Register analyze_url tool
server.registerTool(
  'analyze_url',
  {
    title: 'Analyze URL for GEO',
    description:
      'Analyze a published URL for AI search optimization. Performs comprehensive content quality analysis including AI slop detection, writing quality, E-E-A-T signals, and actionability.',
    inputSchema: {
      url: z.string().describe('The URL to analyze'),
      query: z
        .string()
        .optional()
        .describe(
          'Optional context string describing the content topic (e.g., "sim racing wheels", "content optimization"). Used for relevance scoring only. Defaults to "general content analysis".'
        ),
      output_format: z
        .enum(['detailed', 'summary'])
        .optional()
        .default('detailed')
        .describe(
          'Output verbosity: "detailed" (default) includes all suggestions and recommendations; "summary" provides condensed results'
        ),
    },
    outputSchema: {
      report: z.string(),
    },
  },
  async ({ url, query, output_format }) => {
    if (!url || typeof url !== 'string') {
      throw new Error('url parameter is required and must be a string');
    }

    const report = await geoAnalyzer.analyze({
      url,
      query: query || 'general content analysis',
      outputFormat: output_format || 'detailed',
    });

    return {
      content: [{ type: 'text', text: report }],
      structuredContent: { report },
    };
  }
);

// Register analyze_text tool
server.registerTool(
  'analyze_text',
  {
    title: 'Analyze Text for GEO',
    description:
      'Analyze pasted text content for AI search optimization. Performs comprehensive content quality analysis including AI slop detection, writing quality, E-E-A-T signals, data points, originality, and actionability.',
    inputSchema: {
      content: z.string().describe('The text content to analyze (markdown, plain text, or HTML)'),
      query: z
        .string()
        .optional()
        .describe(
          'Optional context string describing the content topic (e.g., "sim racing equipment", "SEO guide"). Used for relevance scoring only. Defaults to "general content analysis".'
        ),
      output_format: z
        .enum(['detailed', 'summary'])
        .optional()
        .default('detailed')
        .describe(
          'Output verbosity: "detailed" (default) includes all suggestions and recommendations; "summary" provides condensed results'
        ),
    },
    outputSchema: {
      report: z.string(),
    },
  },
  async ({ content, query, output_format }) => {
    if (!content || typeof content !== 'string') {
      throw new Error('content parameter is required and must be a string');
    }

    if (content.length < 500) {
      throw new Error('Content too short (minimum 500 characters required)');
    }

    const report = await geoAnalyzer.analyze({
      content,
      query: query || 'general content analysis',
      outputFormat: output_format || 'detailed',
    });

    return {
      content: [{ type: 'text', text: report }],
      structuredContent: { report },
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  process.exit(1);
});
