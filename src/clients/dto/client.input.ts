import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsOptional, Length } from 'class-validator';

@InputType()
export class CreateClientInput {
  @Field()
  @IsNotEmpty()
  @Length(1, 100)
  firstName: string;

  @Field()
  @IsNotEmpty()
  @Length(1, 100)
  lastName: string;

  @Field()
  @IsEmail()
  email: string;

  @Field({ nullable: true })
  @IsOptional()
  @Length(1, 20)
  phone?: string;

  @Field()
  @IsNotEmpty()
  @Length(1, 50)
  documentId: string;
}

@InputType()
export class UpdateClientInput {
  @Field({ nullable: true })
  @IsOptional()
  @Length(1, 100)
  firstName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @Length(1, 100)
  lastName?: string;

  @Field({ nullable: true })
  @IsOptional()
  phone?: string;
}