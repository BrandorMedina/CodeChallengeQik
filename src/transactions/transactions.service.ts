import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Transaction } from './transaction.entity';
import { Account } from '../accounts/account.entity';
import { AccountsService } from '../accounts/accounts.service';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';
import { CurrenciesService } from '../currencies/currencies.service';
import { DepositInput, WithdrawalInput, TransferInput } from './dto/transaction.input';
import { TransactionType as TxType } from '../common/enums';

const CACHE_TTL = 60_000;

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: any,
    private readonly accountsService: AccountsService,
    private readonly elasticsearchService: ElasticsearchService,
    private readonly currenciesService: CurrenciesService,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(): Promise<Transaction[]> {
    const cacheKey = 'transactions:all';
    const cached = (await this.cacheManager.get(cacheKey)) as Transaction[] | null;
    if (cached) return cached;

    const transactions = await this.transactionRepository.find({
      relations: ['sourceAccount', 'destinationAccount'],
      order: { createdAt: 'DESC' },
    });

    await this.cacheManager.set(cacheKey, transactions, CACHE_TTL);
    return transactions;
  }

  async findByAccount(accountId: string): Promise<Transaction[]> {
    const cacheKey = `transactions:account:${accountId}`;
    const cached = (await this.cacheManager.get(cacheKey)) as Transaction[] | null;
    if (cached) return cached;

    const transactions = await this.transactionRepository.find({
      where: [
        { sourceAccount: { id: accountId } },
        { destinationAccount: { id: accountId } },
      ],
      relations: ['sourceAccount', 'destinationAccount'],
      order: { createdAt: 'DESC' },
    });

    await this.cacheManager.set(cacheKey, transactions, CACHE_TTL);
    return transactions;
  }

  async searchTransactions(query: string): Promise<any[]> {
    return this.elasticsearchService.searchTransactions(query);
  }

  async deposit(input: DepositInput): Promise<Transaction> {
    const account = await this.accountsService.findOne(input.accountId);

    const tx = await this.dataSource.transaction(async (manager: EntityManager) => {
      await this.applyBalanceDelta(manager, account.id, input.amount);
      return manager.save(
        manager.create(Transaction, {
          type: TxType.DEPOSIT,
          amount: input.amount,
          currency: input.currency,
          sourceAccount: { id: account.id },
          description: input.description,
        }),
      );
    });

    const fullTx = await this.transactionRepository.findOne({
      where: { id: tx.id },
      relations: ['sourceAccount', 'destinationAccount'],
    });

    await this.invalidateCache(account.id);
    await this.indexTransaction(fullTx!, account.id);
    return fullTx!;
  }

  async withdrawal(input: WithdrawalInput): Promise<Transaction> {
    const account = await this.accountsService.findOne(input.accountId);

    const tx = await this.dataSource.transaction(async (manager: EntityManager) => {
      await this.applyBalanceDelta(manager, account.id, -input.amount);
      return manager.save(
        manager.create(Transaction, {
          type: TxType.WITHDRAWAL,
          amount: input.amount,
          currency: account.currency,
          sourceAccount: { id: account.id },
          description: input.description,
        } as Partial<Transaction>),
      );
    });

    const fullTx = await this.transactionRepository.findOne({
      where: { id: tx.id },
      relations: ['sourceAccount', 'destinationAccount'],
    });

    await this.invalidateCache(account.id);
    await this.indexTransaction(fullTx!, account.id);
    return fullTx!;
  }

  async transfer(input: TransferInput): Promise<Transaction> {
    const source = await this.accountsService.findOne(input.sourceAccountId);
    const destination = await this.accountsService.findOne(input.destinationAccountId);

    const sameCurrency = source.currency === destination.currency;

    // Si las monedas son distintas, calculamos la conversión ANTES de abrir la transacción DB
    const conversion = sameCurrency
      ? null
      : await this.currenciesService.convert(
          input.amount,
          source.currency,
          destination.currency,
        );

    // Monto que se descuenta de la cuenta origen (siempre el monto original)
    const debitAmount = input.amount;

    // Monto que se acredita en la cuenta destino
    // Si hay conversión, se acredita el monto ya convertido
    const creditAmount = conversion ? conversion.convertedAmount : input.amount;

    const tx = await this.dataSource.transaction(async (manager: EntityManager) => {
      // Debitamos en la moneda de origen
      await this.applyBalanceDelta(manager, source.id, -debitAmount);

      // Acreditamos en la moneda de destino (puede ser diferente)
      await this.applyBalanceDelta(manager, destination.id, creditAmount);

      return manager.save(
        manager.create(Transaction, {
          type: TxType.TRANSFER,
          amount: input.amount,
          currency: source.currency,
          sourceAccount: { id: source.id },
          destinationAccount: { id: destination.id },
          description: input.description,
          exchangeRate: conversion?.rateUsed ?? null,
          convertedAmount: conversion?.convertedAmount ?? null,
          rateType: conversion?.rateType ?? null,
          destinationCurrency: conversion ? destination.currency : null,
        } as Partial<Transaction>),
      );
    });

    const fullTx = await this.transactionRepository.findOne({
      where: { id: tx.id },
      relations: ['sourceAccount', 'destinationAccount'],
    });

    await this.invalidateCache(source.id);
    await this.invalidateCache(destination.id);
    await this.indexTransaction(fullTx!, source.id, destination.id);
    return fullTx!;
  }

  private async applyBalanceDelta(
    manager: EntityManager,
    accountId: string,
    delta: number,
  ): Promise<void> {
    const account = await manager.findOne(Account, { where: { id: accountId } });
    if (!account) throw new BadRequestException(`Account ${accountId} not found`);

    const newBalance = Number(account.balance) + delta;
    if (newBalance < 0) throw new BadRequestException('Insufficient funds');

    await manager.update(Account, accountId, { balance: newBalance });
  }

  private async invalidateCache(...accountIds: string[]): Promise<void> {
    await this.cacheManager.del('transactions:all');
    for (const id of accountIds) {
      await this.cacheManager.del(`transactions:account:${id}`);
    }
  }

  private async indexTransaction(
    tx: Transaction,
    sourceAccountId: string,
    destinationAccountId?: string,
  ): Promise<void> {
    await this.elasticsearchService.indexTransaction({
      id: tx.id,
      type: tx.type,
      amount: Number(tx.amount),
      currency: tx.currency,
      description: tx.description,
      sourceAccountId,
      destinationAccountId,
      createdAt: tx.createdAt,
    });
  }
}