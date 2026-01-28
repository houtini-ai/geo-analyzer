# GEO Analyzer v3.0 - Technical Implementation Notes

**Companion to:** GEO-ANALYZER-V3-SCOPE.md  
**Purpose:** Detailed implementation guidance for each new module

---

## Gemini Migration

### Current Anthropic Usage (to be replaced)

```typescript
// src/services/semantic-analyzer.ts - Current
import Anthropic from '@anthropic-ai/sdk';

private anthropic: Anthropic;

constructor(apiKey: string) {
  this.anthropic = new Anthropic({ apiKey });
}
```

### Proposed Gemini Implementation

```typescript
// src/services/semantic-analyzer.ts - v3.0
import { GoogleGenerativeAI } from '@google/generative-ai';

private genAI: GoogleGenerativeAI;
private model: GenerativeModel;

constructor(apiKey: string) {
  this.genAI = new GoogleGenerativeAI(apiKey);
  this.model = this.genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.1,  // Low for factual extraction
      maxOutputTokens: 2048
    }
  });
}
```

### Environment Variable Change

```json
// Claude Desktop config - Current
"env": {
  "ANTHROPIC_API_KEY": "sk-ant-..."
}

// Claude Desktop config - v3.0
"env": {
  "GEMINI_API_KEY": "..."
}
```

---

## FanOutDetector Implementation

### Core Algorithm

```typescript
interface FanOutResult {
  topic: string;
  generatedSubQueries: string[];
  coverage: {
    total: number;
    addressed: number;
    percentage: number;
  };
  structuralMatches: Array<{
    subQuery: string;
    matchType: 'h2' | 'h3' | 'table_column' | 'list_header' | 'prose_only' | 'missing';
    element?: string;
    confidence: number;
  }>;
  gaps: string[];
}

async function detectFanOut(html: string, topic: string): Promise<FanOutResult> {
  // Step 1: Generate sub-queries using Gemini
  const subQueries = await generateSubQueries(topic);
  
  // Step 2: Parse DOM for structural elements
  const $ = cheerio.load(html);
  const headers = $('h2, h3').map((_, el) => $(el).text()).get();
  const tableHeaders = $('th').map((_, el) => $(el).text()).get();
  const listHeaders = $('ul > li > strong, ol > li > strong').map((_, el) => $(el).text()).get();
  
  // Step 3: Match sub-queries to structural elements
  const matches = subQueries.map(sq => matchSubQuery(sq, headers, tableHeaders, listHeaders, $));
  
  // Step 4: Calculate coverage
  const addressed = matches.filter(m => m.matchType !== 'missing').length;
  
  return {
    topic,
    generatedSubQueries: subQueries,
    coverage: {
      total: subQueries.length,
      addressed,
      percentage: Math.round((addressed / subQueries.length) * 100)
    },
    structuralMatches: matches,
    gaps: matches.filter(m => m.matchType === 'missing').map(m => m.subQuery)
  };
}

async function generateSubQueries(topic: string): Promise<string[]> {
  const prompt = `Generate 8-10 specific sub-questions that users commonly ask when searching for "${topic}".

Focus on:
- Specific attributes (price, weight, battery, etc.)
- Use cases (for beginners, for professionals, etc.)
- Comparisons (vs alternatives, which is better)
- Concerns (durability, warranty, compatibility)

Return ONLY a JSON array of short phrases (2-4 words each).
Example: ["battery life", "weight comparison", "best for fps", "price range"]`;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}
```

### Match Scoring Logic

```typescript
function matchSubQuery(
  subQuery: string, 
  headers: string[], 
  tableHeaders: string[], 
  listHeaders: string[],
  $: CheerioAPI
): StructuralMatch {
  const normalised = subQuery.toLowerCase();
  
  // Priority 1: Exact H2/H3 match
  const h2Match = headers.find(h => 
    h.toLowerCase().includes(normalised) || 
    normalised.includes(h.toLowerCase())
  );
  if (h2Match) {
    return { subQuery, matchType: 'h2', element: h2Match, confidence: 1.0 };
  }
  
  // Priority 2: Table column match
  const tableMatch = tableHeaders.find(th => 
    th.toLowerCase().includes(normalised)
  );
  if (tableMatch) {
    return { subQuery, matchType: 'table_column', element: tableMatch, confidence: 0.9 };
  }
  
  // Priority 3: List header match
  const listMatch = listHeaders.find(lh => 
    lh.toLowerCase().includes(normalised)
  );
  if (listMatch) {
    return { subQuery, matchType: 'list_header', element: listMatch, confidence: 0.7 };
  }
  
  // Priority 4: Prose mention (weak signal)
  const bodyText = $('body').text().toLowerCase();
  if (bodyText.includes(normalised)) {
    return { subQuery, matchType: 'prose_only', confidence: 0.3 };
  }
  
  // No match
  return { subQuery, matchType: 'missing', confidence: 0 };
}
```

---

## FormatDiversityIndex Implementation

```typescript
interface FormatDiversity {
  structuredTokens: number;
  proseTokens: number;
  ratio: number;
  assessment: 'excellent' | 'good' | 'poor' | 'wall_of_text';
  breakdown: {
    tables: number;
    orderedLists: number;
    unorderedLists: number;
    definitionLists: number;
    prose: number;
  };
}

function analyzeFormatDiversity(html: string): FormatDiversity {
  const $ = cheerio.load(html);
  
  // Count tokens in structured elements
  const tableTokens = countTokens($('table').text());
  const ulTokens = countTokens($('ul').text());
  const olTokens = countTokens($('ol').text());
  const dlTokens = countTokens($('dl').text());
  
  const structuredTokens = tableTokens + ulTokens + olTokens + dlTokens;
  
  // Count prose tokens (p tags not inside structured elements)
  const allPText = $('p').not('table p, ul p, ol p, dl p').text();
  const proseTokens = countTokens(allPText);
  
  const total = structuredTokens + proseTokens;
  const ratio = total > 0 ? structuredTokens / total : 0;
  
  let assessment: FormatDiversity['assessment'];
  if (ratio >= 0.35) assessment = 'excellent';
  else if (ratio >= 0.25) assessment = 'good';
  else if (ratio >= 0.10) assessment = 'poor';
  else assessment = 'wall_of_text';
  
  return {
    structuredTokens,
    proseTokens,
    ratio: Math.round(ratio * 100) / 100,
    assessment,
    breakdown: {
      tables: tableTokens,
      orderedLists: olTokens,
      unorderedLists: ulTokens,
      definitionLists: dlTokens,
      prose: proseTokens
    }
  };
}

function countTokens(text: string): number {
  // Rough approximation: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}
```

---

## VerdictLocator Implementation

```typescript
interface Verdict {
  sentence: string;
  product: string;
  sentiment: string;
  useCase: string | null;
  location: string;
  confidence: number;
}

interface VerdictAnalysis {
  verdicts: Verdict[];
  blufDensity: number;  // verdicts per 1000 words
  sectionsWithBluf: number;
  sectionsTotal: number;
}

function locateVerdicts(html: string, entities: Entity[]): VerdictAnalysis {
  const $ = cheerio.load(html);
  const verdicts: Verdict[] = [];
  
  // BLUF patterns
  const patterns = [
    /(.+?)\s+is\s+(the\s+)?(best|top|leading|worst|excellent|outstanding|great|good)\s+(.+)/i,
    /(.+?)\s+(delivers|offers|provides)\s+(the\s+)?(best|excellent|outstanding)\s+(.+)/i,
    /(our\s+)?(top\s+)?(pick|choice|recommendation)\s+(is|for)\s+(.+)/i,
    /(.+?)\s+is\s+(ideal|perfect|recommended)\s+for\s+(.+)/i
  ];
  
  // Process each section
  $('h2').each((_, h2) => {
    const sectionStart = $(h2);
    const headerText = sectionStart.text();
    
    // Get first 50 words after header
    let nextText = '';
    let current = sectionStart.next();
    let wordCount = 0;
    
    while (current.length && wordCount < 50) {
      const text = current.text();
      nextText += ' ' + text;
      wordCount += text.split(/\s+/).length;
      current = current.next();
    }
    
    // Check patterns
    for (const pattern of patterns) {
      const match = nextText.match(pattern);
      if (match) {
        verdicts.push({
          sentence: match[0].trim().substring(0, 200),
          product: extractProduct(match[0], entities),
          sentiment: extractSentiment(match),
          useCase: extractUseCase(match),
          location: `After H2: "${headerText}"`,
          confidence: 0.9
        });
        break;
      }
    }
  });
  
  const wordCount = $('body').text().split(/\s+/).length;
  const blufDensity = (verdicts.length / wordCount) * 1000;
  
  return {
    verdicts,
    blufDensity: Math.round(blufDensity * 100) / 100,
    sectionsWithBluf: verdicts.length,
    sectionsTotal: $('h2').length
  };
}
```

---

## ProgrammaticSignal Implementation

```typescript
interface QuantitativeAnalysis {
  measurements: Measurement[];
  totalMeasurements: number;
  measurementDensity: number;  // per 1000 words
  vaguePhrases: VaguePhrase[];
  quantitativeScore: number;  // 0-100
}

interface Measurement {
  value: string;
  unit: string;
  context: string;
  location: string;
}

interface VaguePhrase {
  phrase: string;
  suggestion: string;
  location: string;
}

function analyzeQuantitativeContent(html: string): QuantitativeAnalysis {
  const $ = cheerio.load(html);
  const text = $('body').text();
  
  // Measurement patterns by category
  const measurementPatterns = [
    // Weight
    { pattern: /(\d+(?:\.\d+)?)\s*(g|grams?|kg|kilograms?|oz|ounces?|lbs?|pounds?)/gi, unit: 'weight' },
    // Time
    { pattern: /(\d+(?:\.\d+)?)\s*(ms|milliseconds?|s|seconds?|hrs?|hours?)/gi, unit: 'time' },
    // Frequency
    { pattern: /(\d+(?:\.\d+)?)\s*(Hz|kHz|MHz|GHz)/gi, unit: 'frequency' },
    // Battery
    { pattern: /(\d+(?:\.\d+)?)\s*(mAh|Wh|hours?\s+battery)/gi, unit: 'battery' },
    // Distance
    { pattern: /(\d+(?:\.\d+)?)\s*(mm|cm|m|inches?|"|ft|feet)/gi, unit: 'distance' },
    // Resolution/DPI
    { pattern: /(\d+(?:\.\d+)?)\s*(DPI|dpi|CPI|cpi)/gi, unit: 'sensitivity' },
    // Price
    { pattern: /[$£€]\s*(\d+(?:\.\d{2})?)/g, unit: 'price' },
  ];
  
  const measurements: Measurement[] = [];
  
  for (const { pattern, unit } of measurementPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      measurements.push({
        value: match[1],
        unit,
        context: text.substring(Math.max(0, match.index - 50), match.index + match[0].length + 50),
        location: `Character ${match.index}`
      });
    }
  }
  
  // Detect vague phrases that should be quantified
  const vaguePhrases: VaguePhrase[] = [];
  const vaguePatterns = [
    { pattern: /feels?\s+(light|heavy|fast|slow|smooth)/gi, suggestion: 'Replace with specific weight measurement' },
    { pattern: /lasts?\s+a\s+(long|short)\s+time/gi, suggestion: 'Replace with specific battery hours' },
    { pattern: /(very|extremely|quite|really)\s+(responsive|fast|quick)/gi, suggestion: 'Replace with latency measurement in ms' },
    { pattern: /high\s+quality|premium\s+build/gi, suggestion: 'Specify materials and construction details' },
  ];
  
  for (const { pattern, suggestion } of vaguePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      vaguePhrases.push({
        phrase: match[0],
        suggestion,
        location: `Character ${match.index}`
      });
    }
  }
  
  const wordCount = text.split(/\s+/).length;
  const measurementDensity = (measurements.length / wordCount) * 1000;
  
  // Score: higher is better
  // Baseline: 5 measurements per 1000 words = 50 points
  // Penalty: -5 points per vague phrase
  const baseScore = Math.min(100, measurementDensity * 10);
  const penalty = vaguePhrases.length * 5;
  const quantitativeScore = Math.max(0, baseScore - penalty);
  
  return {
    measurements,
    totalMeasurements: measurements.length,
    measurementDensity: Math.round(measurementDensity * 100) / 100,
    vaguePhrases,
    quantitativeScore: Math.round(quantitativeScore)
  };
}
```

---

## SchemaValidator Implementation

```typescript
interface SchemaValidation {
  found: SchemaType[];
  missing: SchemaRecommendation[];
  errors: SchemaError[];
  overallScore: number;
}

interface SchemaType {
  type: string;
  properties: string[];
  hasRequiredFields: boolean;
}

interface SchemaRecommendation {
  type: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

function validateSchema(html: string, contentType: 'product_roundup' | 'how_to' | 'article'): SchemaValidation {
  const $ = cheerio.load(html);
  
  // Extract JSON-LD scripts
  const jsonLd = $('script[type="application/ld+json"]')
    .map((_, el) => {
      try {
        return JSON.parse($(el).html() || '');
      } catch {
        return null;
      }
    })
    .get()
    .filter(Boolean);
  
  const found: SchemaType[] = [];
  
  for (const schema of jsonLd) {
    const type = schema['@type'];
    if (type) {
      found.push({
        type,
        properties: Object.keys(schema),
        hasRequiredFields: validateRequiredFields(type, schema)
      });
    }
  }
  
  // Determine missing schemas based on content type
  const missing: SchemaRecommendation[] = [];
  
  if (contentType === 'product_roundup') {
    if (!found.some(s => s.type === 'ItemList')) {
      missing.push({ type: 'ItemList', reason: 'Product roundups should use ItemList schema', priority: 'high' });
    }
    if (!found.some(s => s.type === 'Product' || s.type === 'Review')) {
      missing.push({ type: 'Product or Review', reason: 'Individual products should have Product or Review schema', priority: 'medium' });
    }
  }
  
  if (!found.some(s => s.type === 'FAQPage') && $('h2, h3').filter((_, el) => /\?/.test($(el).text())).length >= 2) {
    missing.push({ type: 'FAQPage', reason: 'Page has FAQ-style headers that could use FAQPage schema', priority: 'medium' });
  }
  
  const errors: SchemaError[] = found
    .filter(s => !s.hasRequiredFields)
    .map(s => ({ type: s.type, message: 'Missing required fields' }));
  
  const overallScore = calculateSchemaScore(found, missing, errors);
  
  return { found, missing, errors, overallScore };
}

function validateRequiredFields(type: string, schema: any): boolean {
  const requiredFields: Record<string, string[]> = {
    'Product': ['name'],
    'Review': ['itemReviewed', 'reviewRating'],
    'FAQPage': ['mainEntity'],
    'HowTo': ['name', 'step'],
    'ItemList': ['itemListElement']
  };
  
  const required = requiredFields[type] || [];
  return required.every(field => field in schema);
}
```

---

## Updated Report Formatter

The v3.0 report should include new sections:

```markdown
## GEO Analysis Report v3.0

### Fan-Out Coverage Analysis
**Topic:** Wireless Gaming Mouse
**Coverage Score:** 75/100

**Sub-Intent Coverage:**
| Sub-Intent | Match Type | Element | Confidence |
|------------|------------|---------|------------|
| battery life | h2 | "Battery Life and Charging" | 100% |
| weight | table_column | "Weight (g)" | 90% |
| latency | prose_only | - | 30% |
| sensor quality | missing | - | 0% |

**Gaps to Address:**
- Create dedicated H2 for "Sensor Quality and Accuracy"
- Elevate latency discussion from prose to structured section

### Format Diversity
**Structured Content Ratio:** 32%
**Assessment:** Good

| Content Type | Tokens | Percentage |
|--------------|--------|------------|
| Tables | 1,240 | 18% |
| Lists | 980 | 14% |
| Prose | 4,520 | 68% |

### Verdict Locator (BLUF Analysis)
**Sections with BLUF:** 4/6
**BLUF Density:** 2.3 per 1000 words

**Detected Verdicts:**
1. "The Razer Viper V3 Pro is the best wireless gaming mouse for competitive FPS"
2. "Logitech G502 X Plus is ideal for users who need many programmable buttons"

**Missing BLUF in sections:**
- "Budget Options" - add verdict sentence to opening
- "MMO Recommendations" - lead with top pick

### Quantitative Analysis
**Measurement Density:** 8.2 per 1000 words
**Score:** 82/100

**Vague Phrases to Fix:**
| Phrase | Suggestion |
|--------|------------|
| "feels extremely light" | Specify weight: "weighs only 54g" |
| "lasts a long time" | Specify: "95+ hours battery life" |

### Schema Validation
**Found:** Article, ItemList
**Missing:** Product (high priority), FAQPage (medium)
**Errors:** None
```

---

*This technical specification provides implementation guidance. Actual code should follow existing codebase patterns and TypeScript conventions.*
