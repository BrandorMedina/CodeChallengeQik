import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ElasticsearchService } from './elasticsearch.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'ELASTICSEARCH_CLIENT',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const { Client } = require('@elastic/elasticsearch');
        return new Client({
          node: config.get<string>('ES_NODE', 'http://localhost:9200'),
        });
      },
    },
    ElasticsearchService,
  ],
  exports: ['ELASTICSEARCH_CLIENT', ElasticsearchService],
})
export class ElasticsearchModule {}