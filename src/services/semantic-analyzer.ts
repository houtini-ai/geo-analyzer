import Anthropic from '@anthropic-ai/sdk';
import { SemanticTriple, SemanticAnalysisResult } from '../types/geo.types.js';

export class SemanticAnalyzer {
  private anthropic: Anthropic;

  constructor(apiKey: string) {
    this.anthropic = new Anthropic({ apiKey });
  }

  async analyze(content: string): Promise<SemanticAnalysisResult> {
    try {
      const [triples, entities] = await Promise.all([
        this.extractSemanticTriples(content),
        this.extractEntities(content),
      ]);

      const entityTypes = new Set(entities.map(e => e.type));
      const diversity = entityTypes.size / 6;

      return {
        triples,
        entities,
        diversity: Math.round(diversity * 100) / 100,
      };
    } catch (error) {
      throw new Error(`Semantic analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async extractSemanticTriples(content: string): Promise<SemanticTriple[]> {
    const truncatedContent = content.slice(0, 8000);

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Extract semantic triples from the following content.

A semantic triple is a (subject, predicate, object) relationship that represents a factual claim.

Examples:
- "Fanatec's DD Pro delivers 8Nm" → (DD Pro, delivers, 8Nm torque)
- "PlayStation users prefer direct drive" → (PlayStation users, prefer, direct drive)
- "The CSL DD costs £350" → (CSL DD, costs, £350)

Rules:
- Extract only factual statements (not opinions or questions)
- Use specific subjects (not "it", "this", "that")
- Keep predicates active and concise
- Include measurements/numbers in objects when present

Content:
${truncatedContent}

Return ONLY the triples in this exact format, one per line:
(subject|predicate|object)

Maximum 15 triples. No other text.`,
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return this.parseTriples(text);
  }

  private async extractEntities(content: string): Promise<Array<{
    text: string;
    type: 'PERSON' | 'ORG' | 'PRODUCT' | 'LOCATION' | 'DATE' | 'MEASUREMENT';
  }>> {
    const truncatedContent = content.slice(0, 8000);

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Identify all named entities in this content and categorise them.

Categories:
- PERSON: Names of people
- ORG: Companies, organizations, brands
- PRODUCT: Specific products or models
- LOCATION: Places, countries, cities
- DATE: Dates, years, time periods
- MEASUREMENT: Numbers with units (8Nm, 300mm, 5kg, etc.)

Content:
${truncatedContent}

Return JSON format only (no markdown, no code blocks):
[
  {"text": "Fanatec", "type": "ORG"},
  {"text": "DD Pro", "type": "PRODUCT"},
  {"text": "8Nm", "type": "MEASUREMENT"}
]

Maximum 30 entities.`,
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return this.parseEntities(text);
  }

  private parseTriples(text: string): SemanticTriple[] {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const triples: SemanticTriple[] = [];

    for (const line of lines) {
      const match = line.match(/\(([^|]+)\|([^|]+)\|([^)]+)\)/);
      if (match) {
        triples.push({
          subject: match[1].trim(),
          predicate: match[2].trim(),
          object: match[3].trim(),
          confidence: 0.9,
        });
      }
    }

    return triples.slice(0, 15);
  }

  private parseEntities(text: string): Array<{
    text: string;
    type: 'PERSON' | 'ORG' | 'PRODUCT' | 'LOCATION' | 'DATE' | 'MEASUREMENT';
  }> {
    try {
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      
      if (Array.isArray(parsed)) {
        return parsed
          .filter(entity => 
            entity.text && 
            entity.type &&
            ['PERSON', 'ORG', 'PRODUCT', 'LOCATION', 'DATE', 'MEASUREMENT'].includes(entity.type)
          )
          .slice(0, 30);
      }
      return [];
    } catch (error) {
      return [];
    }
  }
}
