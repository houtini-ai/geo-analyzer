#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const GEO_API_URL = process.env.GEO_WORKER_URL;
const JINA_API_KEY = process.env.JINA_API_KEY;

if (!GEO_API_URL) {
  console.error('\n❌ ERROR: GEO_WORKER_URL environment variable is required.\n');
  console.error('The GEO Analyzer MCP requires you to deploy your own Cloudflare Worker.');
  console.error('There is no public endpoint to protect your privacy and prevent abuse.\n');
  console.error('To fix this:');
  console.error('1. Deploy your own Cloudflare Worker (free tier works):');
  console.error('   cd packages/cloudflare-worker');
  console.error('   npx wrangler deploy\n');
  console.error('2. Add your Worker URL to Claude Desktop config:');
  console.error('   {');
  console.error('     "mcpServers": {');
  console.error('       "geo-analyzer": {');
  console.error('         "command": "...",');
  console.error('         "env": {');
  console.error('           "GEO_WORKER_URL": "https://your-worker.your-subdomain.workers.dev"');
  console.error('         }');
  console.error('       }');
  console.error('     }');
  console.error('   }\n');
  console.error('See README.md for full deployment instructions.');
  console.error('');
  process.exit(1);
}

if (!JINA_API_KEY) {
  console.error('\n⚠️  WARNING: JINA_API_KEY environment variable is not set.\n');
  console.error('The analyze_url tool requires a Jina Reader API key to fetch web content.');
  console.error('Without it, only analyze_text will work.\n');
  console.error('To fix this:');
  console.error('1. Get a free API key from https://jina.ai/reader');
  console.error('2. Add it to your Claude Desktop config:');
  console.error('   {');
  console.error('     "mcpServers": {');
  console.error('       "geo-analyzer": {');
  console.error('         "command": "npx",');
  console.error('         "args": ["-y", "@houtini/geo-analyzer@latest"],');
  console.error('         "env": {');
  console.error('           "GEO_WORKER_URL": "https://your-worker.workers.dev",');
  console.error('           "JINA_API_KEY": "your-jina-api-key-here"');
  console.error('         }');
  console.error('       }');
  console.error('     }');
  console.error('   }\n');
}

interface DetailedAnalysisResult {
  summary: {
    overall_score: number;
    rating: string;
    primary_issues: string[];
    quick_wins: string[];
  };
  scores: {
    overall: number;
    extractability: number;
    readability: number;
    citability: number;
  };
  detailed_analysis: any;
  recommendations: {
    high_priority: any[];
    medium_priority: any[];
    low_priority: any[];
  };
}

function formatDetailedAnalysis(rawResult: any): DetailedAnalysisResult {
  const scores = rawResult.geoAnalysis?.scores || {};
  const recommendations = rawResult.geoAnalysis?.recommendations || [];
  
  const getRating = (score: number): string => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Fair';
    return 'Needs Improvement';
  };

  const identifyPrimaryIssues = (scores: any, metrics: any): string[] => {
    const issues: string[] = [];
    
    if (scores.extractability < 6) {
      issues.push('Low extractability score - content may be difficult for AI engines to parse');
    }
    if (scores.readability < 6) {
      issues.push('Readability issues detected - content may be too complex or poorly structured');
    }
    if (scores.citability < 6) {
      issues.push('Limited citability - lacking verifiable claims and semantic triples');
    }
    
    if (metrics?.sentenceLength?.problematic?.length > 5) {
      issues.push('Multiple sentences exceed optimal length for AI processing');
    }
    
    if (metrics?.claimDensity?.weakSections?.length > 3) {
      issues.push('Several content sections lack sufficient factual claims');
    }
    
    return issues.slice(0, 5);
  };

  const identifyQuickWins = (recommendations: any[]): string[] => {
    return recommendations
      .slice(0, 3)
      .map(rec => `${rec.method}: ${rec.details}`)
      .filter(Boolean);
  };

  const prioritiseRecommendations = (recommendations: any[]) => {
    const high_priority: any[] = [];
    const medium_priority: any[] = [];
    const low_priority: any[] = [];
    
    recommendations.forEach(rec => {
      if (rec.impact === 'high' || rec.priority === 'high') {
        high_priority.push(rec);
      } else if (rec.impact === 'medium' || rec.priority === 'medium') {
        medium_priority.push(rec);
      } else {
        low_priority.push(rec);
      }
    });
    
    return { high_priority, medium_priority, low_priority };
  };

  const metrics = rawResult.geoAnalysis?.metrics || {};
  const prioritised = prioritiseRecommendations(recommendations);

  return {
    summary: {
      overall_score: scores.overall || 0,
      rating: getRating(scores.overall || 0),
      primary_issues: identifyPrimaryIssues(scores, metrics),
      quick_wins: identifyQuickWins(recommendations),
    },
    scores,
    detailed_analysis: rawResult.geoAnalysis,
    recommendations: prioritised,
  };
}

const server = new Server(
  {
    name: 'geo-analyzer',
    version: '1.0.7',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'analyze_url',
        description: 'Analyze a published URL for AI search optimization. Performs comprehensive content quality analysis including AI slop detection, writing quality, E-E-A-T signals, and actionability. Just provide the URL.',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'The URL to analyze',
            },
            query: {
              type: 'string',
              description: 'Optional context string describing the content topic (e.g., "sim racing wheels", "content optimization"). Used for relevance scoring only. Defaults to "general content analysis".',
            },
            aiModel: {
              type: 'string',
              description: 'Optional: AI model for semantic analysis (default: @cf/meta/llama-3.3-70b-instruct-fp8-fast)',
              enum: [
                '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
                '@cf/meta/llama-3-8b-instruct',
                '@cf/meta/llama-3.1-8b-instruct',
                '@cf/mistral/mistral-7b-instruct-v0.1'
              ],
            },
            output_format: {
              type: 'string',
              enum: ['detailed', 'summary'],
              description: "Output verbosity: 'detailed' (default) includes all suggestions and recommendations; 'summary' provides condensed results",
              default: 'detailed',
            },
          },
          required: ['url'],
        },
      },
      {
        name: 'analyze_text',
        description: 'Analyze pasted text content for AI search optimization. Performs comprehensive content quality analysis including AI slop detection, writing quality, E-E-A-T signals, data points, originality, and actionability. Just provide the content text.',
        inputSchema: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: 'The text content to analyze (markdown, plain text, or HTML)',
            },
            query: {
              type: 'string',
              description: 'Optional context string describing the content topic (e.g., "sim racing equipment", "SEO guide"). Used for relevance scoring only. Defaults to "general content analysis".',
            },
            aiModel: {
              type: 'string',
              description: 'Optional: AI model for semantic analysis (default: @cf/meta/llama-3.3-70b-instruct-fp8-fast)',
              enum: [
                '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
                '@cf/meta/llama-3-8b-instruct',
                '@cf/meta/llama-3.1-8b-instruct',
                '@cf/mistral/mistral-7b-instruct-v0.1'
              ],
            },
            output_format: {
              type: 'string',
              enum: ['detailed', 'summary'],
              description: "Output verbosity: 'detailed' (default) includes all suggestions and recommendations; 'summary' provides condensed results",
              default: 'detailed',
            },
          },
          required: ['content'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'analyze_url') {
    const { url, query = 'general content analysis', aiModel, output_format = 'detailed' } = request.params.arguments as {
      url: string;
      query?: string;
      aiModel?: string;
      output_format?: 'detailed' | 'summary';
    };

    if (!url) {
      throw new Error('Missing required parameter: url');
    }

    try {
      const response = await fetch(`${GEO_API_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          query,
          jinaApiKey: JINA_API_KEY,
          aiModel,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API error: ${response.status} - ${error}`);
      }

      const result = await response.json();

      const formattedResult = output_format === 'detailed' 
        ? formatDetailedAnalysis(result)
        : {
            scores: result.geoAnalysis?.scores,
            top_recommendations: result.geoAnalysis?.recommendations?.slice(0, 3),
          };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(formattedResult, null, 2),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to analyze URL: ${message}`);
    }
  }

  if (request.params.name === 'analyze_text') {
    const { content, query = 'general content analysis', aiModel, output_format = 'detailed' } = request.params.arguments as {
      content: string;
      query?: string;
      aiModel?: string;
      output_format?: 'detailed' | 'summary';
    };

    if (!content) {
      throw new Error('Missing required parameter: content');
    }

    try {
      const response = await fetch(`${GEO_API_URL}/api/analyze-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          query,
          aiModel,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API error: ${response.status} - ${error}`);
      }

      const result = await response.json();

      const formattedResult = output_format === 'detailed' 
        ? formatDetailedAnalysis(result)
        : {
            scores: result.geoAnalysis?.scores,
            top_recommendations: result.geoAnalysis?.recommendations?.slice(0, 3),
          };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(formattedResult, null, 2),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to analyze text: ${message}`);
    }
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  process.exit(1);
});
