import { Env, AnalyzeRequest, AnalyzeTextRequest, HealthResponse } from './types';
import { JinaClient } from './jina/client';
import { GeoAnalyzer } from './analyzer/geo-analyzer';

interface GeoApiResponse {
  request: {
    url: string;
    query: string;
    competitorUrls?: string[];
    analyzedAt: string;
  };
  jinaContent: any;
  geoAnalysis: any;
  competitors?: any;
  usage: {
    neuronsUsed: number;
    jinaTokensUsed: number;
    dailyRemaining: number;
    cacheHit: boolean;
  };
  meta: {
    version: string;
    processingTime: number;
    featuresUsed: string[];
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    try {
      if (path === '/health' && request.method === 'GET') {
        const health: HealthResponse = {
          status: 'healthy',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          worker: {
            environment: env.ENVIRONMENT || 'unknown',
            aiBinding: !!env.AI,
          },
        };
        return new Response(JSON.stringify(health), {
          status: 200,
          headers: corsHeaders,
        });
      }

      if (path === '/api/analyze' && request.method === 'POST') {
        const body = await request.json() as AnalyzeRequest;
        
        if (!body.url) {
          return new Response(
            JSON.stringify({ error: 'Missing required field: url' }),
            { status: 400, headers: corsHeaders }
          );
        }

        const startTime = Date.now();
        
        const jinaClient = new JinaClient(body.jinaApiKey);
        const analyzer = new GeoAnalyzer(env.AI, jinaClient);
        
        const result = await analyzer.analyze(
          body.url,
          body.query || 'general content analysis',
          {
            aiModel: body.aiModel,
          }
        );
        
        const response: GeoApiResponse = {
          ...result,
          meta: {
            ...result.meta,
            processingTime: Date.now() - startTime,
          },
        };

        return new Response(JSON.stringify(response), {
          status: 200,
          headers: corsHeaders,
        });
      }

      if (path === '/api/analyze-text' && request.method === 'POST') {
        const body = await request.json() as AnalyzeTextRequest;
        
        if (!body.content) {
          return new Response(
            JSON.stringify({ error: 'Missing required field: content' }),
            { status: 400, headers: corsHeaders }
          );
        }

        // Security: Limit content size to prevent excessive resource consumption
        const MAX_CONTENT_SIZE = 1_000_000; // 1MB
        if (body.content.length > MAX_CONTENT_SIZE) {
          return new Response(
            JSON.stringify({ 
              error: `Content exceeds maximum size of ${MAX_CONTENT_SIZE} characters (${Math.round(body.content.length / 1024)}KB provided)` 
            }),
            { status: 413, headers: corsHeaders }
          );
        }

        const startTime = Date.now();
        
        const jinaClient = new JinaClient();
        const analyzer = new GeoAnalyzer(env.AI, jinaClient);
        
        const result = await analyzer.analyzeText(
          body.content,
          body.query || 'general content analysis',
          {
            aiModel: body.aiModel,
          }
        );
        
        const response: GeoApiResponse = {
          ...result,
          meta: {
            ...result.meta,
            processingTime: Date.now() - startTime,
          },
        };

        return new Response(JSON.stringify(response), {
          status: 200,
          headers: corsHeaders,
        });
      }

      return new Response(
        JSON.stringify({ error: 'Not found' }),
        { status: 404, headers: corsHeaders }
      );

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return new Response(
        JSON.stringify({ error: message }),
        { status: 500, headers: corsHeaders }
      );
    }
  },
};
