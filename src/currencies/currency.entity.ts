import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { CurrencyCode } from '../common/enums';
import { ExchangeRate } from './exchange-rate.entity';

@Entity('currencies')
export class Currency {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: CurrencyCode, unique: true })
  code: CurrencyCode;

  @Column({ length: 50 })
  name: string;

  @Column({ length: 5 })
  symbol: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => ExchangeRate, (rate) => rate.fromCurrency)
  exchangeRatesFrom: ExchangeRate[];

  @OneToMany(() => ExchangeRate, (rate) => rate.toCurrency)
  exchangeRatesTo: ExchangeRate[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}