import {
  GeoScores,
  SentenceLengthMetrics,
  ClaimDensityMetrics,
  DateMarkerMetrics,
  StructureMetrics,
  EntityMetrics,
  QueryAlignmentMetrics,
  SemanticTripleMetrics,
  InformationDensityMetrics,
  FrontloadingMetrics,
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
    informationDensity: InformationDensityMetrics;
    frontloading: FrontloadingMetrics;
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
    const wordCount = words.length;
    
    const sentenceLength = this.analyzeSentenceLength(sentences);
    const claimDensity = this.analyzeClaimDensity(content, sentences);
    const dateMarkers = this.analyzeDateMarkers(sentences);
    const structure = this.analyzeStructure(html || content);
    const entities = this.analyzeEntities(content, sentences);
    const queryAlignment = this.analyzeQueryAlignment(content, query);
    const semanticTriples = this.analyzeSemanticTriples(sentences);
    
    // New v2.1 metrics based on Dejan AI research
    const informationDensity = this.analyzeInformationDensity(wordCount);
    const frontloading = this.analyzeFrontloading(content, words);
    
    const extractabilityScore = this.calculateExtractabilityScore({
      sentenceLength,
      claimDensity,
      dateMarkers,
      semanticTriples,
      informationDensity,
      frontloading,
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
        informationDensity,
        frontloading,
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
        informationDensity,
        frontloading,
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

  /**
   * Analyze information density based on Dejan AI research
   * Source: https://dejan.ai/blog/how-big-are-googles-grounding-chunks/
   * 
   * Key findings:
   * - ~2,000 word budget per query total
   * - Pages <1K words: 61% coverage
   * - Pages 1-2K words: 35% coverage
   * - Pages 2-3K words: 22% coverage
   * - Pages 3K+ words: 13% coverage
   */
  private analyzeInformationDensity(wordCount: number): InformationDensityMetrics {
    // Calculate predicted coverage based on Dejan's empirical data
    let predictedCoverage: number;
    let coverageCategory: 'excellent' | 'good' | 'diluted' | 'severely-diluted';
    
    if (wordCount < 1000) {
      predictedCoverage = 61;
      coverageCategory = 'excellent';
    } else if (wordCount < 2000) {
      // Linear interpolation between 61% at 1000 and 35% at 2000
      predictedCoverage = 61 - ((wordCount - 1000) / 1000) * 26;
      coverageCategory = 'good';
    } else if (wordCount < 3000) {
      // Linear interpolation between 35% at 2000 and 22% at 3000
      predictedCoverage = 35 - ((wordCount - 2000) / 1000) * 13;
      coverageCategory = 'diluted';
    } else {
      // Asymptotic approach to 13% for 3K+
      predictedCoverage = Math.max(13, 22 - ((wordCount - 3000) / 2000) * 9);
      coverageCategory = 'severely-diluted';
    }
    
    // Grounding budget by rank (from Dejan's data)
    // Rank 1: 531 words (28%), Rank 3: 378 words (20%), Rank 5: 266 words (13%)
    const groundingBudget = {
      ifRank1: {
        words: Math.min(531, Math.round(wordCount * 0.28)),
        percentage: Math.min(28, Math.round((531 / wordCount) * 100)),
      },
      ifRank3: {
        words: Math.min(378, Math.round(wordCount * 0.20)),
        percentage: Math.min(20, Math.round((378 / wordCount) * 100)),
      },
      ifRank5: {
        words: Math.min(266, Math.round(wordCount * 0.13)),
        percentage: Math.min(13, Math.round((266 / wordCount) * 100)),
      },
    };
    
    // Determine recommendation
    let recommendation: 'expand' | 'optimal' | 'condense';
    if (wordCount < 600) {
      recommendation = 'expand';
    } else if (wordCount <= 1500) {
      recommendation = 'optimal';
    } else {
      recommendation = 'condense';
    }
    
    return {
      wordCount,
      optimalRange: { min: 800, max: 1500 },
      predictedCoverage: Math.round(predictedCoverage),
      coverageCategory,
      groundingBudget,
      recommendation,
    };
  }

  /**
   * Analyze frontloading - how quickly key information appears
   * AI engines prioritise content that provides the answer immediately
   */
  private analyzeFrontloading(content: string, words: string[]): FrontloadingMetrics {
    const first100Words = words.slice(0, 100).join(' ');
    const first300Words = words.slice(0, 300).join(' ');
    
    // Claim patterns (same as claimDensity)
    const claimPatterns = [
      /\d+%/,
      /\$[\d,]+/,
      /\d+\s*(nm|kg|mm|hz|gb|mb|tb)/i,
      /\d+\s*(users|customers|companies|people)/i,
      /(increases?|decreases?|improves?|reduces?)\s+by\s+\d+/i,
    ];
    
    // Entity patterns (basic named entity detection)
    const entityPatterns = [
      /[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/, // Multi-word proper nouns
      /[A-Z]{2,}/, // Acronyms
      /\d+\s*(nm|Nm|kg|mm|Hz|GB|MB|TB)/i, // Measurements
    ];
    
    const countPatternMatches = (text: string, patterns: RegExp[]): number => {
      let count = 0;
      patterns.forEach(pattern => {
        const matches = text.match(new RegExp(pattern.source, 'gi'));
        if (matches) count += matches.length;
      });
      return count;
    };
    
    const first100Claims = countPatternMatches(first100Words, claimPatterns);
    const first100Entities = countPatternMatches(first100Words, entityPatterns);
    const first300Claims = countPatternMatches(first300Words, claimPatterns);
    const first300Entities = countPatternMatches(first300Words, entityPatterns);
    
    // Find position of first claim
    let firstClaimPosition = words.length;
    for (let i = 0; i < words.length; i++) {
      const textSoFar = words.slice(0, i + 1).join(' ');
      if (claimPatterns.some(pattern => pattern.test(textSoFar))) {
        firstClaimPosition = i + 1;
        break;
      }
    }
    
    // Calculate frontloading score (0-10)
    // Higher score = key information appears earlier
    let frontloadingScore = 5; // Base score
    
    // Bonus for claims in first 100 words
    frontloadingScore += Math.min(2, first100Claims * 0.5);
    
    // Bonus for entities in first 100 words
    frontloadingScore += Math.min(1.5, first100Entities * 0.3);
    
    // Penalty for late first claim
    if (firstClaimPosition > 100) {
      frontloadingScore -= Math.min(2, (firstClaimPosition - 100) / 50);
    } else if (firstClaimPosition < 30) {
      frontloadingScore += 1; // Bonus for very early claim
    }
    
    frontloadingScore = Math.max(0, Math.min(10, frontloadingScore));
    
    return {
      first100Words: {
        claims: first100Claims,
        entities: first100Entities,
        density: Math.round((first100Claims / 100) * 100 * 10) / 10,
      },
      first300Words: {
        claims: first300Claims,
        entities: first300Entities,
        density: Math.round((first300Claims / 300) * 100 * 10) / 10,
      },
      firstClaimPosition,
      frontloadingScore: Math.round(frontloadingScore * 10) / 10,
    };
  }

  private calculateExtractabilityScore(metrics: {
    sentenceLength: SentenceLengthMetrics;
    claimDensity: ClaimDensityMetrics;
    dateMarkers: DateMarkerMetrics;
    semanticTriples: SemanticTripleMetrics;
    informationDensity: InformationDensityMetrics;
    frontloading: FrontloadingMetrics;
  }): number {
    const sentenceScore = Math.max(0, 10 - Math.abs(metrics.sentenceLength.average - metrics.sentenceLength.target) / 2);
    const claimScore = Math.min(10, (metrics.claimDensity.current / metrics.claimDensity.target) * 10);
    const dateScore = Math.min(10, (metrics.dateMarkers.found / metrics.dateMarkers.recommended) * 10);
    
    // New: Information density score based on coverage prediction
    const densityScore = metrics.informationDensity.predictedCoverage / 10;
    
    // New: Frontloading score directly from analysis
    const frontloadScore = metrics.frontloading.frontloadingScore;
    
    // Updated weighting: density and frontloading now factor in
    return (
      sentenceScore * 0.20 +
      claimScore * 0.25 +
      dateScore * 0.15 +
      densityScore * 0.20 +
      frontloadScore * 0.20
    );
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
    informationDensity: InformationDensityMetrics;
    frontloading: FrontloadingMetrics;
    entities: EntityMetrics;
    queryAlignment: QueryAlignmentMetrics;
  }): GeoRecommendation[] {
    const recommendations: GeoRecommendation[] = [];
    
    // NEW: Information density recommendations (highest priority)
    if (metrics.informationDensity.recommendation === 'condense') {
      const severity = metrics.informationDensity.coverageCategory === 'severely-diluted' ? 'high' : 'medium';
      recommendations.push({
        method: 'Content Condensation',
        priority: severity as 'high' | 'medium',
        location: 'Entire document',
        currentText: `${metrics.informationDensity.wordCount} words (${metrics.informationDensity.predictedCoverage}% predicted AI coverage)`,
        suggestedText: `Reduce to 800-1,500 words for optimal AI extraction. Currently, AI systems would likely ignore ${100 - metrics.informationDensity.predictedCoverage}% of your content.`,
        rationale: 'Research shows pages over 1,500 words see diminishing returns. A tight 800-word page gets 50%+ coverage; a 4,000-word page gets only 13%. Density beats length.',
      });
    }
    
    if (metrics.informationDensity.recommendation === 'expand') {
      recommendations.push({
        method: 'Content Expansion',
        priority: 'medium',
        location: 'Entire document',
        currentText: `${metrics.informationDensity.wordCount} words`,
        suggestedText: 'Expand to at least 800 words with additional claims, examples, and supporting data to provide sufficient context for AI extraction.',
        rationale: 'Very short content may lack sufficient context for AI systems to extract meaningful information. Aim for 800-1,500 words with high claim density.',
      });
    }
    
    // NEW: Frontloading recommendations
    if (metrics.frontloading.frontloadingScore < 5) {
      recommendations.push({
        method: 'Answer Frontloading',
        priority: 'high',
        location: 'Opening paragraph',
        currentText: `First claim appears at word ${metrics.frontloading.firstClaimPosition}; ${metrics.frontloading.first100Words.claims} claims in first 100 words`,
        suggestedText: 'Lead with your key claim or answer in the first 1-2 sentences. AI systems have limited "attention spans" and prioritise content that provides answers immediately.',
        rationale: 'Google extracts ~15.5 word chunks on average. Content that leads with the answer gets prioritised. Follow the inverted pyramid structure used in journalism.',
      });
    }
    
    if (metrics.sentenceLength.average > 25) {
      recommendations.push({
        method: 'Sentence Simplification',
        priority: 'high',
        location: 'Throughout document',
        currentText: `Average sentence length: ${metrics.sentenceLength.average} words`,
        suggestedText: 'Break long sentences into shorter ones (15-20 words) to improve AI parsing and fact extraction',
        rationale: 'Google extracts chunks averaging 15.5 words. Shorter sentences align with natural chunk boundaries, making extraction cleaner and more accurate.',
      });
    }
    
    if (metrics.claimDensity.current < metrics.claimDensity.target) {
      recommendations.push({
        method: 'Claim Density Enhancement',
        priority: 'high',
        location: 'Key sections',
        currentText: `${metrics.claimDensity.current} claims per 100 words`,
        suggestedText: `Add specific statistics, numbers, and factual claims to increase claim density towards target of ${metrics.claimDensity.target} per 100 words`,
        rationale: 'Higher claim density provides more extractable facts for AI systems to cite. Since AI only uses a fraction of your content, pack more value into fewer words.',
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
