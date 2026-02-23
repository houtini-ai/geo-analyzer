import { ContentFetcher } from './content-fetcher.js';
import { PatternAnalyzer } from './pattern-analyzer.js';
import { SemanticAnalyzer } from './semantic-analyzer.js';
import { ReportFormatter } from './report-formatter.js';
import { GeoAnalysis, ContentData, SemanticAnalysisResult } from '../types/geo.types.js';

export interface AnalysisOptions {
  url?: string;
  content?: string;
  query?: string;
  outputFormat?: 'detailed' | 'summary';
}

export class GeoAnalyzer {
  private contentFetcher: ContentFetcher;
  private patternAnalyzer: PatternAnalyzer;
  private semanticAnalyzer: SemanticAnalyzer | null;
  private reportFormatter: ReportFormatter;

  constructor(anthropicApiKey?: string) {
    this.contentFetcher = new ContentFetcher();
    this.patternAnalyzer = new PatternAnalyzer();
    this.semanticAnalyzer = anthropicApiKey ? new SemanticAnalyzer(anthropicApiKey) : null;
    this.reportFormatter = new ReportFormatter();
  }

  async analyze(options: AnalysisOptions): Promise<string> {
    let contentData: ContentData;

    if (options.url) {
      contentData = await this.contentFetcher.fetchContent(options.url);
    } else if (options.content) {
      contentData = {
        title: 'Pasted Content',
        content: options.content,
        html: options.content, // Use content as HTML for pasted text
        wordCount: options.content.split(/\s+/).length,
      };
    } else {
      throw new Error('Either url or content must be provided');
    }

    const query = options.query || 'general content analysis';

    const patternResult = this.patternAnalyzer.analyze(contentData.content, query, contentData.html);

    let semanticResult: SemanticAnalysisResult | null = null;
    if (this.semanticAnalyzer) {
      try {
        semanticResult = await this.semanticAnalyzer.analyze(contentData.content);
      } catch (error) {
        semanticResult = null;
      }
    }

    if (semanticResult) {
      patternResult.metrics.semanticTriples = {
        total: semanticResult.triples.length,
        density: Math.round((semanticResult.triples.length / contentData.wordCount) * 100 * 100) / 100,
        quality: semanticResult.triples.reduce((sum, t) => sum + t.confidence, 0) / Math.max(1, semanticResult.triples.length),
        examples: semanticResult.triples.slice(0, 3).map(triple => ({
          sentence: `${triple.subject} ${triple.predicate} ${triple.object}`,
          triples: [triple],
        })),
      };

      patternResult.metrics.entities = {
        total: semanticResult.entities.length,
        density: Math.round((semanticResult.entities.length / contentData.wordCount) * 100 * 100) / 100,
        diversity: semanticResult.diversity,
        genericReferences: [],
      };

      const semanticScore = Math.min(10, (semanticResult.triples.length / 10) * 10);
      patternResult.scores.extractability = Math.round(
        ((patternResult.scores.extractability + semanticScore) / 2) * 10
      ) / 10;
      patternResult.scores.overall = Math.round(
        ((patternResult.scores.extractability + patternResult.scores.readability + patternResult.scores.citability) / 3) * 10
      ) / 10;
    }

    const analysis: GeoAnalysis = {
      analyzedAt: new Date().toISOString(),
      version: '3.0.1',
      targetQuery: query,
      scores: patternResult.scores,
      metrics: patternResult.metrics,
      chunking: patternResult.chunking,
      recommendations: patternResult.recommendations,
    };

    return this.reportFormatter.formatMarkdown(analysis);
  }
}
