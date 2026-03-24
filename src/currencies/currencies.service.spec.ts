import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { CurrenciesService } from './currencies.service';
import { Currency } from './currency.entity';
import { ExchangeRate } from './exchange-rate.entity';
import { CurrencyCode } from '../common/enums';

const mockDop: Currency = {
  id: 'cur-dop',
  code: CurrencyCode.DOP,
  name: 'Peso Dominicano',
  symbol: 'RD$',
  isActive: true,
  exchangeRatesFrom: [],
  exchangeRatesTo: [],
  createdAt: new Date(),
};

const mockUsd: Currency = {
  id: 'cur-usd',
  code: CurrencyCode.USD,
  name: 'US Dollar',
  symbol: '$',
  isActive: true,
  exchangeRatesFrom: [],
  exchangeRatesTo: [],
  createdAt: new Date(),
};

const mockEur: Currency = {
  id: 'cur-eur',
  code: CurrencyCode.EUR,
  name: 'Euro',
  symbol: '€',
  isActive: true,
  exchangeRatesFrom: [],
  exchangeRatesTo: [],
  createdAt: new Date(),
};

// DOP → USD (banco vende USD, cliente compra USD con DOP)
const mockRateDopToUsd: ExchangeRate = {
  id: 'rate-dop-usd',
  fromCurrency: mockDop,
  toCurrency: mockUsd,
  buyRate: 0.01695,
  sellRate: 0.01740,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// USD → DOP (banco compra USD, cliente vende USD por DOP)
const mockRateUsdToDop: ExchangeRate = {
  id: 'rate-usd-dop',
  fromCurrency: mockUsd,
  toCurrency: mockDop,
  buyRate: 57.50,
  sellRate: 59.00,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// EUR → DOP
const mockRateEurToDop: ExchangeRate = {
  id: 'rate-eur-dop',
  fromCurrency: mockEur,
  toCurrency: mockDop,
  buyRate: 61.50,
  sellRate: 63.50,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// DOP → EUR
const mockRateDopToEur: ExchangeRate = {
  id: 'rate-dop-eur',
  fromCurrency: mockDop,
  toCurrency: mockEur,
  buyRate: 0.01575,
  sellRate: 0.01626,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockCurrencyRepo = {
  find: jest.fn(),
};

const mockExchangeRateRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
};

describe('CurrenciesService', () => {
  let service: CurrenciesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurrenciesService,
        { provide: getRepositoryToken(Currency), useValue: mockCurrencyRepo },
        { provide: getRepositoryToken(ExchangeRate), useValue: mockExchangeRateRepo },
      ],
    }).compile();

    service = module.get<CurrenciesService>(CurrenciesService);
    jest.clearAllMocks();
  });

  describe('findAllCurrencies', () => {
    it('should return active currencies', async () => {
      mockCurrencyRepo.find.mockResolvedValue([mockDop, mockUsd, mockEur]);
      const result = await service.findAllCurrencies();
      expect(result).toHaveLength(3);
    });
  });

  describe('getExchangeRate', () => {
    it('should return exchange rate between two currencies', async () => {
      mockExchangeRateRepo.findOne.mockResolvedValue(mockRateDopToUsd);
      const result = await service.getExchangeRate(CurrencyCode.DOP, CurrencyCode.USD);
      expect(result.sellRate).toBe(0.01740);
    });

    it('should throw NotFoundException if rate not found', async () => {
      mockExchangeRateRepo.findOne.mockResolvedValue(null);
      await expect(
        service.getExchangeRate(CurrencyCode.DOP, CurrencyCode.USD),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('convert', () => {
    it('should return same amount when currencies are equal', async () => {
      const result = await service.convert(100, CurrencyCode.DOP, CurrencyCode.DOP);
      expect(result.convertedAmount).toBe(100);
      expect(result.rateUsed).toBe(1);
    });

    it('should use sellRate when converting DOP → USD (banco vende USD)', async () => {
      mockExchangeRateRepo.findOne.mockResolvedValue(mockRateDopToUsd);
      const result = await service.convert(5900, CurrencyCode.DOP, CurrencyCode.USD);
      // 5900 * 0.01740 = 102.66
      expect(result.convertedAmount).toBe(102.66);
      expect(result.rateType).toBe('sell');
      expect(result.rateUsed).toBe(0.0174);
    });

    it('should use buyRate when converting USD → DOP (banco compra USD)', async () => {
      mockExchangeRateRepo.findOne.mockResolvedValue(mockRateUsdToDop);
      const result = await service.convert(100, CurrencyCode.USD, CurrencyCode.DOP);
      // 100 * 57.50 = 5750
      expect(result.convertedAmount).toBe(5750);
      expect(result.rateType).toBe('buy');
    });

    it('should convert EUR → USD via DOP (cross currency)', async () => {
      // EUR → DOP (buyRate) → USD (sellRate)
      mockExchangeRateRepo.findOne
        .mockResolvedValueOnce(mockRateEurToDop)   // EUR → DOP
        .mockResolvedValueOnce(mockRateDopToUsd);  // DOP → USD
      const result = await service.convert(100, CurrencyCode.EUR, CurrencyCode.USD);
      // 100 EUR * 61.50 (buyRate EUR→DOP) = 6150 DOP
      // 6150 DOP * 0.01740 (sellRate DOP→USD) = 107.01 USD
      expect(result.convertedAmount).toBe(107.01);
      expect(result.fromCurrency).toBe(CurrencyCode.EUR);
      expect(result.toCurrency).toBe(CurrencyCode.USD);
    });
  });
});