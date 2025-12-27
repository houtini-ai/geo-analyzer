# Information Density & Grounding Chunks: Feature Roadmap

**Research Sources:**
- Dejan AI: "Google's Ranking Signals" (Dec 2025)
- Dejan AI: "How Big Are Google's Grounding Chunks?" (Dec 2025)
- MIT GEO Paper: Aggarwal et al. (2024)
- Gemini grounding research on RAG/chunking theory

---

## The Core Theory

AI search engines have a **limited attention span** (context window for ranking) and prioritise content that provides the answer immediately.

### Key Empirical Findings (Dejan AI, 7,060 queries analysed)

| Finding | Value | Implication |
|---------|-------|-------------|
| **Total grounding budget per query** | ~2,000 words | Fixed pie, not expandable |
| **#1 ranked source gets** | 531 words (28%) | Rank determines your share |
| **#5 ranked source gets** | 266 words (13%) | Half the exposure of #1 |
| **Median per-source selection** | 377 words | What actually gets used |
| **Pages <1K words coverage** | 61% | More of your content used |
| **Pages 3K+ words coverage** | 13% | Most content ignored |
| **Avg words per chunk** | 15.5 words | Very granular extraction |

**Core Insight:** "Density beats length" - a tight 800-word page gets 50%+ coverage; a 4,000-word page gets 13%.

---

## Current GEO Analyzer Coverage

### What We Already Measure (v2.0)

| Metric | Status | Notes |
|--------|--------|-------|
| Sentence length (target 15-20 words) | ✅ Implemented | Aligns with 15.5 word chunk finding |
| Claim density (target 4/100 words) | ✅ Implemented | Core extractability metric |
| Semantic triples | ✅ Implemented | Claude Sonnet extraction |
| Entity diversity | ✅ Implemented | Named entity recognition |
| Date markers | ✅ Implemented | Freshness signals |
| Structure (headings, lists) | ✅ Implemented | Basic HTML analysis |
| Chunking coherence | ⚠️ Partial | Simulated, not semantic |

### Gaps Identified by New Research

| Gap | Priority | Description |
|-----|----------|-------------|
| **Word count optimisation** | HIGH | No warning when content exceeds optimal ~1,500 words |
| **Answer immediacy** | HIGH | No measurement of how quickly key info appears |
| **Chunk self-containment** | HIGH | Current chunking is size-based, not semantic |
| **Section-level density** | MEDIUM | Only measure overall, not per-section |
| **Grounding budget simulation** | MEDIUM | What would Google select from this page? |
| **Coverage prediction** | MEDIUM | Estimate % of content AI would use |

---

## Proposed Feature List (v3.0)

### Tier 1: Critical Additions

#### 1. Content Length Optimisation
```typescript
interface LengthMetrics {
  totalWords: number;
  optimalRange: { min: 800, max: 1500 };
  predictedCoverage: number; // Based on Dejan's curve
  recommendation: 'expand' | 'optimal' | 'condense';
  dilutionWarning: boolean; // True if >2000 words
}
```

**Rationale:** Pages over 1,500 words see diminishing returns. Most content gets ignored. We should warn users when they're diluting their information density.

#### 2. Answer Immediacy Score
```typescript
interface ImmediacyMetrics {
  firstClaimPosition: number; // Word position of first extractable claim
  firstEntityPosition: number; // When do named entities appear?
  introductoryDensity: number; // Claims per 100 words in first 200 words
  questionAnswerGap: number; // Words between H1/title and answer
  frontloadingScore: number; // 0-10, higher = answer appears earlier
}
```

**Rationale:** AI engines have limited "attention span" - they prioritise content that provides the answer immediately. Measure how quickly we get to the point.

#### 3. Semantic Chunk Quality
```typescript
interface SemanticChunkMetrics {
  chunks: Array<{
    content: string;
    tokenCount: number;
    selfContained: boolean; // Can be understood without context
    danglingReferences: string[]; // "it", "this", "the product" without antecedent
    semanticCoherence: number; // 0-1, topic consistency
    keyClaimsInChunk: number;
  }>;
  problematicBoundaries: Array<{
    position: number;
    reason: 'mid-sentence' | 'topic-split' | 'context-dependent';
    suggestion: string;
  }>;
  averageSelfContainment: number;
}
```

**Rationale:** Google extracts ~15.5 word chunks. Each chunk must make sense independently. Generic references ("it", "this") break self-containment.

### Tier 2: Enhanced Analysis

#### 4. Section-Level Density Analysis
```typescript
interface SectionAnalysis {
  sections: Array<{
    heading: string;
    wordCount: number;
    claimDensity: number;
    entityDensity: number;
    recommendation: 'condense' | 'expand' | 'optimal';
  }>;
  weakestSection: string;
  strongestSection: string;
}
```

**Rationale:** Identify which sections are diluting overall density. Allow targeted improvements.

#### 5. Grounding Budget Simulation
```typescript
interface GroundingSimulation {
  estimatedBudget: number; // Words Google would likely use
  selectedPassages: Array<{
    text: string;
    reason: 'high-claim-density' | 'direct-answer' | 'entity-rich';
    confidence: number;
  }>;
  ignoredContent: {
    wordCount: number;
    percentage: number;
    examples: string[];
  };
  competitivePosition: {
    ifRank1: { words: number; coverage: number };
    ifRank5: { words: number; coverage: number };
  };
}
```

**Rationale:** Simulate what Google would actually extract. Show users exactly what's likely to be cited vs ignored.

#### 6. Frontloading Score
```typescript
interface FrontloadingMetrics {
  first100Words: {
    claims: number;
    entities: number;
    answersQuery: boolean;
  };
  first300Words: {
    claims: number;
    entities: number;
    coverageOfKey: number; // % of key claims in first 300 words
  };
  inversionScore: number; // 0-10, higher = key info at start
  pyramidStructure: boolean; // Does it follow inverted pyramid?
}
```

**Rationale:** "Lead with the answer" - measure whether content follows journalistic inverted pyramid structure.

### Tier 3: Advanced Features

#### 7. Competitive Density Comparison
```typescript
interface CompetitiveAnalysis {
  // Requires fetching competitor content
  competitors: Array<{
    url: string;
    wordCount: number;
    claimDensity: number;
    predictedCoverage: number;
  }>;
  yourPosition: number;
  densityAdvantage: number; // vs average competitor
}
```

#### 8. Chunk Boundary Optimisation
```typescript
interface BoundaryOptimisation {
  naturalBreakpoints: number[]; // Word positions for optimal chunking
  suggestedParagraphBreaks: number[];
  headingRecommendations: Array<{
    position: number;
    suggestedHeading: string;
  }>;
}
```

---

## Implementation Priority

### Phase 1 (v2.1) - Quick Wins
1. **Word count warning** - Simple check, high impact
2. **First 100 words density** - Measure intro quality
3. **Coverage prediction** - Apply Dejan's curve

### Phase 2 (v2.5) - Core Improvements  
4. **Semantic chunk analysis** - Replace simulated chunking
5. **Section-level density** - Per-section breakdowns
6. **Frontloading score** - Inverted pyramid detection

### Phase 3 (v3.0) - Advanced
7. **Grounding simulation** - What would AI select?
8. **Competitive comparison** - Density vs competitors
9. **Boundary optimisation** - Suggested restructuring

---

## Cross-Repo Applications

This research applies beyond GEO Analyzer:

### Jboard MCP
- Job description density analysis
- Optimal posting length recommendations
- Key requirements frontloading

### Voice Analysis MCP
- Writing style density patterns
- Sentence length distributions
- Self-containment scoring for style guides

### Content Machine (WordPress)
- Pre-publish density checks
- Section length recommendations
- Automatic "answer first" validation

### Fanout MCP
- Query decomposition with density awareness
- Content gap analysis including density metrics

---

## Scoring Algorithm Updates

### Current (v2.0)
```
Extractability = (claim_density + sentence_score + triple_density) / 3
```

### Proposed (v3.0)
```
Information Density = (
  claim_density * 0.25 +
  frontloading_score * 0.25 +
  self_containment * 0.20 +
  coverage_prediction * 0.15 +
  sentence_optimality * 0.15
)

Extractability = Information Density * structure_multiplier
```

**Key Changes:**
- Frontloading becomes a first-class metric
- Self-containment (chunk quality) added
- Coverage prediction based on word count
- Structure acts as multiplier, not additive

---

## Research References

1. **Dejan AI - Grounding Chunks** (Dec 2025)
   - https://dejan.ai/blog/how-big-are-googles-grounding-chunks/
   - 7,060 queries, 2,275 pages analysed
   - Empirical data on Google's extraction patterns

2. **Dejan AI - Ranking Signals** (Dec 2025)
   - https://dejan.ai/blog/googles-ranking-signals/
   - Base ranking, embedding adjustment, semantic relevance
   - PCTR models and freshness signals

3. **MIT GEO Paper** (2024)
   - https://arxiv.org/abs/2311.09735
   - Claim density methodology
   - 40% improvement in AI citation rates

4. **RAG Chunking Research**
   - Semantic vs fixed-size chunking
   - Self-containment requirements
   - Hierarchical chunk strategies

---

## Next Steps

1. [ ] Review this document with Richard
2. [ ] Prioritise Phase 1 features
3. [ ] Design type interfaces for new metrics
4. [ ] Implement word count warning (simplest first)
5. [ ] Add coverage prediction based on Dejan's data
6. [ ] Test on simracingcockpit.gg content

---

**Document Created:** 2024-12-27
**Status:** Draft for Review
**Author:** Claude (from research synthesis)
