import { GeoAnalysis, GeoScores } from '../types/geo.types.js';
import { createArtifactPrompt } from '../prompts/artifact-report.js';

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

    sections.push(`\n## Recommendations\n`);
    sections.push(this.formatRecommendations(analysis.recommendations));

    return sections.join('\n');
  }

  formatArtifactPrompt(analysis: GeoAnalysis): string {
    return createArtifactPrompt(analysis);
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
    return `
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

  private formatRecommendations(recommendations: any[]): string {
    const high = recommendations.filter(r => r.priority === 'high');
    const medium = recommendations.filter(r => r.priority === 'medium');
    const low = recommendations.filter(r => r.priority === 'low');

    const sections: string[] = [];

    if (high.length > 0) {
      sections.push('### High Priority\n');
      high.forEach((rec, i) => {
        sections.push(`**${i + 1}. ${rec.method}**`);
        sections.push(`Location: ${rec.location}`);
        sections.push(`Current: ${rec.currentText}`);
        sections.push(`Suggested: ${rec.suggestedText}`);
        sections.push(`Rationale: ${rec.rationale}\n`);
      });
    }

    if (medium.length > 0) {
      sections.push('### Medium Priority\n');
      medium.forEach((rec, i) => {
        sections.push(`**${i + 1}. ${rec.method}**`);
        sections.push(`Location: ${rec.location}`);
        sections.push(`Suggested: ${rec.suggestedText}\n`);
      });
    }

    if (low.length > 0) {
      sections.push('### Low Priority\n');
      low.forEach((rec, i) => {
        sections.push(`${i + 1}. ${rec.method} - ${rec.location}`);
      });
    }

    return sections.join('\n');
  }
}
