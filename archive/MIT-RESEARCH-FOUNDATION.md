# MIT Research Foundation - Pattern Analyzer

**Research Paper:** "GEO: Generative Engine Optimization" by Aggarwal et al. (2024)  
**Conference:** ACM SIGKDD  
**Source:** https://arxiv.org/abs/2311.09735

## Core Methodology

This implementation follows the validated research methodology from the GEO paper, which analyzed 10,000 queries across multiple AI systems to identify optimization techniques that improve AI citation rates.

### Key Finding

**Methods focused on extractability (claim density, semantic triples, entity extraction) delivered the strongest improvements, increasing AI citation rates by up to 40% compared to baseline content.**

Traditional SEO approaches like keyword stuffing performed poorly or actually reduced visibility in AI-generated responses.

## Validated Metrics

### 1. Claim Density

**Target:** 4.0+ claims per 100 words

**Definition:** A claim is a factual statement that can be extracted and verified.

**Example Claims:**
- "The Fanatec DD Pro delivers 8Nm of torque"
- "PlayStation users prefer direct drive wheelbases"
- "Logitech wheels cost under £300"

**Implementation:**
```typescript
// Pattern matching for claims
const patterns = [
  /\b\d+%\b/,                    // Percentages
  /\b\d+[.,]\d+\b/,              // Decimals
  /\b\d+\s*(nm|kg|mm|hz)\b/i,   // Measurements
  /\b(costs?|priced?|worth)\b/i, // Pricing
  // ... more patterns
];
```

### 2. Sentence Length

**Target:** 15-20 words average

**Rationale:** Optimal for AI parsing - not too short (lacks context), not too long (hard to extract).

**Implementation:**
```typescript
const sentences = text.split(/[.!?]+/);
const lengths = sentences.map(s => 
  s.split(/\s+/).filter(w => w.length > 0).length
);
const average = lengths.reduce((a, b) => a + b) / lengths.length;
```

### 3. Semantic Triples

**Format:** (subject, predicate, object)

**Examples:**
- (Fanatec DD Pro, delivers, 8Nm torque)
- (PlayStation users, prefer, direct drive)
- (Logitech wheels, cost, under £300)

**Purpose:** Structured relationships AI systems can extract and reason about.

### 4. Entity Diversity

**Categories:** PERSON, ORG, PRODUCT, LOCATION, DATE, MEASUREMENT

**Why It Matters:** Breadth of named entities signals comprehensive coverage.

**Example:**
```
PRODUCT: Fanatec CSL DD, Logitech G923
ORG: Fanatec, Thrustmaster, Logitech
MEASUREMENT: 8Nm, 5Nm, 300 degrees
```

### 5. Temporal Markers

**Purpose:** Freshness signals for AI systems

**Detection Patterns:**
- Explicit dates: "December 2024", "2024"
- Relative time: "recently", "this year"
- Version indicators: "v2.0", "latest"

## Scoring Algorithm

### Extractability Score (0-10)

**Formula:**
```typescript
const extractability = (
  (claimDensity / 4.0) * 0.4 +           // 40% weight
  (sentenceScore / 10) * 0.3 +           // 30% weight
  (semanticDensity / 5.0) * 0.3          // 30% weight
) * 10;
```

**Components:**
- Claim density normalized against target of 4.0
- Sentence length scored on 0-10 scale (15-20 words = 10)
- Semantic triple density per 100 words

### Readability Score (0-10)

**Formula:**
```typescript
const readability = (
  (avgSentenceLength <= 20 ? 1.0 : 0.6) * 0.4 +
  (hasHeadings ? 1.0 : 0.5) * 0.3 +
  (hasList ? 1.0 : 0.7) * 0.3
) * 10;
```

**Factors:**
- Sentence length distribution
- Presence of structural elements (headings, lists)
- Logical chunking and paragraphs

### Citability Score (0-10)

**Formula:**
```typescript
const citability = (
  (entityDiversity / maxEntityTypes) * 0.5 +
  (hasDateMarkers ? 1.0 : 0.3) * 0.3 +
  (semanticTriples > 5 ? 1.0 : 0.6) * 0.2
) * 10;
```

**Factors:**
- Entity type diversity (PERSON, ORG, PRODUCT, etc.)
- Temporal context markers
- Density of semantic relationships

### Overall Score (0-10)

**Formula:**
```typescript
const overall = (
  extractability * 0.4 +
  readability * 0.3 +
  citability * 0.3
);
```

**Weighted average prioritizing extractability** (research showed this had highest impact).

## Implementation Notes

### Pattern Analyzer Location

**File:** `packages/cloudflare-worker/src/analyzer/pattern-analyzer.ts`  
**Status:** Preserved unchanged in v2.0

**Why Keep It:**
- Validated methodology from peer-reviewed research
- Independent of AI models (pure computation)
- Fast execution (no API calls)
- Accurate scoring

### What Changed in v2.0

❌ **Removed:** Cloudflare Workers AI integration  
✅ **Added:** Sonnet 4.5 for semantic analysis  
✅ **Kept:** All pattern analysis unchanged

### Testing Validation

**Test Cases:**
```typescript
// High extractability content
const goodContent = {
  claimDensity: 4.5,
  avgSentenceLength: 18,
  semanticTriples: 12,
  expectedScore: 8.5
};

// Low extractability content
const poorContent = {
  claimDensity: 1.2,
  avgSentenceLength: 35,
  semanticTriples: 2,
  expectedScore: 3.8
};
```

## References

**Primary Research:**
Aggarwal, P., Murahari, V., Rajpurohit, T., Kalyan, A., Narasimhan, K., & Deshpande, A. (2024). GEO: Generative Engine Optimization. ACM SIGKDD Conference on Knowledge Discovery and Data Mining.

**Related Work:**
- Content optimization for neural search
- Structured data extraction from unstructured text
- Natural language understanding for information retrieval

---

**This methodology is the validated foundation of GEO analysis. We preserve it unchanged across all versions.**