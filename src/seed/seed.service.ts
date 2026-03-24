import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Client } from '../clients/client.entity';
import { Account } from '../accounts/account.entity';
import { Currency } from '../currencies/currency.entity';
import { ExchangeRate } from '../currencies/exchange-rate.entity';
import { Transaction } from '../transactions/transaction.entity';
import { CurrencyCode, AccountStatus, TransactionType } from '../common/enums';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Client) private readonly clientRepo: Repository<Client>,
    @InjectRepository(Account) private readonly accountRepo: Repository<Account>,
    @InjectRepository(Currency) private readonly currencyRepo: Repository<Currency>,
    @InjectRepository(ExchangeRate) private readonly exchangeRateRepo: Repository<ExchangeRate>,
    @InjectRepository(Transaction) private readonly transactionRepo: Repository<Transaction>,
    private readonly elasticsearchService: ElasticsearchService,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (this.configService.get('NODE_ENV') === 'test') return;
    await this.run();
  }

  async run(): Promise<void> {
    const existing = await this.currencyRepo.count();
    if (existing > 0) {
      this.logger.log('Seed already applied, skipping.');
      return;
    }

    this.logger.log('Running seed...');
    await this.elasticsearchService.ensureIndex();

    // --- Currencies ---
    const dop = this.currencyRepo.create({ code: CurrencyCode.DOP, name: 'Peso Dominicano', symbol: 'RD$' });
    const usd = this.currencyRepo.create({ code: CurrencyCode.USD, name: 'US Dollar', symbol: '$' });
    const eur = this.currencyRepo.create({ code: CurrencyCode.EUR, name: 'Euro', symbol: '€' });
    await this.currencyRepo.save([dop, usd, eur]);


    const rates = [
      // USD ↔ DOP
      { fromCurrency: usd, toCurrency: dop, buyRate: 57.50,  sellRate: 59.00 },
      { fromCurrency: dop, toCurrency: usd, buyRate: 0.01695, sellRate: 0.01740 },

      // EUR ↔ DOP
      { fromCurrency: eur, toCurrency: dop, buyRate: 61.50,  sellRate: 63.50 },
      { fromCurrency: dop, toCurrency: eur, buyRate: 0.01575, sellRate: 0.01626 },

      // USD ↔ EUR
      { fromCurrency: usd, toCurrency: eur, buyRate: 0.905, sellRate: 0.925 },
      { fromCurrency: eur, toCurrency: usd, buyRate: 1.075, sellRate: 1.095 },
    ];
    const exchangeRates = this.exchangeRateRepo.create(rates);
    await this.exchangeRateRepo.save(exchangeRates);

    // --- Clients ---
    const clients = this.clientRepo.create([
      {
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan.perez@email.com',
        phone: '809-555-0001',
        documentId: '001-1234567-8',
      },
      {
        firstName: 'María',
        lastName: 'García',
        email: 'maria.garcia@email.com',
        phone: '809-555-0002',
        documentId: '001-7654321-9',
      },
      {
        firstName: 'Carlos',
        lastName: 'Rodríguez',
        email: 'carlos.rodriguez@email.com',
        phone: '809-555-0003',
        documentId: '001-1111111-1',
      },
    ]);
    const [juan, maria, carlos] = await this.clientRepo.save(clients);

    // --- Accounts ---
    const accounts = this.accountRepo.create([
      { accountNumber: '100000000001', balance: 50000, currency: CurrencyCode.DOP, status: AccountStatus.ACTIVE, client: juan },
      { accountNumber: '100000000002', balance: 1500, currency: CurrencyCode.USD, status: AccountStatus.ACTIVE, client: juan },
      { accountNumber: '100000000003', balance: 75000, currency: CurrencyCode.DOP, status: AccountStatus.ACTIVE, client: maria },
      { accountNumber: '100000000004', balance: 800, currency: CurrencyCode.EUR, status: AccountStatus.ACTIVE, client: maria },
      { accountNumber: '100000000005', balance: 25000, currency: CurrencyCode.DOP, status: AccountStatus.ACTIVE, client: carlos },
    ]);
    const [acc1, acc2, acc3, acc4, acc5] = await this.accountRepo.save(accounts);

    // --- Transactions ---
    const transactions = this.transactionRepo.create([
      {
        type: TransactionType.DEPOSIT,
        amount: 50000,
        currency: CurrencyCode.DOP,
        sourceAccount: acc1,
        description: 'Depósito inicial DOP',
      },
      {
        type: TransactionType.DEPOSIT,
        amount: 1500,
        currency: CurrencyCode.USD,
        sourceAccount: acc2,
        description: 'Depósito inicial USD',
      },
      {
        type: TransactionType.TRANSFER,
        amount: 5000,
        currency: CurrencyCode.DOP,
        sourceAccount: acc1,
        destinationAccount: acc3,
        description: 'Transferencia Juan → María',
      },
      {
        type: TransactionType.WITHDRAWAL,
        amount: 200,
        currency: CurrencyCode.EUR,
        sourceAccount: acc4,
        description: 'Retiro EUR',
      },
    ]);
    const savedTxs = await this.transactionRepo.save(transactions);

    // Index in ElasticSearch
    for (const tx of savedTxs) {
      await this.elasticsearchService.indexTransaction({
        id: tx.id,
        type: tx.type,
        amount: Number(tx.amount),
        currency: tx.currency,
        description: tx.description,
        sourceAccountId: tx.sourceAccount.id,
        destinationAccountId: tx.destinationAccount?.id,
        createdAt: tx.createdAt,
      });
    }

    this.logger.log('Seed completed successfully ✓');
  }
}