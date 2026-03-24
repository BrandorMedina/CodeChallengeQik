import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { TransactionsService } from './transactions.service';
import { Transaction } from './transaction.entity';
import { AccountsService } from '../accounts/accounts.service';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';
import { CurrenciesService } from '../currencies/currencies.service';
import { CurrencyCode, AccountStatus, TransactionType as TxType } from '../common/enums';

const mockAccount = (id: string, balance: number, currency = CurrencyCode.DOP) => ({
  id,
  accountNumber: `10000000000${id}`,
  balance,
  currency,
  status: AccountStatus.ACTIVE,
  client: { id: 'client-1' },
  outgoingTransactions: [],
  incomingTransactions: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

const mockTransaction = {
  id: 'tx-uuid-1',
  type: TxType.DEPOSIT,
  amount: 500,
  currency: CurrencyCode.DOP,
  sourceAccount: mockAccount('1', 1000),
  destinationAccount: null,
  exchangeRate: null,
  convertedAmount: null,
  rateType: null,
  destinationCurrency: null,
  createdAt: new Date(),
};

const mockRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockAccountsService = {
  findOne: jest.fn(),
  updateBalance: jest.fn(),
};

const mockCacheManager = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn(),
  del: jest.fn(),
};

const buildMockDataSource = (accounts: Record<string, any>) => ({
  transaction: jest.fn((cb) =>
    cb({
      create: jest.fn().mockReturnValue(mockTransaction),
      save: jest.fn().mockResolvedValue(mockTransaction),
      findOne: jest.fn().mockImplementation((_entity: any, opts: any) => {
        const id = opts?.where?.id;
        return Promise.resolve(accounts[id] ?? null);
      }),
      update: jest.fn().mockResolvedValue(undefined),
    }),
  ),
});

const mockEsService = {
  indexTransaction: jest.fn().mockResolvedValue(undefined),
  searchTransactions: jest.fn().mockResolvedValue([]),
};

const mockCurrenciesService = {
  convert: jest.fn(),
};

describe('TransactionsService', () => {
  let service: TransactionsService;

  beforeEach(async () => {
  let mockDataSource = buildMockDataSource({ '1': mockAccount('1', 10000) });

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      TransactionsService,
      { provide: getRepositoryToken(Transaction), useValue: mockRepo },
      { provide: AccountsService, useValue: mockAccountsService },
      { provide: ElasticsearchService, useValue: mockEsService },
      { provide: CurrenciesService, useValue: mockCurrenciesService },
      { provide: DataSource, useValue: mockDataSource },
      { provide: CACHE_MANAGER, useValue: mockCacheManager },
    ],
  }).compile();

  service = module.get<TransactionsService>(TransactionsService);
  jest.clearAllMocks();
});

  describe('findAll', () => {
    it('should return transactions from cache if available', async () => {
      mockCacheManager.get.mockResolvedValue([mockTransaction]);
      const result = await service.findAll();
      expect(result).toEqual([mockTransaction]);
      expect(mockRepo.find).not.toHaveBeenCalled();
    });

    it('should query DB and cache result on cache miss', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockRepo.find.mockResolvedValue([mockTransaction]);
      const result = await service.findAll();
      expect(result).toEqual([mockTransaction]);
      expect(mockCacheManager.set).toHaveBeenCalledTimes(1);
    });
  });

  describe('findByAccount', () => {
    it('should return transactions filtered by account from cache', async () => {
      mockCacheManager.get.mockResolvedValue([mockTransaction]);
      const result = await service.findByAccount('1');
      expect(result).toEqual([mockTransaction]);
      expect(mockRepo.find).not.toHaveBeenCalled();
    });
  });

  describe('deposit', () => {
    it('should create a deposit and invalidate cache', async () => {
      mockAccountsService.findOne.mockResolvedValue(mockAccount('1', 1000));
      mockRepo.findOne.mockResolvedValue(mockTransaction);

      const result = await service.deposit({
        accountId: '1',
        amount: 500,
        currency: CurrencyCode.DOP,
        description: 'Test deposit',
      });

      expect(result.type).toBe(TxType.DEPOSIT);
      expect(mockCacheManager.del).toHaveBeenCalledWith('transactions:all');
      expect(mockEsService.indexTransaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('withdrawal', () => {
    it('should create a withdrawal and invalidate cache', async () => {
      mockAccountsService.findOne.mockResolvedValue(mockAccount('1', 1000));
      mockRepo.findOne.mockResolvedValue({ ...mockTransaction, type: TxType.WITHDRAWAL });

      const result = await service.withdrawal({
        accountId: '1',
        amount: 300,
        description: 'Test withdrawal',
      });

      expect(result.type).toBe(TxType.WITHDRAWAL);
      expect(mockCacheManager.del).toHaveBeenCalledWith('transactions:all');
    });
  });

  describe('transfer', () => {
  it('should transfer between same currency accounts without conversion', async () => {
    const acc1 = mockAccount('1', 1000, CurrencyCode.DOP);
    const acc2 = mockAccount('2', 500, CurrencyCode.DOP);

    mockAccountsService.findOne
      .mockResolvedValueOnce(acc1)
      .mockResolvedValueOnce(acc2);

    // Reconstruye el dataSource con las cuentas correctas
    const ds = buildMockDataSource({ '1': acc1, '2': acc2 });
    (service as any).dataSource = ds;

    mockRepo.findOne.mockResolvedValue({ ...mockTransaction, type: TxType.TRANSFER });

    const result = await service.transfer({
      sourceAccountId: '1',
      destinationAccountId: '2',
      amount: 200,
      description: 'Test transfer',
    });

    expect(result.type).toBe(TxType.TRANSFER);
    expect(mockCurrenciesService.convert).not.toHaveBeenCalled();
  });

  it('should apply currency conversion on cross-currency transfer', async () => {
    const acc1 = mockAccount('1', 5900, CurrencyCode.DOP);
    const acc2 = mockAccount('2', 0, CurrencyCode.USD);

    mockAccountsService.findOne
      .mockResolvedValueOnce(acc1)
      .mockResolvedValueOnce(acc2);

    const ds = buildMockDataSource({ '1': acc1, '2': acc2 });
    (service as any).dataSource = ds;

    mockCurrenciesService.convert.mockResolvedValue({
      fromCurrency: CurrencyCode.DOP,
      toCurrency: CurrencyCode.USD,
      originalAmount: 5900,
      convertedAmount: 102.66,
      rateUsed: 0.01740,
      rateType: 'sell',
    });

    mockRepo.findOne.mockResolvedValue({
      ...mockTransaction,
      type: TxType.TRANSFER,
      exchangeRate: 0.01740,
      convertedAmount: 102.66,
      rateType: 'sell',
      destinationCurrency: CurrencyCode.USD,
    });

    const result = await service.transfer({
      sourceAccountId: '1',
      destinationAccountId: '2',
      amount: 5900,
      description: 'DOP to USD transfer',
    });

    expect(mockCurrenciesService.convert).toHaveBeenCalledWith(
      5900,
      CurrencyCode.DOP,
      CurrencyCode.USD,
    );
    expect(result.convertedAmount).toBe(102.66);
    expect(result.rateType).toBe('sell');
  });
});

  describe('searchTransactions', () => {
    it('should delegate search to ElasticsearchService', async () => {
      mockEsService.searchTransactions.mockResolvedValue([{ id: 'tx-1', type: 'TRANSFER' }]);
      const result = await service.searchTransactions('TRANSFER');
      expect(result).toHaveLength(1);
      expect(mockEsService.searchTransactions).toHaveBeenCalledWith('TRANSFER');
    });
  });
});