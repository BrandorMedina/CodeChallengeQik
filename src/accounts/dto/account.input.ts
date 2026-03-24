import { InputType, Field } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { CurrencyCode } from '../../common/enums';

@InputType()
export class CreateAccountInput {
  @Field()
  @IsUUID()
  clientId: string;

  @Field(() => String)
  @IsEnum(CurrencyCode)
  currency: CurrencyCode;
}