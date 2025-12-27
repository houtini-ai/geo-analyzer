# Changelog

All notable changes to GEO Analyzer will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2024-12-27

### Added
- **Information Density Analysis** - Based on Dejan AI research on Google's grounding chunks
  - Word count optimisation with empirical coverage predictions
  - Predicted AI coverage percentage (from Dejan's 7,060 query study)
  - Grounding budget simulation for rank positions #1, #3, #5
  - Coverage categories: excellent (<1K words), good (1-2K), diluted (2-3K), severely-diluted (3K+)
  - Condensation/expansion recommendations based on optimal range (800-1,500 words)

- **Answer Frontloading Analysis** - Measures how quickly key information appears
  - First 100 words: claim count, entity count, density
  - First 300 words: claim count, entity count, density
  - First claim position detection
  - Frontloading score (0-10) based on answer immediacy

- **New Recommendations**
  - Content Condensation: Warns when content exceeds optimal length
  - Content Expansion: Suggests expansion for very short content
  - Answer Frontloading: Recommends leading with key claims

### Changed
- Updated extractability score calculation to include density and frontloading (new weighting)
- Report formatter now displays information density and frontloading metrics prominently
- Recommendations reference Dejan AI research for rationale

### Research Foundation
- Dejan AI: "How Big Are Google's Grounding Chunks?" (Dec 2025)
- Key finding: ~2,000 word budget per query, density beats length
- Pages <1K words: 61% coverage; 3K+ words: 13% coverage

## [2.0.1] - 2024-12-16

### Fixed
- Fixed Lucide icon destructuring error causing artifact generation to fail
- Resolved `Cannot destructure property 'ChevronDown' of 'window.lucide' as it is undefined` error
- Implemented safe optional chaining pattern for icon access

### Changed
- Standardized artifact visual style to light theme
- Updated from dark theme (slate-900) to light theme (gray-50)
- Replaced semantic CSS variables with concrete Tailwind classes
- Improved artifact visual consistency across all MCPs
- Updated collapsible sections to default to collapsed state

### Technical
- Changed icon access from `const { Icon } = window.lucide || {}` to `const Icon = window.lucide?.Icon`
- Updated all color tokens from emerald/amber/slate to green/yellow/gray
- Removed unreliable semantic variables (bg-primary, bg-secondary)

## [2.0.0] - 2024-12-16

### Added
- Complete rewrite for local execution
- Claude Sonnet 4.5 integration for semantic analysis
- Interactive React artifact dashboards with visual scores
- Built-in content scraping with cheerio
- Local pattern analysis (no external dependencies)
- Semantic triple extraction
- Named entity recognition
- Content chunking analysis
- Priority-sorted recommendations with rationale

### Changed
- Simplified setup to single npx command
- Upgraded semantic analysis from Llama 3.3 to Claude Sonnet 4.5
- Improved content fetching reliability
- Better error messages and handling
- Cleaner artifact visualization

### Removed
- Cloudflare Workers dependency (was required in v1.x)
- Jina API dependency (was required in v1.x)
- External service requirements
- Complex deployment process

### Migration from v1.x
- Remove `GEO_WORKER_URL` from config
- Remove `JINA_API_KEY` from config
- Add `ANTHROPIC_API_KEY` to config
- Tool parameters remain compatible

## [1.x] - Historical

v1.x releases used Cloudflare Workers + Jina API + Workers AI.
See `archive/README-v1.md` for historical documentation.
