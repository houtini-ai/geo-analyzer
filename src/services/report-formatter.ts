import { GeoAnalysis, GeoScores } from '../types/geo.types.js';

export class ReportFormatter {
  formatMarkdown(analysis: GeoAnalysis): string {
    const sections: string[] = [];

    sections.push(`# GEO Analysis Report\n`);
    sections.push(`**Query:** ${analysis.targetQuery}`);
    sections.push(`**Analyzed:** ${analysis.analyzedAt}`);
    sections.push(`**Version:** ${analysis.version}\n`);

    sections.push(`## Overall Scores\n`);
    sections.push(this.formatScores(analysis.scores));

    sections.push(`\n## Key Metrics\n`);
    sections.push(this.formatMetrics(analysis.metrics));

    sections.push(`\n## Detailed Analysis\n`);
    sections.push(this.formatDetailedAnalysis(analysis.metrics));

    sections.push(`\n## Content Chunking Analysis\n`);
    sections.push(this.formatChunking(analysis.chunking));

    sections.push(`\n## Recommendations\n`);
    sections.push(this.formatRecommendations(analysis.recommendations));

    return sections.join('\n');
  }

  private formatScores(scores: GeoScores): string {
    const getEmoji = (score: number) => {
      if (score >= 7) return '🟢';
      if (score >= 5) return '🟡';
      return '🔴';
    };

    return `
${getEmoji(scores.overall)} **Overall:** ${scores.overall}/10
${getEmoji(scores.extractability)} **Extractability:** ${scores.extractability}/10
${getEmoji(scores.readability)} **Readability:** ${scores.readability}/10
${getEmoji(scores.citability)} **Citability:** ${scores.citability}/10
    `.trim();
  }

  private formatMetrics(metrics: any): string {
    const densityEmoji = {
      'excellent': '🟢',
      'good': '🟡',
      'diluted': '🟠',
      'severely-diluted': '🔴',
    };
    
    return `
**Information Density** *(NEW - based on Dejan AI research)*
- Word Count: ${metrics.informationDensity.wordCount} words
- Optimal Range: ${metrics.informationDensity.optimalRange.min}-${metrics.informationDensity.optimalRange.max} words
- ${densityEmoji[metrics.informationDensity.coverageCategory as keyof typeof densityEmoji]} Predicted AI Coverage: ${metrics.informationDensity.predictedCoverage}% (${metrics.informationDensity.coverageCategory})
- Grounding Budget: Rank #1 = ${metrics.informationDensity.groundingBudget.ifRank1.words} words, Rank #5 = ${metrics.informationDensity.groundingBudget.ifRank5.words} words
- Recommendation: ${metrics.informationDensity.recommendation.toUpperCase()}

**Answer Frontloading** *(NEW)*
- First 100 words: ${metrics.frontloading.first100Words.claims} claims, ${metrics.frontloading.first100Words.entities} entities
- First 300 words: ${metrics.frontloading.first300Words.claims} claims, ${metrics.frontloading.first300Words.entities} entities
- First claim appears at: word ${metrics.frontloading.firstClaimPosition}
- Frontloading Score: ${metrics.frontloading.frontloadingScore}/10

**Sentence Length**
- Average: ${metrics.sentenceLength.average} words
- Target: ${metrics.sentenceLength.target} words
- Problematic: ${metrics.sentenceLength.problematic.length} sentences

**Claim Density**
- Current: ${metrics.claimDensity.current} per 100 words
- Target: ${metrics.claimDensity.target} per 100 words

**Date Markers**
- Found: ${metrics.dateMarkers.found}
- Recommended: ${metrics.dateMarkers.recommended}

**Structure**
- Headings: ${metrics.structure.headingCount}
- Lists: ${metrics.structure.listCount}
- Has ToC: ${metrics.structure.hasTableOfContents ? 'Yes' : 'No'}

**Semantic Analysis**
- Triples: ${metrics.semanticTriples.total}
- Triple Density: ${metrics.semanticTriples.density}/100 words
- Entity Diversity: ${metrics.entities.diversity}
    `.trim();
  }

  private formatDetailedAnalysis(metrics: any): string {
    const sections: string[] = [];

    // Problematic sentences
    if (metrics.sentenceLength.problematic.length > 0) {
      sections.push('### Problematic Sentences (>30 words)\n');
      metrics.sentenceLength.problematic.forEach((item: any, i: number) => {
        sections.push(`**${i + 1}. ${item.location}** (${item.wordCount} words)`);
        sections.push(`> ${item.sentence}\n`);
      });
    }

    // Semantic triples examples
    if (metrics.semanticTriples.examples && metrics.semanticTriples.examples.length > 0) {
      sections.push('\n### Semantic Triple Examples\n');
      metrics.semanticTriples.examples.forEach((example: any, i: number) => {
        sections.push(`**${i + 1}. ${example.sentence}**`);
        example.triples.forEach((triple: any) => {
          sections.push(`- Subject: "${triple.subject}"`);
          sections.push(`- Predicate: "${triple.predicate}"`);
          sections.push(`- Object: "${triple.object}"`);
          sections.push(`- Confidence: ${Math.round(triple.confidence * 100)}%\n`);
        });
      });
    }

    return sections.join('\n');
  }

  private formatChunking(chunking: any): string {
    const sections: string[] = [];

    sections.push(`**Average Coherence:** ${Math.round(chunking.averageCoherence * 100)}%`);
    sections.push(`**Problematic Boundaries:** ${chunking.problematicBoundaries}\n`);

    if (chunking.chunks && chunking.chunks.length > 0) {
      sections.push('### Sample Chunks\n');
      chunking.chunks.slice(0, 3).forEach((chunk: any, i: number) => {
        sections.push(`**Chunk ${i + 1}**`);
        sections.push(`- Token Count: ${chunk.tokenCount}`);
        sections.push(`- Coherence: ${Math.round(chunk.semanticCoherence * 100)}%`);
        sections.push(`- Self-contained: ${chunk.selfContained ? 'Yes' : 'No'}`);
        sections.push(`- Preview: ${chunk.content.substring(0, 150)}...\n`);
      });
    }

    return sections.join('\n');
  }

  private formatRecommendations(recommendations: any[]): string {
    const high = recommendations.filter(r => r.priority === 'high');
    const medium = recommendations.filter(r => r.priority === 'medium');
    const low = recommendations.filter(r => r.priority === 'low');

    const sections: string[] = [];

    if (high.length > 0) {
      sections.push('### High Priority\n');
      high.forEach((rec, i) => {
        sections.push(`**${i + 1}. ${rec.method}**`);
        sections.push(`**Location:** ${rec.location}`);
        sections.push(`**Current:** ${rec.currentText}`);
        sections.push(`**Suggested:** ${rec.suggestedText}`);
        sections.push(`**Rationale:** ${rec.rationale}\n`);
      });
    }

    if (medium.length > 0) {
      sections.push('### Medium Priority\n');
      medium.forEach((rec, i) => {
        sections.push(`**${i + 1}. ${rec.method}**`);
        sections.push(`**Location:** ${rec.location}`);
        sections.push(`**Suggested:** ${rec.suggestedText}`);
        sections.push(`**Rationale:** ${rec.rationale}\n`);
      });
    }

    if (low.length > 0) {
      sections.push('### Low Priority\n');
      low.forEach((rec, i) => {
        sections.push(`**${i + 1}. ${rec.method}**`);
        sections.push(`${rec.location} - ${rec.suggestedText}\n`);
      });
    }

    return sections.join('\n');
  }
}
