import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Currency } from './currency.entity';
import { ExchangeRate } from './exchange-rate.entity';
import { CurrenciesService } from './currencies.service';
import { CurrenciesResolver } from './currencies.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Currency, ExchangeRate])],
  providers: [CurrenciesService, CurrenciesResolver],
  exports: [CurrenciesService],
})
export class CurrenciesModule {}