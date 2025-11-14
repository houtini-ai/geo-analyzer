import { JinaContent, JinaReaderOptions, JinaSearchOptions, JinaError } from '../types/jina.types';

interface JinaReaderResponse {
  code: number;
  status: number;
  data: JinaContent;
}

interface JinaSearchResponse {
  code: number;
  status: number;
  data: JinaContent[];
}

export class JinaClient {
  private baseUrl = 'https://r.jina.ai';
  private searchUrl = 'https://s.jina.ai';
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async read(url: string, options: JinaReaderOptions = {}): Promise<JinaContent> {
    const headers: Record<string, string> = {
      'X-Return-Format': 'markdown',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    if (options.withImageCaptions) {
      headers['X-With-Generated-Alt'] = 'true';
    }

    if (options.withLinksSummary) {
      headers['X-With-Links-Summary'] = 'true';
    }

    if (options.withImagesSummary) {
      headers['X-With-Images-Summary'] = 'true';
    }

    if (options.targetSelector) {
      headers['X-Target-Selector'] = options.targetSelector;
    }

    if (options.timeout) {
      headers['X-Timeout'] = options.timeout.toString();
    }

    const response = await fetch(`${this.baseUrl}/${url}`, { headers });

    if (!response.ok) {
      throw new JinaError(
        `Jina Reader failed: ${response.status}`,
        response.status,
        url
      );
    }

    const text = await response.text();
    return {
      url,
      title: '',
      content: text,
    };
  }

  async search(query: string, options: JinaSearchOptions = {}): Promise<JinaContent[]> {
    const headers: Record<string, string> = {
      Accept: options.returnFormat === 'json' ? 'application/json' : 'text/plain',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const encodedQuery = encodeURIComponent(query);
    let url = `${this.searchUrl}/${encodedQuery}`;

    if (options.sites && options.sites.length > 0) {
      const siteParams = options.sites.map((site) => `site=${site}`).join('&');
      url += `?${siteParams}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new JinaError(
        `Jina Search failed: ${response.status}`,
        response.status,
        query
      );
    }

    if (options.returnFormat === 'json') {
      const json = (await response.json()) as JinaSearchResponse;
      return json.data;
    } else {
      const text = await response.text();
      return [
        {
          url: query,
          title: query,
          content: text,
        },
      ];
    }
  }

  async readBatch(urls: string[], options: JinaReaderOptions = {}): Promise<JinaContent[]> {
    return Promise.all(urls.map((url) => this.read(url, options)));
  }
}
