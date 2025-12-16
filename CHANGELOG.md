# Changelog

All notable changes to GEO Analyzer will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
