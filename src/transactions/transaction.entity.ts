import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Account } from '../accounts/account.entity';
import { TransactionType, CurrencyCode } from '../common/enums';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: CurrencyCode })
  currency: CurrencyCode;

  @ManyToOne(() => Account, (account) => account.outgoingTransactions, { nullable: false })
  @JoinColumn({ name: 'source_account_id' })
  sourceAccount: Account;

  @ManyToOne(() => Account, (account) => account.incomingTransactions, { nullable: true })
  @JoinColumn({ name: 'destination_account_id' })
  destinationAccount: Account;

  @Column({ name: 'exchange_rate', type: 'decimal', precision: 18, scale: 6, nullable: true })
  exchangeRate: number;

  // Monto ya convertido en la moneda destino
  @Column({ name: 'converted_amount', type: 'decimal', precision: 18, scale: 2, nullable: true })
  convertedAmount: number;

  // 'buy' | 'sell' — qué tipo de tasa se aplicó
  @Column({ name: 'rate_type', length: 10, nullable: true })
  rateType: string;

  // Moneda de destino cuando hay conversión
  @Column({ name: 'destination_currency', type: 'enum', enum: CurrencyCode, nullable: true })
  destinationCurrency: CurrencyCode;

  @Column({ length: 255, nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}