import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class EmbeddingsService {
  private openai: OpenAI;
  private readonly logger = new Logger(EmbeddingsService.name);
  private readonly model = 'text-embedding-3-small';
  private readonly dimensions = 1536;

  constructor(private config: ConfigService) {
    this.openai = new OpenAI({
      apiKey: config.get('OPENAI_API_KEY'),
    });
  }

  async embed(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: this.model,
      input: text.slice(0, 8000),
      dimensions: this.dimensions,
    });
    return response.data[0].embedding;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const chunks = [];
    const batchSize = 100;
    for (let i = 0; i < texts.length; i += batchSize) {
      chunks.push(texts.slice(i, i + batchSize));
    }
    const results: number[][] = [];
    for (const batch of chunks) {
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: batch.map((t) => t.slice(0, 8000)),
        dimensions: this.dimensions,
      });
      results.push(...response.data.map((d) => d.embedding));
    }
    return results;
  }

  chunkText(text: string, chunkSize = 1000, overlap = 200): string[] {
    const chunks: string[] = [];
    let start = 0;
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      chunks.push(text.slice(start, end).trim());
      start += chunkSize - overlap;
    }
    return chunks.filter((c) => c.length > 50);
  }
}
