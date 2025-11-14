export interface Env {
  AI: Ai;
  ENVIRONMENT?: string;
}

export interface AnalyzeRequest {
  url: string;
  query: string;
  competitorUrls?: string[];
  autoDiscoverCompetitors?: boolean;
  jinaApiKey?: string;
  aiModel?: string;
}

export interface AnalyzeTextRequest {
  content: string;
  query: string;
  aiModel?: string;
}

export interface HealthResponse {
  status: 'healthy';
  version: string;
  timestamp: string;
  worker: {
    environment: string;
    aiBinding: boolean;
  };
}
