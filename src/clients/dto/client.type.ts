import { ObjectType, Field, ID } from '@nestjs/graphql';
import { AccountType } from '../../accounts/dto/account.type';

@ObjectType()
export class ClientType {
  @Field(() => ID)
  id: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  phone?: string;

  @Field()
  documentId: string;

  @Field()
  isActive: boolean;

  @Field(() => [AccountType], { nullable: true })
  accounts?: AccountType[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}