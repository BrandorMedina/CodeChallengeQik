import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Currency } from './currency.entity';

@Entity('exchange_rates')
export class ExchangeRate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Currency, (currency) => currency.exchangeRatesFrom, { eager: true })
  @JoinColumn({ name: 'from_currency_id' })
  fromCurrency: Currency;

  @ManyToOne(() => Currency, (currency) => currency.exchangeRatesTo, { eager: true })
  @JoinColumn({ name: 'to_currency_id' })
  toCurrency: Currency;

  // Precio al que el banco COMPRA la moneda extranjera (cliente vende)
  // Ej: banco compra 1 USD a 57.50 DOP
  @Column({ name: 'buy_rate', type: 'decimal', precision: 18, scale: 6 })
  buyRate: number;

  // Precio al que el banco VENDE la moneda extranjera (cliente compra)
  // Ej: banco vende 1 USD a 59.00 DOP
  @Column({ name: 'sell_rate', type: 'decimal', precision: 18, scale: 6 })
  sellRate: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}