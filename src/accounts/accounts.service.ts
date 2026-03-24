import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './account.entity';
import { ClientsService } from '../clients/clients.service';
import { CreateAccountInput } from './dto/account.input';
import { AccountStatus } from '../common/enums';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    private readonly clientsService: ClientsService,
  ) {}

  private generateAccountNumber(): string {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${timestamp}${random}`;
  }

  async findAll(): Promise<Account[]> {
    return this.accountRepository.find({ relations: ['client'] });
  }

  async findOne(id: string): Promise<Account> {
    const account = await this.accountRepository.findOne({
      where: { id },
      relations: ['client'],
    });
    if (!account) throw new NotFoundException(`Account ${id} not found`);
    return account;
  }

  async findByClient(clientId: string): Promise<Account[]> {
    return this.accountRepository.find({
      where: { client: { id: clientId } },
      relations: ['client'],
    });
  }

  async create(input: CreateAccountInput): Promise<Account> {
    const client = await this.clientsService.findOne(input.clientId);
    const account = this.accountRepository.create({
      accountNumber: this.generateAccountNumber(),
      currency: input.currency,
      balance: 0,
      status: AccountStatus.ACTIVE,
      client,
    });
    return this.accountRepository.save(account);
  }

  async updateBalance(id: string, amount: number): Promise<Account> {
    const account = await this.findOne(id);
    if (account.balance + amount < 0) {
      throw new BadRequestException('Insufficient funds');
    }
    account.balance = Number(account.balance) + amount;
    return this.accountRepository.save(account);
  }
}