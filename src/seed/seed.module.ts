import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { Client } from '../clients/client.entity';
import { Account } from '../accounts/account.entity';
import { Currency } from '../currencies/currency.entity';
import { ExchangeRate } from '../currencies/exchange-rate.entity';
import { Transaction } from '../transactions/transaction.entity';
import { ElasticsearchModule } from '../elasticsearch/elasticsearch.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Client, Account, Currency, ExchangeRate, Transaction]),
    ElasticsearchModule,
  ],
  providers: [SeedService],
})
export class SeedModule {}