import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './transaction.entity';
import { TransactionsService } from './transactions.service';
import { TransactionsResolver } from './transactions.resolver';
import { AccountsModule } from '../accounts/accounts.module';
import { ElasticsearchModule } from '../elasticsearch/elasticsearch.module';
import { CurrenciesModule } from '../currencies/currencies.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction]),
    AccountsModule,
    ElasticsearchModule,
    CurrenciesModule,
  ],
  providers: [TransactionsService, TransactionsResolver],
})
export class TransactionsModule {}