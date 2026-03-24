import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { ClientType } from '../../clients/dto/client.type';

@ObjectType()
export class AccountType {
  @Field(() => ID)
  id: string;

  @Field()
  accountNumber: string;

  @Field(() => Float)
  balance: number;

  @Field()
  currency: string;

  @Field()
  status: string;

  @Field(() => ClientType, { nullable: true })
  client?: ClientType;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}