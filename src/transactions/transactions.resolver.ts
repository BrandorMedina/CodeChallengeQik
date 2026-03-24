import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { TransactionsService } from './transactions.service';
import { TransactionType } from './dto/transaction.type';
import { DepositInput, WithdrawalInput, TransferInput } from './dto/transaction.input';
import { GraphQLJSON } from 'graphql-type-json';

@Resolver(() => TransactionType)
export class TransactionsResolver {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Query(() => [TransactionType], { name: 'transactions' })
  findAll() {
    return this.transactionsService.findAll();
  }

  @Query(() => [TransactionType], { name: 'transactionsByAccount' })
  findByAccount(@Args('accountId', { type: () => ID }) accountId: string) {
    return this.transactionsService.findByAccount(accountId);
  }

  @Query(() => [GraphQLJSON], { name: 'searchTransactions' })
  searchTransactions(@Args('query') query: string) {
    return this.transactionsService.searchTransactions(query);
  }

  @Mutation(() => TransactionType)
  deposit(@Args('input') input: DepositInput) {
    return this.transactionsService.deposit(input);
  }

  @Mutation(() => TransactionType)
  withdrawal(@Args('input') input: WithdrawalInput) {
    return this.transactionsService.withdrawal(input);
  }

  @Mutation(() => TransactionType)
  transfer(@Args('input') input: TransferInput) {
    return this.transactionsService.transfer(input);
  }
}