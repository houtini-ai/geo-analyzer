/**
 * GEO Analysis Types v2.0
 * Core data structures for Generative Engine Optimization
 * Standalone local implementation
 */

export interface GeoScores {
  overall: number;
  extractability: number;
  readability: number;
  citability: number;
}

export interface SentenceLengthMetrics {
  average: number;
  target: number;
  problematic: Array<{
    sentence: string;
    wordCount: number;
    location: string;
  }>;
}

export interface ClaimDensityMetrics {
  current: number;
  target: number;
  weakSections: Array<{
    section: string;
    claims: number;
    wordCount: number;
    density: number;
  }>;
}

export interface DateMarkerMetrics {
  found: number;
  recommended: number;
  missingContexts: Array<{
    claim: string;
    location: string;
    needsDate: boolean;
  }>;
}

export interface SemanticTriple {
  subject: string;
  predicate: string;
  object: string;
  confidence: number;
}

export interface SemanticTripleMetrics {
  total: number;
  density: number;
  quality: number;
  examples: Array<{
    sentence: string;
    triples: SemanticTriple[];
  }>;
}

export interface EntityMetrics {
  total: number;
  density: number;
  diversity: number;
  genericReferences: Array<{
    text: string;
    location: string;
    suggestedReplacement: string;
  }>;
}

export interface QueryAlignmentMetrics {
  primaryQuery: string;
  latentIntents: Array<{
    intent: string;
    type: 'comparative' | 'evaluative' | 'temporal' | 'decisional' | 'informational';
    coverage: number;
    gaps: string[];
  }>;
  headingAlignment: Array<{
    heading: string;
    queryRelevance: number;
    suggestedRephrase?: string;
  }>;
}

export interface StructureMetrics {
  headingCount: number;
  listCount: number;
  avgSectionLength: number;
  hasTableOfContents: boolean;
}

export interface ContentChunk {
  content: string;
  semanticCoherence: number;
  selfContained: boolean;
  missingContext: string[];
  tokenCount: number;
}

export interface GeoRecommendation {
  method: string;
  priority: 'high' | 'medium' | 'low';
  location: string;
  currentText: string;
  suggestedText: string;
  rationale: string;
}

export interface GeoAnalysis {
  analyzedAt: string;
  version: string;
  targetQuery: string;
  scores: GeoScores;
  metrics: {
    sentenceLength: SentenceLengthMetrics;
    claimDensity: ClaimDensityMetrics;
    dateMarkers: DateMarkerMetrics;
    structure: StructureMetrics;
    semanticTriples: SemanticTripleMetrics;
    entities: EntityMetrics;
    queryAlignment: QueryAlignmentMetrics;
  };
  chunking: {
    chunks: ContentChunk[];
    averageCoherence: number;
    problematicBoundaries: number;
  };
  recommendations: GeoRecommendation[];
}

export interface ContentData {
  url?: string;
  title: string;
  content: string;
  wordCount: number;
  description?: string;
}

export interface SemanticAnalysisResult {
  triples: SemanticTriple[];
  entities: {
    text: string;
    type: 'PERSON' | 'ORG' | 'PRODUCT' | 'LOCATION' | 'DATE' | 'MEASUREMENT';
  }[];
  diversity: number;
}
