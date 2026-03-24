import { Resolver, Query, Args, Float } from '@nestjs/graphql';
import { CurrenciesService } from './currencies.service';
import { CurrencyType, ExchangeRateType, ConversionResultType } from './dto/currency.type';
import { CurrencyCode } from '../common/enums';

@Resolver()
export class CurrenciesResolver {
  constructor(private readonly currenciesService: CurrenciesService) {}

  @Query(() => [CurrencyType], { name: 'currencies' })
  findAll() {
    return this.currenciesService.findAllCurrencies();
  }

  @Query(() => [ExchangeRateType], { name: 'exchangeRates' })
  findAllRates() {
    return this.currenciesService.findAllRates();
  }

  @Query(() => ConversionResultType, { name: 'convertCurrency' })
  convert(
    @Args('amount', { type: () => Float }) amount: number,
    @Args('from', { type: () => String }) from: string,
    @Args('to', { type: () => String }) to: string,
  ) {
    return this.currenciesService.convert(
      amount,
      from as CurrencyCode,
      to as CurrencyCode,
    );
  }
}