# iPullRank Chapter 14: Query and Entity Attribution for GEO

Source: https://ipullrank.com/ai-search-manual/attribution

## Core Insight

The visible query from the user is just the spark. The actual retrieval process happens behind the scenes via fan-out of synthetic queries, entity lookups, and ranking layers. GEO lives and dies in that invisible space.

## The Reality of Fan-Out in AI Search

The typed query is just a seed. The system decomposes it into:
- Named entities
- Task intent
- Temporal scope
- Contextual modifiers

### Example: "best laptops for video editing 2025"

**Parsed as:**
- Entity: [Laptop computers]
- Attribute: [Video editing performance]
- Time constraint: [2025 models]
- Modifier: [Best] → Ranking/comparison intent

**Expansion variations generated:**
- "4K video editing laptop benchmarks 2025"
- "Best laptops for Adobe Premiere Pro 2025"
- "Laptop render speed DaVinci Resolve"
- "Top CPU for laptop video editing 2025"
- "Color grading monitor accuracy laptop"

Some hit web index, others query Knowledge Graph, others pull from YouTube transcripts or Google Shopping.

**KEY INSIGHT:** Treat every typed query as just the surface representation of intent. Build your process to anticipate and optimize for the synthetic subqueries AI systems will generate.

## Observing Fan-Out Through Query Perturbation Testing

You can't directly see Google's internal subqueries, but you can infer them by "perturbing the input."

**Method:**
1. Take base query ("best laptops for video editing 2025")
2. Systematically vary it:
   - Replace attributes ("fast rendering laptops")
   - Swap entities ("MacBook Pro video editing")
   - Adjust temporal markers ("2024" vs "2025")
   - Introduce synonyms ("laptops for film editing")
3. Check if AI Overview triggers and which URLs are cited
4. Map URL overlap across variations

**Result:** URLs that persist across many variations are strong candidates for being retrieved via a shared synthetic subquery.

## Reconstructing the Fan-Out Tree

**Process:**
1. Start with high-value seed queries
2. Generate 10-50 controlled variations per seed
3. Log every AI Overview trigger + citation URLs
4. Compute co-citation frequency (how often two URLs appear together)
5. Plot as network graph (nodes = URLs, edges = co-citation weighted by frequency)
6. Identify clusters = retrieval sets for each branch of fan-out

**Clusters reveal:**
- What content is winning exposure for each latent sub-intent
- The competitive "citation neighborhood" you need to join/dominate

## Predicting Fan-Out Before It Happens

**Simulation approach:**
1. Start with keyword graph data (Semrush/Ahrefs)
2. Feed seed query to LLM with instruction: "Generate every query a retrieval system might run to fully answer this question, including low-volume and zero-volume variants"
3. Run entity extraction on combined set
4. Test predicted queries in live search
5. Validate or identify gaps

## The Primacy of Entities

**KEY INSIGHT:** Entities matter more than exact keywords because entities are how AI search systems structure knowledge.

Two lexically different queries can resolve to the same entity set:
- "Hiking permits for Angel's Landing"
- "Trail restrictions in Zion National Park"

Both resolve to [Zion National Park] and [Permit Requirements].

Building an **entity-query co-occurrence matrix** reveals which entities drive the most retrieval eligibility.

## Mapping Entities to Retrieval Eligibility

**Three capabilities needed:**

1. **Entity Extraction** - Identify entities in queries and content
2. **Entity Resolution** - Match surface forms to canonical Knowledge Graph IDs (Wikidata QIDs)
3. **Entity Linking** - Ensure content is semantically connected via structured data, internal linking, and on-page context

## Integrating Query and Entity Attribution

Every observed citation should be logged with:
- Triggering queries (user-facing and synthetic)
- Resolved entities
- Retrieval branch (inferred from co-citation/context)

**This dataset shows:**
- Which subqueries are most influential
- Which entities dominate retrieval eligibility
- Where your content wins citations vs. is absent

**For new content, cross-check:**
- Does it cover high-influence entities?
- Does it align with subqueries that consistently drive citations?
- Are there internal links reinforcing entity connections?

## Future: Multi-Hop Reasoning

AI search systems are getting better at chaining multiple retrievals where the second depends on the first's output.

Fan-out won't just be flat subqueries; it'll be a layered graph with intermediate reasoning steps. Entities = glue between layers.

**ACTION:** Track "bridge entities" - nodes that connect different clusters. These become disproportionately important with deeper reasoning.
