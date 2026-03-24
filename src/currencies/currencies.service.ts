import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Currency } from './currency.entity';
import { ExchangeRate } from './exchange-rate.entity';
import { CurrencyCode } from '../common/enums';

export interface ConversionResult {
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  originalAmount: number;
  convertedAmount: number;
  rateUsed: number;
  rateType: 'buy' | 'sell';
}

@Injectable()
export class CurrenciesService {
  constructor(
    @InjectRepository(Currency)
    private readonly currencyRepo: Repository<Currency>,
    @InjectRepository(ExchangeRate)
    private readonly exchangeRateRepo: Repository<ExchangeRate>,
  ) {}

  async findAllCurrencies(): Promise<Currency[]> {
    return this.currencyRepo.find({ where: { isActive: true } });
  }

  async findAllRates(): Promise<ExchangeRate[]> {
    return this.exchangeRateRepo.find({ where: { isActive: true } });
  }

  async getExchangeRate(
    fromCode: CurrencyCode,
    toCode: CurrencyCode,
  ): Promise<ExchangeRate> {
    const rate = await this.exchangeRateRepo.findOne({
      where: {
        fromCurrency: { code: fromCode },
        toCurrency: { code: toCode },
        isActive: true,
      },
    });

    if (!rate) {
      throw new NotFoundException(
        `No exchange rate found for ${fromCode} → ${toCode}`,
      );
    }

    return rate;
  }

  /**
   * Convierte un monto entre dos monedas.
   *
   * Lógica de compra/venta:
   * - El cliente ENVÍA moneda extranjera hacia DOP → banco COMPRA (buyRate)
   *   Ej: cliente transfiere USD → DOP, el banco compra sus USD a buyRate
   *
   * - El cliente ENVÍA DOP hacia moneda extranjera → banco VENDE (sellRate)
   *   Ej: cliente transfiere DOP → USD, el banco vende USD a sellRate
   *
   * - Entre dos monedas extranjeras → se convierte primero a DOP (buyRate)
   *   y luego de DOP a la moneda destino (sellRate)
   */
  async convert(
    amount: number,
    fromCode: CurrencyCode,
    toCode: CurrencyCode,
  ): Promise<ConversionResult> {
    if (fromCode === toCode) {
      return {
        fromCurrency: fromCode,
        toCurrency: toCode,
        originalAmount: amount,
        convertedAmount: amount,
        rateUsed: 1,
        rateType: 'sell',
      };
    }

    // Caso: moneda extranjera → DOP (banco compra la moneda extranjera)
    if (toCode === CurrencyCode.DOP) {
      const rate = await this.getExchangeRate(fromCode, toCode);
      const convertedAmount = this.round(amount * Number(rate.buyRate));
      return {
        fromCurrency: fromCode,
        toCurrency: toCode,
        originalAmount: amount,
        convertedAmount,
        rateUsed: Number(rate.buyRate),
        rateType: 'buy',
      };
    }

    // Caso: DOP → moneda extranjera (banco vende la moneda extranjera)
    if (fromCode === CurrencyCode.DOP) {
      const rate = await this.getExchangeRate(fromCode, toCode);
      const convertedAmount = this.round(amount * Number(rate.sellRate));
      return {
        fromCurrency: fromCode,
        toCurrency: toCode,
        originalAmount: amount,
        convertedAmount,
        rateUsed: Number(rate.sellRate),
        rateType: 'sell',
      };
    }

    // Caso: moneda extranjera → otra moneda extranjera (USD → EUR, etc.)
    // Primero convierte a DOP usando buyRate, luego de DOP a destino usando sellRate
    const toDop = await this.getExchangeRate(fromCode, CurrencyCode.DOP);
    const fromDop = await this.getExchangeRate(CurrencyCode.DOP, toCode);

    const amountInDop = this.round(amount * Number(toDop.buyRate));
    const convertedAmount = this.round(amountInDop * Number(fromDop.sellRate));

    // Tasa efectiva combinada
    const effectiveRate = this.round(convertedAmount / amount);

    return {
      fromCurrency: fromCode,
      toCurrency: toCode,
      originalAmount: amount,
      convertedAmount,
      rateUsed: effectiveRate,
      rateType: 'sell',
    };
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}