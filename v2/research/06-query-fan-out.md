# iPullRank Chapter 8: Query Fan-Out, Latent Intent, and Source Aggregation

Source: https://ipullrank.com/ai-search-manual/query-fan-out

## Core Concept: The Query You Type is NOT the Query the System Uses

In generative search, the initial input is treated as a HIGH-LEVEL PROMPT that sets off a broader exploration. The system:
1. Decomposes the query
2. Rewrites it in multiple forms
3. Generates speculative follow-ups
4. Routes each variant to different sources

**The real competition is at the SUBQUERY level.**

## Example: "best half marathon training plan for beginners"

Becomes a tree of expansions:
- Training plans by time frame
- Gear checklists
- Injury prevention strategies
- Nutrition plans
- Pacing strategies
- Post-race recovery guides

The system builds a portfolio of evidence, not a single match.

## Stage 1: Query Expansion and Latent Intent Mining

### 1. Intent Classification
- Domain: sports and fitness (running subdomain)
- Task type: plan/guide
- Embedded comparative element: "best" = evaluation
- Risk profile: low (with safety component for injury prevention)

### 2. Slot Identification
**Explicit slots:**
- "half marathon" = distance
- "beginners" = audience

**Implicit slots (system infers):**
- Available training timeframe
- Current fitness level
- Age group
- Goal (finish vs PR)

### 3. Latent Intent Projection (Vector Space)
Original query embedded in high-dimensional vector space, identifying neighbors:
- "16-week beginner training schedule"
- "run-walk method"
- "cross-training for runners"
- "gear checklist for long runs"
- "hydration strategies"
- "how to avoid shin splints"

Informed by historical query co-occurrence, clickstream patterns, and knowledge graph linkages.

### 4. Rewrites and Diversifications
- Narrowing: "12-week half marathon plan for beginners over 40"
- Format: "printable beginner half marathon schedule"

### 5. Speculative Sub-Questions
Based on patterns from similar sessions:
- "What shoes are best for half marathon training?"
- "How many miles should I run each week?"

**GEO IMPLICATION:** If you only produce content for the exact query, you compete for ONE branch. To be in generative answers regularly, be present in MANY branches.

## Stage 2: Subquery Routing and Fan-Out Mapping

### Mapping Subqueries to Sources

| Query Class | Preferred Source Types | Preferred Formats |
|-------------|------------------------|-------------------|
| Plan | Coaching blogs, training websites | Long-form text, structured schedules, tables |
| Checklist | E-commerce, product review sites | Listicles, bullet lists, comparison tables |
| Routine | Instructional platforms, YouTube | Video (with transcripts), step-by-step guides |
| Definition | Knowledge bases, encyclopedias | Concise explanatory text, structured definitions |

### Modality-Aware Routing

If the system decides "stretch routine" should be answered with video, it prioritizes video repositories BUT often prefers transcripts for fast parsing.

**KEY:** Content created as video might be invisible if it lacks a transcript.

### Retrieval Strategies
- **Sparse retrieval (BM25):** Matches rare, specific terms
- **Dense retrieval (embeddings):** Captures semantic similarity despite different wording
- **Hybrid:** Combines both

**GEO IMPLICATION:** Multi-modal parity matters. Publish your training plan as:
- Narrative text
- Structured table
- Downloadable file
- Short video with transcript

## Stage 3: Selection for Synthesis

### 1. Extractability (First Gate)
Content must be cleanly separatable from surrounding context.

**WINS:** Training schedule as a table with headers for "Week," "Miles," "Notes"
**LOSES:** Same schedule buried narratively in a long paragraph

Content with explicit headings, list tags, and semantic markup performs better.

### 2. Evidence Density (Signal-to-Noise Ratio)

**HIGH DENSITY:** "Most beginners should train three to four days per week, with long runs increasing by one mile each week, according to the American College of Sports Medicine."
- Specific recommendation
- Progression details
- Credible source citation

**LOW DENSITY:** 400-word reminiscence with facts scattered throughout.

### 3. Scope Clarity and Applicability
Statements like "This plan assumes you can currently run three miles without stopping" are EXTREMELY useful because they define applicability.

For YMYL: "As of February 2025, Marcus by Goldman Sachs has no minimum deposit" beats "No minimum deposit" (scoped in time AND product type).

### 4. Authority and Corroboration
- Author/publisher-level trust (certified coach, registered dietitian)
- Corroboration from multiple independent sources
- Multiple points of agreement = higher survival rate

### 5. Freshness and Stability
- Content with clear dates and evidence of recent review
- Critical in finance (rates change monthly)

### 6. Harm and Safety Filters
- Removes chunks recommending unsafe practices
- Domain-specific policies + learned patterns

### Why Good Content Gets Excluded
- Format doesn't align with extractability needs
- Interactive content with no crawlable data
- Long-form frontloads narrative, pushes facts deep

## Strategic Implications for GEO

1. **Intent coverage replaces keyword coverage**
   - Anticipate expansions the system will generate
   - Build intent-complete hubs addressing common/valuable expansions

2. **Multi-modal parity = table stakes**
   - Text, tables, images, videos, transcripts, structured data
   - More entry points into retrieval process

3. **Chunk-level relevance engineering**
   - Design each information unit to stand alone if lifted
   - Label, structure, and version each unit

4. **Measurement must evolve**
   - Sub-query recall: How many branches of fan-out you appear in
   - Atomic coverage: % of content meeting extractability criteria
   - Evidence density: Signal-to-noise ratio in chunks
   - Citation stability: How often selected in regeneration cycles

**KEY INSIGHT:** The shift to generative search is a shift from competing for a single keyword to competing for every relevant moment in a dynamic, multi-branch retrieval plan.

Design content for INTEGRATION into answers, not standalone consumption.
