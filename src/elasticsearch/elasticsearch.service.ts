import { Injectable, Inject, Logger } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';

@Injectable()
export class ElasticsearchService {
  private readonly logger = new Logger(ElasticsearchService.name);
  private readonly INDEX = 'transactions';

  constructor(@Inject('ELASTICSEARCH_CLIENT') private readonly client: Client) {}

  async ping(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }

  async ensureIndex(): Promise<void> {
    const exists = await this.client.indices.exists({ index: this.INDEX });
    if (!exists) {
      await this.client.indices.create({
        index: this.INDEX,
        mappings: {
          properties: {
            id: { type: 'keyword' },
            type: { type: 'keyword' },
            amount: { type: 'double' },
            currency: { type: 'keyword' },
            description: { type: 'text' },
            sourceAccountId: { type: 'keyword' },
            destinationAccountId: { type: 'keyword' },
            createdAt: { type: 'date' },
          },
        },
      });
      this.logger.log(`Index "${this.INDEX}" created`);
    }
  }

  async indexTransaction(transaction: {
    id: string;
    type: string;
    amount: number;
    currency: string;
    description?: string;
    sourceAccountId: string;
    destinationAccountId?: string;
    createdAt: Date;
  }): Promise<void> {
    await this.client.index({
      index: this.INDEX,
      id: transaction.id,
      document: transaction,
    });
  }

  async searchTransactions(query: string): Promise<any[]> {
    const result = await this.client.search({
      index: this.INDEX,
      query: {
        multi_match: {
          query,
          fields: ['type', 'currency', 'description'],
        },
      },
    });
    return result.hits.hits.map((hit) => hit._source);
  }

  async searchByAccountId(accountId: string): Promise<any[]> {
    const result = await this.client.search({
      index: this.INDEX,
      query: {
        bool: {
          should: [
            { term: { sourceAccountId: accountId } },
            { term: { destinationAccountId: accountId } },
          ],
        },
      },
    });
    return result.hits.hits.map((hit) => hit._source);
  }
}