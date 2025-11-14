import { JinaClient } from '../jina/client';
import { JinaContent, JinaSearchResult } from '../types/jina.types';
import {
  GeoAnalysis,
  CompetitorAnalysis,
} from '../types/geo.types';
import { PatternAnalyzer } from './pattern-analyzer';
import { LLMAnalyzer, LLMAnalysisResult } from './llm-analyzer';

interface AnalyzeOptions {
  competitorUrls?: string[];
  autoDiscoverCompetitors?: boolean;
  aiModel?: string;
}

interface GeoApiResponsePartial {
  request: {
    url: string;
    query: string;
    competitorUrls?: string[];
    analyzedAt: string;
  };
  jinaContent: JinaContent;
  geoAnalysis: GeoAnalysis;
  competitors?: {
    jinaResults: JinaSearchResult;
    analyses: CompetitorAnalysis[];
  };
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

export class GeoAnalyzer {
  private ai: Ai;
  private jinaClient: JinaClient;
  private patternAnalyzer: PatternAnalyzer;

  constructor(ai: Ai, jinaClient: JinaClient) {
    this.ai = ai;
    this.jinaClient = jinaClient;
    this.patternAnalyzer = new PatternAnalyzer();
  }

  async analyze(
    url: string,
    targetQuery: string,
    options: AnalyzeOptions = {}
  ): Promise<Omit<GeoApiResponsePartial, 'meta'>> {
    const jinaContent = await this.jinaClient.read(url, {
      withImageCaptions: true,
      withLinksSummary: true,
    });

    let llmAnalysis: LLMAnalysisResult | undefined;
    let llmError: string | undefined;
    try {
      const llmAnalyzer = new LLMAnalyzer(this.ai, options.aiModel);
      llmAnalysis = await llmAnalyzer.analyzeSemantics(
        jinaContent.content,
        targetQuery
      );
    } catch (error) {
      llmError = error instanceof Error ? error.message : 'Unknown LLM error';
      llmAnalysis = undefined;
    }

    let competitors: JinaSearchResult | undefined;
    if (options.autoDiscoverCompetitors) {
      const competitorResults = await this.jinaClient.search(targetQuery, {
        returnFormat: 'json',
      });
      competitors = {
        query: targetQuery,
        results: competitorResults,
        retrievedAt: new Date().toISOString(),
      };
    } else if (options.competitorUrls) {
      const competitorContents = await this.jinaClient.readBatch(
        options.competitorUrls,
        { returnFormat: 'json' }
      );
      competitors = {
        query: targetQuery,
        results: competitorContents,
        retrievedAt: new Date().toISOString(),
      };
    }

    const patternAnalysis = this.patternAnalyzer.analyze(jinaContent.content, targetQuery);
    
    const geoAnalysis = this.enhanceWithLLM(patternAnalysis, llmAnalysis);

    return {
      request: {
        url,
        query: targetQuery,
        competitorUrls: options.competitorUrls,
        analyzedAt: new Date().toISOString(),
      },
      jinaContent,
      geoAnalysis,
      competitors: competitors
        ? {
            jinaResults: competitors,
            analyses: await this.analyzeCompetitors(competitors.results),
          }
        : undefined,
      usage: {
        neuronsUsed: llmAnalysis ? 50 : 0,
        jinaTokensUsed: jinaContent.usage?.tokens || 0,
        dailyRemaining: 10000 - (llmAnalysis ? 50 : 0),
        cacheHit: false,
      },
      meta: {
        version: '1.0.0',
        processingTime: 0,
        featuresUsed: [
          'pattern-analysis',
          ...(llmAnalysis ? ['llm-semantic-analysis'] : []),
          ...(llmError ? [`llm-error: ${llmError}`] : []),
        ],
      },
    };
  }

  async analyzeText(
    content: string,
    targetQuery: string,
    options: { aiModel?: string } = {}
  ): Promise<Omit<GeoApiResponsePartial, 'meta'>> {
    const jinaContent: JinaContent = {
      title: 'Text Analysis',
      url: 'text://content',
      content,
      usage: {
        tokens: 0,
      },
    };

    let llmAnalysis: LLMAnalysisResult | undefined;
    let llmError: string | undefined;
    try {
      const llmAnalyzer = new LLMAnalyzer(this.ai, options.aiModel);
      llmAnalysis = await llmAnalyzer.analyzeSemantics(
        content,
        targetQuery
      );
    } catch (error) {
      llmError = error instanceof Error ? error.message : 'Unknown LLM error';
      llmAnalysis = undefined;
    }

    const patternAnalysis = this.patternAnalyzer.analyze(content, targetQuery);
    
    const geoAnalysis = this.enhanceWithLLM(patternAnalysis, llmAnalysis);

    return {
      request: {
        url: jinaContent.url,
        query: targetQuery,
        analyzedAt: new Date().toISOString(),
      },
      jinaContent,
      geoAnalysis,
      usage: {
        neuronsUsed: llmAnalysis ? 50 : 0,
        jinaTokensUsed: 0,
        dailyRemaining: 10000 - (llmAnalysis ? 50 : 0),
        cacheHit: false,
      },
      meta: {
        version: '1.0.0',
        processingTime: 0,
        featuresUsed: [
          'pattern-analysis',
          'text-input',
          ...(llmAnalysis ? ['llm-semantic-analysis'] : []),
          ...(llmError ? [`llm-error: ${llmError}`] : []),
        ],
      },
    };
  }

  private enhanceWithLLM(
    patternAnalysis: any,
    llmAnalysis?: LLMAnalysisResult
  ): GeoAnalysis {
    if (!llmAnalysis) {
      return {
        ...patternAnalysis,
        analyzedAt: new Date().toISOString(),
        version: '1.0.0',
      };
    }

    const enhancedMetrics = {
      ...patternAnalysis.metrics,
      semanticTriples: {
        total: llmAnalysis.semanticTriples.length,
        density: llmAnalysis.semanticTriples.length,
        quality: this.calculateAvgConfidence(llmAnalysis.semanticTriples),
        examples: llmAnalysis.semanticTriples.slice(0, 3).map(t => ({
          subject: t.subject,
          predicate: t.predicate,
          object: t.object,
          confidence: t.confidence,
        })),
      },
      entities: {
        total: llmAnalysis.advancedEntities.length,
        density: llmAnalysis.advancedEntities.length,
        diversity: this.countEntityTypes(llmAnalysis.advancedEntities),
        genericReferences: [],
      },
      dataPoints: {
        statisticsCount: llmAnalysis.dataPointMetrics.statisticsCount,
        numericalClaims: llmAnalysis.dataPointMetrics.numericalClaimsCount,
        researchCitations: llmAnalysis.dataPointMetrics.researchCitationsCount,
      },
      originality: {
        score: llmAnalysis.originalitySignals.originalityScore,
        hasOriginalResearch: llmAnalysis.originalitySignals.hasOriginalResearch,
        hasUniqueData: llmAnalysis.originalitySignals.hasUniqueData,
      },
      writingQuality: {
        activeVoicePercentage: llmAnalysis.writingQuality.activeVoicePercentage,
        passiveVoiceCount: llmAnalysis.writingQuality.passiveVoiceInstances,
        aiSlopDetected: llmAnalysis.writingQuality.aiSlopIndicators.detected,
        aiSlopConfidence: llmAnalysis.writingQuality.aiSlopIndicators.confidence,
      },
      eeat: {
        hasAuthor: llmAnalysis.eeatSignals.hasAuthorAttribution,
        hasCredentials: llmAnalysis.eeatSignals.hasCredentials,
        hasExpertise: llmAnalysis.eeatSignals.hasExpertiseMarkers,
        trustSignalsCount: llmAnalysis.eeatSignals.trustSignals.length,
      },
      actionability: {
        score: llmAnalysis.actionability.actionabilityScore,
        hasImplementationSteps: llmAnalysis.actionability.hasActionableSteps,
      },
    };

    const enhancedChunking = {
      ...patternAnalysis.chunking,
      averageCoherence: llmAnalysis.chunkCoherence.coherent ? 0.9 : 0.7,
      problematicBoundaries: llmAnalysis.chunkCoherence.missingContext.length,
    };

    const tripleScore = Math.min(10, llmAnalysis.semanticTriples.length * 2);
    const entityScore = Math.min(10, llmAnalysis.advancedEntities.length / 2);
    const dataPointBonus = Math.min(2, llmAnalysis.dataPointMetrics.statisticsCount * 0.2);
    const originalityBonus = llmAnalysis.originalitySignals.originalityScore * 2;
    const eeatBonus = (llmAnalysis.eeatSignals.hasAuthorAttribution ? 1 : 0) +
                      (llmAnalysis.eeatSignals.hasCredentials ? 1 : 0);
    
    const citabilityScore = Math.min(10, (tripleScore + entityScore + dataPointBonus + originalityBonus + eeatBonus) / 2.5);

    const enhancedScores = {
      ...patternAnalysis.scores,
      citability: Math.round(citabilityScore * 10) / 10,
      overall: Math.round(
        ((patternAnalysis.scores.extractability + 
          patternAnalysis.scores.readability + 
          citabilityScore) / 3) * 10
      ) / 10,
    };

    const structureRecommendations = this.generateStructureRecommendations(
      llmAnalysis.structureQuality,
      llmAnalysis.chunkCoherence
    );

    const dataPointRecommendations = this.generateDataPointRecommendations(llmAnalysis.dataPointMetrics);
    const writingQualityRecommendations = this.generateWritingQualityRecommendations(llmAnalysis.writingQuality);
    const originalityRecommendations = this.generateOriginalityRecommendations(llmAnalysis.originalitySignals);
    const eeatRecommendations = this.generateEEATRecommendations(llmAnalysis.eeatSignals);
    const actionabilityRecommendations = this.generateActionabilityRecommendations(llmAnalysis.actionability);

    const allRecommendations = [
      ...patternAnalysis.recommendations,
      ...structureRecommendations,
      ...dataPointRecommendations,
      ...writingQualityRecommendations,
      ...originalityRecommendations,
      ...eeatRecommendations,
      ...actionabilityRecommendations,
    ];

    return {
      analyzedAt: new Date().toISOString(),
      version: '1.0.0',
      targetQuery: patternAnalysis.metrics.queryAlignment.primaryQuery,
      scores: enhancedScores,
      metrics: enhancedMetrics,
      chunking: enhancedChunking,
      recommendations: allRecommendations,
    };
  }

  private generateStructureRecommendations(
    structure: any,
    coherence: any
  ): any[] {
    const recommendations = [];

    if (!structure.hasAnswerFirst) {
      recommendations.push({
        method: 'Add Answer-First Summary',
        priority: 'high',
        impact: 'high',
        location: 'Top of page',
        details: 'AI engines prioritize content with clear TL;DR or key takeaway at the beginning. Add 2-3 sentence summary answering the main query upfront.',
        rationale: 'Answer-first format increases citation likelihood by 40% (GEO-16 research)',
      });
    }

    if (structure.headingHierarchy === 'poor') {
      recommendations.push({
        method: 'Fix Heading Hierarchy',
        priority: 'high',
        impact: 'high',
        location: 'Document structure',
        details: 'Use single H1, logical H2/H3 structure. Ensure headings form clear outline of content.',
        rationale: 'Semantic HTML structure is 2nd strongest predictor of AI citation',
      });
    }

    if (structure.questionsCovered.length < 3) {
      recommendations.push({
        method: 'Answer More User Questions',
        priority: 'high',
        impact: 'high',
        location: 'Content body',
        details: 'Content answers few common user questions. Research SERP to identify questions users ask, then explicitly answer them in dedicated sections.',
        rationale: 'Content that comprehensively answers user questions ranks better in AI engines',
      });
    }

    if (coherence.missingContext.length > 0) {
      recommendations.push({
        method: 'Address Content Gaps',
        priority: 'medium',
        impact: 'medium',
        location: 'Content body',
        details: `Missing context: ${coherence.missingContext.slice(0, 3).join('; ')}`,
        rationale: 'Self-contained content that addresses common questions improves AI discoverability',
      });
    }

    return recommendations;
  }

  private generateDataPointRecommendations(dataMetrics: any): any[] {
    const recommendations = [];

    if (dataMetrics.statisticsCount < 3) {
      recommendations.push({
        method: 'Add More Statistical Data',
        priority: 'high',
        impact: 'high',
        location: 'Content body',
        details: `Content contains only ${dataMetrics.statisticsCount} statistics. Add 5-8 specific data points (percentages, numbers, research findings) to strengthen credibility and AI citation likelihood.`,
        rationale: 'Data-driven content is 35% more likely to be cited by AI engines (GEO research)',
      });
    }

    if (dataMetrics.researchCitationsCount === 0) {
      recommendations.push({
        method: 'Include Research Citations',
        priority: 'medium',
        impact: 'high',
        location: 'Content body',
        details: 'No research citations found. Reference authoritative studies, industry reports, or academic papers to boost trustworthiness and citation potential.',
        rationale: 'Content citing credible sources increases AI engine trust signals',
      });
    }

    if (dataMetrics.numericalClaimsCount < 5) {
      recommendations.push({
        method: 'Add Quantifiable Claims',
        priority: 'medium',
        impact: 'medium',
        location: 'Content body',
        details: `Only ${dataMetrics.numericalClaimsCount} numerical claims found. Replace vague statements with specific metrics (e.g., "18% increase" instead of "significant growth").`,
        rationale: 'Specific numerical data improves semantic understanding for LLMs',
      });
    }

    return recommendations;
  }

  private generateWritingQualityRecommendations(writingQuality: any): any[] {
    const recommendations = [];

    if (writingQuality.passiveVoiceInstances > 5) {
      recommendations.push({
        method: 'Reduce Passive Voice',
        priority: 'high',
        impact: 'high',
        location: 'Throughout content',
        details: `Found ${writingQuality.passiveVoiceInstances} passive voice instances. Convert to active voice for clearer semantic extraction. Examples: ${writingQuality.passiveVoiceExamples.slice(0, 2).join('; ')}`,
        rationale: 'Active voice improves subject-predicate-object extraction, boosting AI retrieval by 40%',
      });
    }

    if (writingQuality.aiSlopIndicators.detected && writingQuality.aiSlopIndicators.confidence > 0.5) {
      const phrases = writingQuality.aiSlopIndicators.problematicPhrases.slice(0, 3);
      const examples = phrases.map((p: any) => `"${p.phrase}" → "${p.suggestion}"`).join('; ');
      
      recommendations.push({
        method: 'Remove AI-Generated Language Patterns',
        priority: 'high',
        impact: 'high',
        location: 'Throughout content',
        details: `AI-generated language detected (confidence: ${Math.round(writingQuality.aiSlopIndicators.confidence * 100)}%). Replace generic phrases with specific, authentic language. Suggestions: ${examples}`,
        rationale: 'Generic AI language reduces originality scores and citation likelihood. Human-written, specific content performs better.',
      });
    }

    if (writingQuality.activeVoicePercentage < 70) {
      recommendations.push({
        method: 'Increase Active Voice Usage',
        priority: 'medium',
        impact: 'high',
        location: 'Throughout content',
        details: `Active voice usage is only ${writingQuality.activeVoicePercentage}%. Target 80%+ for optimal AI extraction. Rewrite sentences to emphasize subject-action relationships.`,
        rationale: 'Higher active voice percentage correlates with better semantic triple extraction',
      });
    }

    return recommendations;
  }

  private generateOriginalityRecommendations(originality: any): any[] {
    const recommendations = [];

    if (originality.originalityScore < 0.5) {
      recommendations.push({
        method: 'Increase Content Originality',
        priority: 'high',
        impact: 'high',
        location: 'Content strategy',
        details: `Originality score is ${Math.round(originality.originalityScore * 100)}%. Add unique insights, proprietary data, personal experience, or original research to stand out from competitors.`,
        rationale: 'Original content with unique information gain is 50%+ more likely to be cited by AI engines',
      });
    }

    if (!originality.hasOriginalResearch && !originality.hasUniqueData) {
      recommendations.push({
        method: 'Add Original Research or Data',
        priority: 'high',
        impact: 'high',
        location: 'Content body',
        details: 'No original research or unique data detected. Conduct surveys, analyze datasets, or share proprietary insights to differentiate from generic content.',
        rationale: 'Original research creates information gain, the strongest predictor of AI citation',
      });
    }

    if (!originality.hasPersonalInsights && !originality.hasExpertOpinion) {
      recommendations.push({
        method: 'Include Expert Perspectives',
        priority: 'medium',
        impact: 'medium',
        location: 'Content body',
        details: 'No personal insights or expert opinions found. Add first-hand experience, expert commentary, or unique viewpoints to increase value.',
        rationale: 'Expert perspectives and personal insights signal E-E-A-T (Experience, Expertise)',
      });
    }

    if (originality.genericPhrases.length > 5) {
      recommendations.push({
        method: 'Replace Generic Phrases',
        priority: 'medium',
        impact: 'medium',
        location: 'Throughout content',
        details: `Found ${originality.genericPhrases.length} generic/AI-like phrases. Examples: ${originality.genericPhrases.slice(0, 3).join(', ')}. Replace with specific, authentic language.`,
        rationale: 'Generic language reduces perceived originality and trustworthiness',
      });
    }

    return recommendations;
  }

  private generateEEATRecommendations(eeat: any): any[] {
    const recommendations = [];

    if (!eeat.hasAuthorAttribution) {
      recommendations.push({
        method: 'Add Author Attribution',
        priority: 'high',
        impact: 'high',
        location: 'Header or byline',
        details: 'No author attribution found. Add clear author byline with name and credentials to establish expertise and authority.',
        rationale: 'Author attribution is critical for E-E-A-T signals. Content with clear authorship is more trustworthy to AI engines.',
      });
    }

    if (!eeat.hasCredentials) {
      recommendations.push({
        method: 'Display Author Credentials',
        priority: 'high',
        impact: 'high',
        location: 'Author bio or inline',
        details: 'No author credentials found. Include relevant qualifications, certifications, experience, or expertise that establish authority on the topic.',
        rationale: 'Credentials signal expertise and build trust with both users and AI systems',
      });
    }

    if (!eeat.hasExpertiseMarkers) {
      recommendations.push({
        method: 'Add Expertise Indicators',
        priority: 'medium',
        impact: 'medium',
        location: 'About section or inline',
        details: 'No expertise markers detected. Reference your background, experience, or qualifications related to the topic throughout the content.',
        rationale: 'Expertise signals improve E-E-A-T scoring and content trustworthiness',
      });
    }

    if (eeat.trustSignals.length < 2) {
      recommendations.push({
        method: 'Strengthen Trust Signals',
        priority: 'medium',
        impact: 'medium',
        location: 'Throughout content',
        details: `Only ${eeat.trustSignals.length} trust signals found. Add source citations, methodology transparency, data sources, or external validation to build credibility.`,
        rationale: 'Multiple trust signals reinforce content reliability and citation worthiness',
      });
    }

    if (eeat.authorDetails.location === 'missing') {
      recommendations.push({
        method: 'Position Author Information Prominently',
        priority: 'medium',
        impact: 'medium',
        location: 'Top of page',
        details: 'Author information should appear in header or immediately after title for maximum visibility and trust signal strength.',
        rationale: 'Prominent author attribution increases content credibility',
      });
    }

    return recommendations;
  }

  private generateActionabilityRecommendations(actionability: any): any[] {
    const recommendations = [];

    if (actionability.actionabilityScore < 0.5) {
      recommendations.push({
        method: 'Increase Content Actionability',
        priority: 'high',
        impact: 'medium',
        location: 'Content body',
        details: `Actionability score is ${Math.round(actionability.actionabilityScore * 100)}%. Add clear implementation steps, practical examples, and specific next actions readers can take.`,
        rationale: 'Actionable content provides more value and is more likely to be cited by AI engines answering how-to queries',
      });
    }

    if (!actionability.hasActionableSteps) {
      recommendations.push({
        method: 'Add Step-by-Step Implementation Guide',
        priority: 'high',
        impact: 'medium',
        location: 'Content body',
        details: 'No clear implementation steps found. Create numbered or bulleted guide showing readers exactly how to apply the information.',
        rationale: 'Step-by-step guides improve user experience and content usefulness',
      });
    }

    if (!actionability.implementationGuidancePresent) {
      recommendations.push({
        method: 'Include Practical Examples',
        priority: 'medium',
        impact: 'medium',
        location: 'Throughout content',
        details: 'No implementation guidance detected. Add concrete examples, use cases, or before/after scenarios that demonstrate practical application.',
        rationale: 'Practical examples make abstract concepts concrete and more valuable',
      });
    }

    if (actionability.clearNextSteps.length < 3) {
      recommendations.push({
        method: 'Add Clear Next Actions',
        priority: 'medium',
        impact: 'medium',
        location: 'Conclusion or action section',
        details: `Only ${actionability.clearNextSteps.length} clear next steps found. Provide 3-5 specific actions readers should take after reading.`,
        rationale: 'Clear CTAs and next steps improve content usefulness and engagement',
      });
    }

    return recommendations;
  }

  private calculateAvgConfidence(triples: any[]): number {
    if (triples.length === 0) return 0;
    const sum = triples.reduce((acc, t) => acc + t.confidence, 0);
    return Math.round((sum / triples.length) * 100) / 100;
  }

  private countEntityTypes(entities: any[]): number {
    const types = new Set(entities.map(e => e.type));
    return types.size;
  }

  private async analyzeCompetitors(
    competitorContents: JinaContent[]
  ): Promise<CompetitorAnalysis[]> {
    return competitorContents.map((content) => {
      const words = content.content.split(/\s+/).filter(w => w.length > 0);
      const sentences = content.content.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const headingPattern = /^#{1,6}\s+.+$/gm;
      const headings = content.content.match(headingPattern) || [];
      
      return {
        url: content.url,
        title: content.title,
        wordCount: words.length,
        sentenceCount: sentences.length,
        avgSentenceLength: sentences.length > 0 ? words.length / sentences.length : 0,
        headingCount: headings.length,
      };
    });
  }
}
