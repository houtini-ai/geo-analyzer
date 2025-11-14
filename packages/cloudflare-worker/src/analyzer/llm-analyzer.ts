import { Ai } from '@cloudflare/workers-types';

interface SemanticTriple {
  subject: string;
  predicate: string;
  object: string;
  confidence: number;
  isActiveVoice: boolean;
}

interface AdvancedEntity {
  text: string;
  type: 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'PRODUCT' | 'TECHNOLOGY' | 'METRIC';
  context: string;
  importance: number;
}

interface DataPointMetrics {
  statisticsCount: number;
  numericalClaimsCount: number;
  researchCitationsCount: number;
  specificExamples: string[];
}

interface OriginalitySignals {
  hasPersonalInsights: boolean;
  hasOriginalResearch: boolean;
  hasUniqueData: boolean;
  hasExpertOpinion: boolean;
  originalityScore: number;
  genericPhrases: string[];
  analysis?: string;
}

interface WritingQuality {
  passiveVoiceInstances: number;
  passiveVoiceExamples: string[];
  activeVoicePercentage: number;
  aiSlopIndicators: {
    detected: boolean;
    confidence: number;
    problematicPhrases: Array<{
      phrase: string;
      context: string;
      suggestion: string;
      reason: string;
    }>;
  };
  explanation?: string;
}

interface EEATSignals {
  hasAuthorAttribution: boolean;
  hasCredentials: boolean;
  hasExpertiseMarkers: boolean;
  authorDetails: {
    present: boolean;
    location: string;
  };
  trustSignals: string[];
  analysis?: string;
}

interface ActionabilityAssessment {
  hasActionableSteps: boolean;
  implementationGuidancePresent: boolean;
  clearNextSteps: string[];
  actionabilityScore: number;
  analysis?: string;
}

interface EntityCoverageAnalysis {
  coreEntityPresent: boolean;
  relatedEntitiesFound: string[];
  missingRelatedEntities: string[];
  entityDensityScore: number;
  analysis?: string;
}

interface OverallAssessment {
  strengths: string[];
  weaknesses: string[];
  quickWins: string[];
  priorityActions: Array<{
    action: string;
    effort: string;
    impact: string;
    reasoning: string;
    implementation: string;
    expectedImprovement: string;
  }>;
}

interface ChunkCoherence {
  coherent: boolean;
  missingContext: string[];
  selfContained: boolean;
}

interface StructureQuality {
  hasAnswerFirst: boolean;
  headingHierarchy: 'clear' | 'partial' | 'poor';
  questionsCovered: string[];
}

export interface LLMAnalysisResult {
  semanticTriples: SemanticTriple[];
  advancedEntities: AdvancedEntity[];
  chunkCoherence: ChunkCoherence;
  topicalRelevance: number;
  structureQuality: StructureQuality;
  dataPointMetrics: DataPointMetrics;
  originalitySignals: OriginalitySignals;
  writingQuality: WritingQuality;
  eeatSignals: EEATSignals;
  actionability: ActionabilityAssessment;
  entityCoverage: EntityCoverageAnalysis;
  overallAssessment?: OverallAssessment;
}

export class LLMAnalyzer {
  private ai: Ai;
  private model: string;

  constructor(ai: Ai, model?: string) {
    this.ai = ai;
    this.model = model || '@cf/meta/llama-4-scout-17b-16e-instruct';
  }

  async analyzeSemantics(
    content: string,
    targetQuery: string
  ): Promise<LLMAnalysisResult> {
    // 131K token context limit (Llama 4 Scout)
    // Reserve ~5K for prompt/instructions and ~4K for response = 122K for content
    // Rough estimate: 4 chars per token = 488K characters max
    const truncatedContent = this.truncateContent(content, 480000);
    
    const prompt = this.buildUnifiedPrompt(truncatedContent, targetQuery);
    
    try {
      const response = await this.callLLM(prompt);
      return this.parseResponse(response, content, targetQuery);
    } catch (error) {
      throw error;
    }
  }

  private truncateContent(content: string, maxChars: number): string {
    if (content.length <= maxChars) {
      return content;
    }
    
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    let truncated = '';
    
    for (const sentence of sentences) {
      if ((truncated + sentence).length > maxChars) {
        break;
      }
      truncated += sentence + '. ';
    }
    
    return truncated.trim() || content.substring(0, maxChars);
  }

  private buildUnifiedPrompt(content: string, query: string): string {
    return `You are an AI search optimization expert analyzing content for citation by answer engines (Google AI Overviews, Perplexity, ChatGPT).

Target query: "${query}"

Content to analyze:
${content}

TASK: Comprehensive GEO analysis based on AI search optimization research and GEO-16 framework.

YOUR MISSION: Provide a detailed diagnostic report with specific, actionable recommendations. Think like a content strategist who needs to explain EXACTLY what to change and WHY it matters.

CRITICAL ANALYSIS AREAS:

1. SEMANTIC TRIPLES & ACTIVE VOICE
   - Extract 5-10 factual triples in subject-predicate-object format
   - FLAG any passive voice usage (reduces semantic clarity)
   - Example GOOD: "Lake houses provide rental income"
   - Example BAD: "Rental income is provided by lake houses"

2. DATA POINTS & SPECIFICITY
   - Count specific statistics, numbers, percentages
   - Identify research findings or data-backed claims
   - Flag generic statements lacking specificity
   - Example GOOD: "Analysis of 2,500 properties showed 18% appreciation"
   - Example BAD: "Properties might be a good investment"

3. ORIGINALITY & INFORMATION GAIN
   - Detect personal insights, original research, unique data
   - Identify AI-generated content patterns (AI slop detection)
   - Flag generic/boilerplate language common in AI content
   - Common AI slop phrases: "delve into", "in today's digital landscape", 
     "it's important to note", "comprehensive guide", "revolutionize", 
     "game-changer", "unlock the secrets", "in conclusion"

4. E-E-A-T SIGNALS (Experience, Expertise, Authority, Trust)
   - Check for author attribution and credentials
   - Detect expertise markers (certifications, experience, background)
   - Identify trust signals (sources cited, transparency, methodology)
   - Flag missing authorship information

5. ACTIONABILITY
   - Does content provide clear implementation steps?
   - Are there specific next actions readers can take?
   - Is guidance concrete vs. theoretical?

6. ENTITY COVERAGE
   - For the main topic, identify core entity
   - List related entities that should be present for completeness
   - Note missing entities that would strengthen context

7. WRITING QUALITY
   - Detect passive voice instances
   - Calculate active voice percentage
   - Provide rewrite suggestions for problematic phrases in document's tone

CRITICAL: Return ONLY valid JSON with this EXACT structure. EVERY field is MANDATORY - you MUST analyze and populate ALL fields with specific findings:

{
  "semanticTriples": [
    {"subject": "Lake houses", "predicate": "provide", "object": "rental income", "confidence": 0.9, "isActiveVoice": true}
  ],
  "entities": [
    {"text": "GEO Analyzer", "type": "PRODUCT", "context": "tool for content optimization", "importance": 0.9}
  ],
  "coherence": {
    "coherent": true,
    "missingContext": ["What problem does this solve?", "Who is the target audience?"],
    "selfContained": true
  },
  "relevance": 0.85,
  "structureQuality": {
    "hasAnswerFirst": true,
    "headingHierarchy": "clear",
    "questionsCovered": ["How does GEO work?", "What are the benefits?"]
  },
  "dataPointMetrics": {
    "statisticsCount": 5,
    "numericalClaimsCount": 8,
    "researchCitationsCount": 2,
    "specificExamples": ["527% increase in AI-referred sessions", "39% of marketers report declining clicks"]
  },
  "originalitySignals": {
    "hasPersonalInsights": true,
    "hasOriginalResearch": false,
    "hasUniqueData": true,
    "hasExpertOpinion": true,
    "originalityScore": 0.7,
    "genericPhrases": ["delve into", "in today's digital landscape"],
    "analysis": "Content shows personal experience with AI tools and unique usage data, but lacks original research. Writing feels authentic with minimal AI slop."
  },
  "writingQuality": {
    "passiveVoiceInstances": 3,
    "passiveVoiceExamples": ["Traffic was declined by 39%", "Content is being analyzed by AI engines"],
    "activeVoicePercentage": 85,
    "aiSlopIndicators": {
      "detected": false,
      "confidence": 0.2,
      "problematicPhrases": [
        {
          "phrase": "in today's digital landscape",
          "context": "In today's digital landscape, businesses face challenges",
          "suggestion": "Currently, businesses face digital challenges",
          "reason": "Generic AI opener - lacks specificity and sounds robotic"
        }
      ]
    },
    "explanation": "Strong active voice usage at 85%. Only 3 passive constructions found. Minimal AI-generated language detected. Rewriting the 2 flagged phrases would improve authenticity."
  },
  "eeatSignals": {
    "hasAuthorAttribution": true,
    "hasCredentials": false,
    "hasExpertiseMarkers": true,
    "authorDetails": {
      "present": true,
      "location": "header"
    },
    "trustSignals": ["External research citations", "First-hand experience"],
    "analysis": "Author is clearly identified with expertise markers (uses tool personally, shares analytics). Missing: formal credentials or professional background. Adding 1-2 sentences about author's industry experience would strengthen authority."
  },
  "actionability": {
    "hasActionableSteps": true,
    "implementationGuidancePresent": true,
    "clearNextSteps": ["Deploy to Cloudflare", "Configure MCP in Claude Desktop", "Run analysis on your content"],
    "actionabilityScore": 0.8,
    "analysis": "Content provides clear implementation steps with deployment instructions. Strong actionability. Could enhance with troubleshooting section or common gotchas."
  },
  "entityCoverage": {
    "coreEntityPresent": true,
    "relatedEntitiesFound": ["GEO Analyzer", "Cloudflare", "Claude Desktop", "AI search engines"],
    "missingRelatedEntities": ["Google AI Overviews", "Perplexity", "ChatGPT"],
    "entityDensityScore": 0.7,
    "analysis": "Main product entity well-covered. Related technologies mentioned. Missing explicit mentions of competing AI engines that would provide context."
  },
  "overallAssessment": {
    "strengths": [
      "💪 Strong active voice usage (85%) improves semantic extraction",
      "📊 Good data density with 8 numerical claims and 5 statistics",
      "✍️ Authentic writing with minimal AI-generated language (0.2 confidence)",
      "⚡ High actionability (0.8) with clear implementation steps"
    ],
    "weaknesses": [
      "👤 Missing author credentials - add professional background",
      "📚 No original research - consider conducting surveys or analysis",
      "🔗 Low research citations (only 2) - reference more authoritative studies",
      "❓ Limited question coverage - address more user intents explicitly"
    ],
    "quickWins": [
      "1️⃣ Add 2-3 sentence author bio with credentials (5 min, HIGH impact)",
      "2️⃣ Replace 2 passive voice sentences with active constructions (2 min, MEDIUM impact)",
      "3️⃣ Add 3-5 more statistics to strengthen credibility (10 min, HIGH impact)",
      "4️⃣ Create FAQ section answering 5-7 common questions (20 min, HIGH impact)"
    ],
    "priorityActions": [
      {
        "action": "Add author credentials section",
        "effort": "5 minutes",
        "impact": "HIGH",
        "reasoning": "E-E-A-T is critical for AI citation. Missing credentials reduces trustworthiness by 30-40%.",
        "implementation": "Add after introduction: 'About the author: [Name] is a [title] with [X years] experience in [field]. Previously worked at [companies/projects].'",
        "expectedImprovement": "+15-20% citation likelihood"
      },
      {
        "action": "Increase data point density",
        "effort": "15 minutes",
        "impact": "HIGH",
        "reasoning": "Content has only 5 statistics. Research shows 8-12 data points increase citation by 35%.",
        "implementation": "Add specific metrics: conversion rates, performance benchmarks, user growth numbers, comparison data.",
        "expectedImprovement": "+25-30% extractability score"
      },
      {
        "action": "Convert passive to active voice",
        "effort": "5 minutes",
        "impact": "MEDIUM",
        "reasoning": "3 passive constructions reduce semantic clarity. Active voice improves AI parsing.",
        "implementation": "Before: 'Traffic was declined by 39%' → After: 'Traffic declined by 39%'. Before: 'Content is being analyzed' → After: 'AI engines analyze content'.",
        "expectedImprovement": "+5-10% semantic triple extraction"
      }
    ]
  }
}

MANDATORY REQUIREMENTS:
✅ ALL fields must be populated - no empty arrays or null values
✅ Provide SPECIFIC examples, not generic placeholders
✅ Include "analysis" fields with detailed explanations (2-4 sentences each)
✅ "overallAssessment" must have 3-5 items in each array
✅ "priorityActions" must include implementation details and expected improvements
✅ Use emojis in overallAssessment for visual scanning
✅ Be specific with numbers, locations, and concrete suggestions
✅ Match document's tone when suggesting rewrites
✅ Return ONLY JSON - NO markdown fences, NO preamble, NO trailing text

Begin with { and end with }`;
  }

  private async callLLM(prompt: string): Promise<string> {
    try {
      const response = await this.ai.run(this.model as any, {
        messages: [
          {
            role: 'system',
            content: 'You are an AI search optimization expert. Return only valid JSON, no markdown formatting or additional text.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 4096,
        temperature: 0.1,
      });

      let rawResponse = (response as any).response;
      
      if (!rawResponse) {
        throw new Error('LLM returned no response field');
      }
      
      if (typeof rawResponse !== 'string') {
        rawResponse = JSON.stringify(rawResponse);
      }
      
      const stringResponse = String(rawResponse);
      
      if (!stringResponse || stringResponse.trim().length === 0) {
        throw new Error('LLM returned empty response');
      }
      
      return stringResponse;
    } catch (error) {
      throw new Error(`LLM call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseResponse(response: string, originalContent: string, query: string): LLMAnalysisResult {
    try {
      let cleaned = response.trim();
      
      if (!cleaned) {
        throw new Error('Empty response after trim');
      }
      
      cleaned = cleaned.replace(/```json\n?/g, '');
      cleaned = cleaned.replace(/```\n?/g, '');
      cleaned = cleaned.replace(/`/g, '');
      
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.semanticTriples && !parsed.entities) {
        throw new Error('Invalid JSON structure');
      }
      
      return {
        semanticTriples: this.validateTriples(parsed.semanticTriples || []),
        advancedEntities: this.validateEntities(parsed.entities || []),
        chunkCoherence: this.validateCoherence(parsed.coherence || {}),
        topicalRelevance: this.validateRelevance(parsed.relevance),
        structureQuality: this.validateStructureQuality(parsed.structureQuality || {}),
        dataPointMetrics: this.validateDataPointMetrics(parsed.dataPointMetrics || {}),
        originalitySignals: this.validateOriginalitySignals(parsed.originalitySignals || {}),
        writingQuality: this.validateWritingQuality(parsed.writingQuality || {}),
        eeatSignals: this.validateEEATSignals(parsed.eeatSignals || {}),
        actionability: this.validateActionability(parsed.actionability || {}),
        entityCoverage: this.validateEntityCoverage(parsed.entityCoverage || {}),
        overallAssessment: this.validateOverallAssessment(parsed.overallAssessment || {}),
      };
    } catch (error) {
      return this.createFallbackResult(originalContent, query);
    }
  }

  private validateTriples(triples: any[]): SemanticTriple[] {
    if (!Array.isArray(triples)) return [];
    
    return triples
      .filter(t => t.subject && t.predicate && t.object)
      .map(t => ({
        subject: String(t.subject),
        predicate: String(t.predicate),
        object: String(t.object),
        confidence: typeof t.confidence === 'number' ? Math.min(1, Math.max(0, t.confidence)) : 0.7,
        isActiveVoice: t.isActiveVoice !== false,
      }))
      .slice(0, 15);
  }

  private validateEntities(entities: any[]): AdvancedEntity[] {
    if (!Array.isArray(entities)) return [];
    
    const validTypes = ['PERSON', 'ORGANIZATION', 'LOCATION', 'PRODUCT', 'TECHNOLOGY', 'METRIC'];
    
    return entities
      .filter(e => e.text && validTypes.includes(e.type))
      .map(e => ({
        text: String(e.text),
        type: e.type as AdvancedEntity['type'],
        context: String(e.context || ''),
        importance: typeof e.importance === 'number' ? Math.min(1, Math.max(0, e.importance)) : 0.5,
      }))
      .slice(0, 15);
  }

  private validateCoherence(coherence: any): ChunkCoherence {
    if (!coherence || typeof coherence !== 'object') {
      return {
        coherent: true,
        missingContext: [],
        selfContained: true,
      };
    }
    
    return {
      coherent: coherence.coherent !== false,
      missingContext: Array.isArray(coherence.missingContext) 
        ? coherence.missingContext.slice(0, 5) 
        : [],
      selfContained: coherence.selfContained !== false,
    };
  }

  private validateRelevance(relevance: any): number {
    if (typeof relevance === 'number') {
      return Math.min(1, Math.max(0, relevance));
    }
    return 0.5;
  }

  private validateStructureQuality(structure: any): StructureQuality {
    const validHierarchies: Array<'clear' | 'partial' | 'poor'> = ['clear', 'partial', 'poor'];
    
    return {
      hasAnswerFirst: structure.hasAnswerFirst === true,
      headingHierarchy: validHierarchies.includes(structure.headingHierarchy) 
        ? structure.headingHierarchy 
        : 'partial',
      questionsCovered: Array.isArray(structure.questionsCovered)
        ? structure.questionsCovered.slice(0, 10).map(String)
        : [],
    };
  }

  private validateDataPointMetrics(metrics: any): DataPointMetrics {
    return {
      statisticsCount: typeof metrics.statisticsCount === 'number' ? metrics.statisticsCount : 0,
      numericalClaimsCount: typeof metrics.numericalClaimsCount === 'number' ? metrics.numericalClaimsCount : 0,
      researchCitationsCount: typeof metrics.researchCitationsCount === 'number' ? metrics.researchCitationsCount : 0,
      specificExamples: Array.isArray(metrics.specificExamples)
        ? metrics.specificExamples.slice(0, 10).map(String)
        : [],
    };
  }

  private validateOriginalitySignals(signals: any): OriginalitySignals {
    return {
      hasPersonalInsights: signals.hasPersonalInsights === true,
      hasOriginalResearch: signals.hasOriginalResearch === true,
      hasUniqueData: signals.hasUniqueData === true,
      hasExpertOpinion: signals.hasExpertOpinion === true,
      originalityScore: typeof signals.originalityScore === 'number'
        ? Math.min(1, Math.max(0, signals.originalityScore))
        : 0.5,
      genericPhrases: Array.isArray(signals.genericPhrases)
        ? signals.genericPhrases.slice(0, 15).map(String)
        : [],
      analysis: typeof signals.analysis === 'string' ? signals.analysis : undefined,
    };
  }

  private validateWritingQuality(quality: any): WritingQuality {
    return {
      passiveVoiceInstances: typeof quality.passiveVoiceInstances === 'number' ? quality.passiveVoiceInstances : 0,
      passiveVoiceExamples: Array.isArray(quality.passiveVoiceExamples)
        ? quality.passiveVoiceExamples.slice(0, 10).map(String)
        : [],
      activeVoicePercentage: typeof quality.activeVoicePercentage === 'number'
        ? Math.min(100, Math.max(0, quality.activeVoicePercentage))
        : 70,
      aiSlopIndicators: {
        detected: quality.aiSlopIndicators?.detected === true,
        confidence: typeof quality.aiSlopIndicators?.confidence === 'number'
          ? Math.min(1, Math.max(0, quality.aiSlopIndicators.confidence))
          : 0,
        problematicPhrases: Array.isArray(quality.aiSlopIndicators?.problematicPhrases)
          ? quality.aiSlopIndicators.problematicPhrases.slice(0, 15).map((p: any) => ({
              phrase: String(p.phrase || ''),
              context: String(p.context || ''),
              suggestion: String(p.suggestion || ''),
              reason: String(p.reason || ''),
            }))
          : [],
      },
      explanation: typeof quality.explanation === 'string' ? quality.explanation : undefined,
    };
  }

  private validateEEATSignals(signals: any): EEATSignals {
    return {
      hasAuthorAttribution: signals.hasAuthorAttribution === true,
      hasCredentials: signals.hasCredentials === true,
      hasExpertiseMarkers: signals.hasExpertiseMarkers === true,
      authorDetails: {
        present: signals.authorDetails?.present === true,
        location: typeof signals.authorDetails?.location === 'string'
          ? signals.authorDetails.location
          : 'missing',
      },
      trustSignals: Array.isArray(signals.trustSignals)
        ? signals.trustSignals.slice(0, 10).map(String)
        : [],
      analysis: typeof signals.analysis === 'string' ? signals.analysis : undefined,
    };
  }

  private validateActionability(actionability: any): ActionabilityAssessment {
    return {
      hasActionableSteps: actionability.hasActionableSteps === true,
      implementationGuidancePresent: actionability.implementationGuidancePresent === true,
      clearNextSteps: Array.isArray(actionability.clearNextSteps)
        ? actionability.clearNextSteps.slice(0, 10).map(String)
        : [],
      actionabilityScore: typeof actionability.actionabilityScore === 'number'
        ? Math.min(1, Math.max(0, actionability.actionabilityScore))
        : 0.5,
      analysis: typeof actionability.analysis === 'string' ? actionability.analysis : undefined,
    };
  }

  private validateEntityCoverage(coverage: any): EntityCoverageAnalysis {
    return {
      coreEntityPresent: coverage.coreEntityPresent !== false,
      relatedEntitiesFound: Array.isArray(coverage.relatedEntitiesFound)
        ? coverage.relatedEntitiesFound.slice(0, 20).map(String)
        : [],
      missingRelatedEntities: Array.isArray(coverage.missingRelatedEntities)
        ? coverage.missingRelatedEntities.slice(0, 10).map(String)
        : [],
      entityDensityScore: typeof coverage.entityDensityScore === 'number'
        ? Math.min(1, Math.max(0, coverage.entityDensityScore))
        : 0.5,
      analysis: typeof coverage.analysis === 'string' ? coverage.analysis : undefined,
    };
  }

  private validateOverallAssessment(assessment: any): OverallAssessment | undefined {
    if (!assessment || typeof assessment !== 'object') {
      return undefined;
    }

    return {
      strengths: Array.isArray(assessment.strengths)
        ? assessment.strengths.slice(0, 10).map(String)
        : [],
      weaknesses: Array.isArray(assessment.weaknesses)
        ? assessment.weaknesses.slice(0, 10).map(String)
        : [],
      quickWins: Array.isArray(assessment.quickWins)
        ? assessment.quickWins.slice(0, 10).map(String)
        : [],
      priorityActions: Array.isArray(assessment.priorityActions)
        ? assessment.priorityActions.slice(0, 5).map((action: any) => ({
            action: String(action.action || ''),
            effort: String(action.effort || ''),
            impact: String(action.impact || ''),
            reasoning: String(action.reasoning || ''),
            implementation: String(action.implementation || ''),
            expectedImprovement: String(action.expectedImprovement || ''),
          }))
        : [],
    };
  }

  private createFallbackResult(content: string, query: string): LLMAnalysisResult {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const contentLower = content.toLowerCase();
    const matches = queryTerms.filter(term => contentLower.includes(term));
    const relevance = Math.min(1.0, matches.length / queryTerms.length);
    
    return {
      semanticTriples: [],
      advancedEntities: [],
      chunkCoherence: {
        coherent: true,
        missingContext: ['LLM analysis failed - using fallback'],
        selfContained: true,
      },
      topicalRelevance: relevance,
      structureQuality: {
        hasAnswerFirst: false,
        headingHierarchy: 'partial',
        questionsCovered: [],
      },
      dataPointMetrics: {
        statisticsCount: 0,
        numericalClaimsCount: 0,
        researchCitationsCount: 0,
        specificExamples: [],
      },
      originalitySignals: {
        hasPersonalInsights: false,
        hasOriginalResearch: false,
        hasUniqueData: false,
        hasExpertOpinion: false,
        originalityScore: 0.5,
        genericPhrases: [],
      },
      writingQuality: {
        passiveVoiceInstances: 0,
        passiveVoiceExamples: [],
        activeVoicePercentage: 70,
        aiSlopIndicators: {
          detected: false,
          confidence: 0,
          problematicPhrases: [],
        },
      },
      eeatSignals: {
        hasAuthorAttribution: false,
        hasCredentials: false,
        hasExpertiseMarkers: false,
        authorDetails: {
          present: false,
          location: 'missing',
        },
        trustSignals: [],
      },
      actionability: {
        hasActionableSteps: false,
        implementationGuidancePresent: false,
        clearNextSteps: [],
        actionabilityScore: 0.5,
      },
      entityCoverage: {
        coreEntityPresent: false,
        relatedEntitiesFound: [],
        missingRelatedEntities: [],
        entityDensityScore: 0.5,
      },
    };
  }

  calculateAvgConfidence(triples: SemanticTriple[]): number {
    if (triples.length === 0) return 0;
    const sum = triples.reduce((acc, t) => acc + t.confidence, 0);
    return Math.round((sum / triples.length) * 100) / 100;
  }

  calculateAvgImportance(entities: AdvancedEntity[]): number {
    if (entities.length === 0) return 0;
    const sum = entities.reduce((acc, e) => acc + e.importance, 0);
    return Math.round((sum / entities.length) * 100) / 100;
  }

  groupEntityTypes(entities: AdvancedEntity[]): Record<string, number> {
    const groups: Record<string, number> = {};
    entities.forEach(e => {
      groups[e.type] = (groups[e.type] || 0) + 1;
    });
    return groups;
  }
}
