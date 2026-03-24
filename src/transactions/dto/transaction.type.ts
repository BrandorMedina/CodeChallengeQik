import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { AccountType } from '../../accounts/dto/account.type';

@ObjectType()
export class TransactionType {
  @Field(() => ID)
  id: string;

  @Field()
  type: string;

  @Field(() => Float)
  amount: number;

  @Field()
  currency: string;

  @Field(() => AccountType)
  sourceAccount: AccountType;

  @Field(() => AccountType, { nullable: true })
  destinationAccount?: AccountType;

  @Field(() => Float, { nullable: true })
  exchangeRate?: number;

  @Field(() => Float, { nullable: true })
  convertedAmount?: number;

  // Indica si se usó tasa de compra o venta
  @Field({ nullable: true })
  rateType?: string;

  // Moneda en la que se recibió el monto en la cuenta destino
  @Field({ nullable: true })
  destinationCurrency?: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  createdAt: Date;
}