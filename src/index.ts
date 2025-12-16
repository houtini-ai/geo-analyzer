#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { GeoAnalyzer } from './services/geo-analyzer.js';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY environment variable is required');
  process.exit(1);
}

const geoAnalyzer = new GeoAnalyzer(ANTHROPIC_API_KEY);

const server = new Server(
  {
    name: 'geo-analyzer',
    version: '2.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'analyze_url',
      description:
        'Analyze a published URL for AI search optimization. Performs comprehensive content quality analysis including AI slop detection, writing quality, E-E-A-T signals, and actionability.',
      inputSchema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The URL to analyze',
          },
          query: {
            type: 'string',
            description:
              'Optional context string describing the content topic (e.g., "sim racing wheels", "content optimization"). Used for relevance scoring only. Defaults to "general content analysis".',
          },
          output_format: {
            type: 'string',
            enum: ['detailed', 'summary'],
            default: 'detailed',
            description:
              'Output verbosity: "detailed" (default) includes all suggestions and recommendations; "summary" provides condensed results',
          },
        },
        required: ['url'],
      },
    },
    {
      name: 'analyze_text',
      description:
        'Analyze pasted text content for AI search optimization. Performs comprehensive content quality analysis including AI slop detection, writing quality, E-E-A-T signals, data points, originality, and actionability.',
      inputSchema: {
        type: 'object',
        properties: {
          content: {
            type: 'string',
            description: 'The text content to analyze (markdown, plain text, or HTML)',
          },
          query: {
            type: 'string',
            description:
              'Optional context string describing the content topic (e.g., "sim racing equipment", "SEO guide"). Used for relevance scoring only. Defaults to "general content analysis".',
          },
          output_format: {
            type: 'string',
            enum: ['detailed', 'summary'],
            default: 'detailed',
            description:
              'Output verbosity: "detailed" (default) includes all suggestions and recommendations; "summary" provides condensed results',
          },
        },
        required: ['content'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'analyze_url') {
      const { url, query, output_format } = args as {
        url: string;
        query?: string;
        output_format?: 'detailed' | 'summary';
      };

      if (!url || typeof url !== 'string') {
        throw new Error('url parameter is required and must be a string');
      }

      const result = await geoAnalyzer.analyze({
        url,
        query: query || 'general content analysis',
        outputFormat: output_format || 'detailed',
      });

      const content: any[] = [
        {
          type: 'text',
          text: result.report,
        },
      ];

      if (result.artifactPrompt && output_format === 'detailed') {
        content.push({
          type: 'text',
          text: '\n\n---\n\n' + result.artifactPrompt,
        });
      }

      return {
        content,
      };
    }

    if (name === 'analyze_text') {
      const { content, query, output_format } = args as {
        content: string;
        query?: string;
        output_format?: 'detailed' | 'summary';
      };

      if (!content || typeof content !== 'string') {
        throw new Error('content parameter is required and must be a string');
      }

      if (content.length < 500) {
        throw new Error('Content too short (minimum 500 characters required)');
      }

      const result = await geoAnalyzer.analyze({
        content,
        query: query || 'general content analysis',
        outputFormat: output_format || 'detailed',
      });

      const responseContent: any[] = [
        {
          type: 'text',
          text: result.report,
        },
      ];

      if (result.artifactPrompt && output_format === 'detailed') {
        responseContent.push({
          type: 'text',
          text: '\n\n---\n\n' + result.artifactPrompt,
        });
      }

      return {
        content: responseContent,
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  process.exit(1);
});
