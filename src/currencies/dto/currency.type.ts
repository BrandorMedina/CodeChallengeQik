import { ObjectType, Field, ID, Float } from '@nestjs/graphql';

@ObjectType()
export class CurrencyType {
  @Field(() => ID)
  id: string;

  @Field()
  code: string;

  @Field()
  name: string;

  @Field()
  symbol: string;
}

@ObjectType()
export class ExchangeRateType {
  @Field(() => ID)
  id: string;

  @Field(() => CurrencyType)
  fromCurrency: CurrencyType;

  @Field(() => CurrencyType)
  toCurrency: CurrencyType;

  @Field(() => Float)
  buyRate: number;

  @Field(() => Float)
  sellRate: number;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class ConversionResultType {
  @Field()
  fromCurrency: string;

  @Field()
  toCurrency: string;

  @Field(() => Float)
  originalAmount: number;

  @Field(() => Float)
  convertedAmount: number;

  @Field(() => Float)
  rateUsed: number;

  @Field()
  rateType: string;
}