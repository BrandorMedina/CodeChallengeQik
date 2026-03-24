import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { AccountsService } from './accounts.service';
import { AccountType } from './dto/account.type';
import { CreateAccountInput } from './dto/account.input';

@Resolver(() => AccountType)
export class AccountsResolver {
  constructor(private readonly accountsService: AccountsService) {}

  @Query(() => [AccountType], { name: 'accounts' })
  findAll() {
    return this.accountsService.findAll();
  }

  @Query(() => AccountType, { name: 'account' })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.accountsService.findOne(id);
  }

  @Query(() => [AccountType], { name: 'accountsByClient' })
  findByClient(@Args('clientId', { type: () => ID }) clientId: string) {
    return this.accountsService.findByClient(clientId);
  }

  @Mutation(() => AccountType)
  createAccount(@Args('input') input: CreateAccountInput) {
    return this.accountsService.create(input);
  }
}