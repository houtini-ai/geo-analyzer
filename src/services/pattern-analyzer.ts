import {
  GeoScores,
  SentenceLengthMetrics,
  ClaimDensityMetrics,
  DateMarkerMetrics,
  StructureMetrics,
  EntityMetrics,
  QueryAlignmentMetrics,
  SemanticTripleMetrics,
  ContentChunk,
  GeoRecommendation,
} from '../types/geo.types.js';
import * as cheerio from 'cheerio';

interface PatternAnalysisResult {
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

export class PatternAnalyzer {
  analyze(content: string, query: string, html?: string): PatternAnalysisResult {
    const sentences = this.extractSentences(content);
    const words = content.split(/\s+/).filter(w => w.length > 0);
    
    const sentenceLength = this.analyzeSentenceLength(sentences);
    const claimDensity = this.analyzeClaimDensity(content, sentences);
    const dateMarkers = this.analyzeDateMarkers(sentences);
    const structure = this.analyzeStructure(html || content); // Use HTML if available
    const entities = this.analyzeEntities(content, sentences);
    const queryAlignment = this.analyzeQueryAlignment(content, query);
    const semanticTriples = this.analyzeSemanticTriples(sentences);
    
    const extractabilityScore = this.calculateExtractabilityScore({
      sentenceLength,
      claimDensity,
      dateMarkers,
      semanticTriples,
    });
    
    const readabilityScore = this.calculateReadabilityScore({
      sentenceLength,
      structure,
    });
    
    const citabilityScore = this.calculateCitabilityScore({
      dateMarkers,
      entities,
    });
    
    const overallScore = (extractabilityScore + readabilityScore + citabilityScore) / 3;
    
    return {
      scores: {
        overall: Math.round(overallScore * 10) / 10,
        extractability: Math.round(extractabilityScore * 10) / 10,
        readability: Math.round(readabilityScore * 10) / 10,
        citability: Math.round(citabilityScore * 10) / 10,
      },
      metrics: {
        sentenceLength,
        claimDensity,
        dateMarkers,
        structure,
        semanticTriples,
        entities,
        queryAlignment,
      },
      chunking: this.simulateChunking(content),
      recommendations: this.generateRecommendations({
        sentenceLength,
        claimDensity,
        dateMarkers,
        structure,
        entities,
        queryAlignment,
      }),
    };
  }

  private extractSentences(content: string): string[] {
    return content
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  private analyzeSentenceLength(sentences: string[]): SentenceLengthMetrics {
    const wordCounts = sentences.map(s => s.split(/\s+/).length);
    const average = wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length || 0;
    const target = 20;
    
    const problematic = sentences
      .map((sentence, i) => ({
        sentence,
        wordCount: wordCounts[i],
        location: `Sentence ${i + 1}`,
      }))
      .filter(item => item.wordCount > 30);

    return {
      average: Math.round(average * 10) / 10,
      target,
      problematic: problematic.slice(0, 5),
    };
  }

  private analyzeClaimDensity(content: string, sentences: string[]): ClaimDensityMetrics {
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    
    const factPatterns = [
      /\d+%/,
      /\$[\d,]+/,
      /\d+\s*(users|customers|companies|people)/i,
      /(increases?|decreases?|improves?|reduces?)\s+by\s+\d+/i,
      /(more|less|faster|slower)\s+than/i,
    ];
    
    let claimCount = 0;
    sentences.forEach(sentence => {
      factPatterns.forEach(pattern => {
        if (pattern.test(sentence)) {
          claimCount++;
        }
      });
    });
    
    const current = (claimCount / wordCount) * 100;
    const target = 4;
    
    return {
      current: Math.round(current * 10) / 10,
      target,
      weakSections: [],
    };
  }

  private analyzeDateMarkers(sentences: string[]): DateMarkerMetrics {
    const datePatterns = [
      /\d{4}/,
      /(january|february|march|april|may|june|july|august|september|october|november|december)/i,
      /(today|yesterday|tomorrow|recently|currently|now)/i,
      /\d+\s+(days?|weeks?|months?|years?)\s+ago/i,
    ];
    
    let found = 0;
    sentences.forEach(sentence => {
      if (datePatterns.some(pattern => pattern.test(sentence))) {
        found++;
      }
    });
    
    const recommended = Math.max(5, Math.floor(sentences.length * 0.1));
    
    return {
      found,
      recommended,
      missingContexts: [],
    };
  }

  private analyzeStructure(content: string): StructureMetrics {
    // Try to parse as HTML first
    let headingCount = 0;
    let listCount = 0;
    
    try {
      const $ = cheerio.load(content);
      
      // Count HTML headings (h1-h6)
      headingCount = $('h1, h2, h3, h4, h5, h6').length;
      
      // Count HTML lists
      const ulItems = $('ul > li').length;
      const olItems = $('ol > li').length;
      listCount = ulItems + olItems;
      
    } catch (e) {
      // Fallback to markdown parsing if HTML parsing fails
      const headingPattern = /^#{1,6}\s+.+$/gm;
      const headings = content.match(headingPattern) || [];
      headingCount = headings.length;
      
      const listPattern = /^[\*\-\+]\s+.+$/gm;
      const lists = content.match(listPattern) || [];
      listCount = lists.length;
    }
    
    const sections = content.split(/(<h[1-6][^>]*>.*?<\/h[1-6]>|^#{1,6}\s+.+$)/gm);
    const avgSectionLength = sections.reduce((sum, s) => sum + s.length, 0) / Math.max(sections.length, 1);
    
    const hasTableOfContents = /table of contents/i.test(content);
    
    return {
      headingCount,
      listCount,
      avgSectionLength: Math.round(avgSectionLength),
      hasTableOfContents,
    };
  }

  private analyzeSemanticTriples(sentences: string[]): SemanticTripleMetrics {
    return {
      total: 0,
      density: 0,
      quality: 0,
      examples: [],
    };
  }

  private analyzeEntities(content: string, sentences: string[]): EntityMetrics {
    const genericWords = ['it', 'this', 'that', 'these', 'those', 'the system', 'the product', 'the solution'];
    let genericCount = 0;
    
    genericWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        genericCount += matches.length;
      }
    });
    
    return {
      total: 0,
      density: 0,
      diversity: 0,
      genericReferences: [],
    };
  }

  private analyzeQueryAlignment(content: string, query: string): QueryAlignmentMetrics {
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentLower = content.toLowerCase();
    
    const coverage = queryWords.filter(word => contentLower.includes(word)).length / queryWords.length;
    
    return {
      primaryQuery: query,
      latentIntents: [
        {
          intent: 'Informational',
          type: 'informational',
          coverage: Math.round(coverage * 10),
          gaps: [],
        },
      ],
      headingAlignment: [],
    };
  }

  private calculateExtractabilityScore(metrics: {
    sentenceLength: SentenceLengthMetrics;
    claimDensity: ClaimDensityMetrics;
    dateMarkers: DateMarkerMetrics;
    semanticTriples: SemanticTripleMetrics;
  }): number {
    const sentenceScore = Math.max(0, 10 - Math.abs(metrics.sentenceLength.average - metrics.sentenceLength.target) / 2);
    const claimScore = Math.min(10, (metrics.claimDensity.current / metrics.claimDensity.target) * 10);
    const dateScore = Math.min(10, (metrics.dateMarkers.found / metrics.dateMarkers.recommended) * 10);
    
    return (sentenceScore + claimScore + dateScore) / 3;
  }

  private calculateReadabilityScore(metrics: {
    sentenceLength: SentenceLengthMetrics;
    structure: StructureMetrics;
  }): number {
    const sentenceScore = Math.max(0, 10 - Math.abs(metrics.sentenceLength.average - 20) / 3);
    const structureScore = Math.min(10, metrics.structure.headingCount * 2);
    
    return (sentenceScore + structureScore) / 2;
  }

  private calculateCitabilityScore(metrics: {
    dateMarkers: DateMarkerMetrics;
    entities: EntityMetrics;
  }): number {
    const dateScore = Math.min(10, (metrics.dateMarkers.found / Math.max(1, metrics.dateMarkers.recommended)) * 10);
    
    return dateScore;
  }

  private simulateChunking(content: string): {
    chunks: ContentChunk[];
    averageCoherence: number;
    problematicBoundaries: number;
  } {
    const chunkSize = 500;
    const chunks: ContentChunk[] = [];
    
    for (let i = 0; i < content.length; i += chunkSize) {
      const chunkContent = content.slice(i, i + chunkSize);
      chunks.push({
        content: chunkContent,
        semanticCoherence: 0.8,
        selfContained: true,
        missingContext: [],
        tokenCount: Math.floor(chunkContent.split(/\s+/).length * 1.3),
      });
    }
    
    return {
      chunks: chunks.slice(0, 3),
      averageCoherence: 0.8,
      problematicBoundaries: 0,
    };
  }

  private generateRecommendations(metrics: {
    sentenceLength: SentenceLengthMetrics;
    claimDensity: ClaimDensityMetrics;
    dateMarkers: DateMarkerMetrics;
    structure: StructureMetrics;
    entities: EntityMetrics;
    queryAlignment: QueryAlignmentMetrics;
  }): GeoRecommendation[] {
    const recommendations: GeoRecommendation[] = [];
    
    if (metrics.sentenceLength.average > 25) {
      recommendations.push({
        method: 'Sentence Simplification',
        priority: 'high',
        location: 'Throughout document',
        currentText: `Average sentence length: ${metrics.sentenceLength.average} words`,
        suggestedText: 'Break long sentences into shorter ones (15-20 words) to improve AI parsing and fact extraction',
        rationale: 'Shorter sentences are easier for AI systems to parse and extract discrete facts from. The optimal length for LLM comprehension is 15-20 words per sentence.',
      });
    }
    
    if (metrics.claimDensity.current < metrics.claimDensity.target) {
      recommendations.push({
        method: 'Claim Density Enhancement',
        priority: 'high',
        location: 'Key sections',
        currentText: `${metrics.claimDensity.current} claims per 100 words`,
        suggestedText: `Add specific statistics, numbers, and factual claims to increase claim density towards target of ${metrics.claimDensity.target} per 100 words`,
        rationale: 'Higher claim density provides more extractable facts for AI systems to cite. Quantitative statements, statistics, and specific claims are easier for LLMs to verify and reference.',
      });
    }
    
    if (metrics.dateMarkers.found < metrics.dateMarkers.recommended) {
      recommendations.push({
        method: 'Temporal Markers',
        priority: 'medium',
        location: 'Claims and statistics',
        currentText: `${metrics.dateMarkers.found} temporal markers found`,
        suggestedText: 'Add dates to claims (e.g., "As of 2024...", "In Q2 2025...") to establish temporal context',
        rationale: 'Temporal markers improve claim verifiability and provide freshness signals to AI systems. Dated information helps LLMs assess relevance and recency.',
      });
    }
    
    if (metrics.structure.headingCount < 3) {
      recommendations.push({
        method: 'Structural Enhancement',
        priority: 'medium',
        location: 'Document structure',
        currentText: `${metrics.structure.headingCount} headings found`,
        suggestedText: 'Add descriptive headings to break content into logical sections, improving both readability and AI parsing',
        rationale: 'Clear headings help AI systems understand content hierarchy and identify relevant sections for specific queries. Structured content is easier to chunk and cite.',
      });
    }
    
    return recommendations;
  }
}
