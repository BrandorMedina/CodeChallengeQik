import { InputType, Field, Float } from '@nestjs/graphql';
import { IsEnum, IsUUID, IsPositive, IsOptional } from 'class-validator';
import { TransactionType, CurrencyCode } from '../../common/enums';

@InputType()
export class DepositInput {
  @Field()
  @IsUUID()
  accountId: string;

  @Field(() => Float)
  @IsPositive()
  amount: number;

  @Field(() => String)
  @IsEnum(CurrencyCode)
  currency: CurrencyCode;

  @Field({ nullable: true })
  @IsOptional()
  description?: string;
}

@InputType()
export class WithdrawalInput {
  @Field()
  @IsUUID()
  accountId: string;

  @Field(() => Float)
  @IsPositive()
  amount: number;

  @Field({ nullable: true })
  @IsOptional()
  description?: string;
}

@InputType()
export class TransferInput {
  @Field()
  @IsUUID()
  sourceAccountId: string;

  @Field()
  @IsUUID()
  destinationAccountId: string;

  @Field(() => Float)
  @IsPositive()
  amount: number;

  @Field({ nullable: true })
  @IsOptional()
  description?: string;
}