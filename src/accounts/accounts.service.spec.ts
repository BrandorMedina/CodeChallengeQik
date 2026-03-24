import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AccountsService } from './accounts.service';
import { Account } from './account.entity';
import { ClientsService } from '../clients/clients.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CurrencyCode, AccountStatus } from '../common/enums';

const mockAccount: Account = {
  id: 'acc-uuid-1',
  accountNumber: '100000000001',
  balance: 1000,
  currency: CurrencyCode.DOP,
  status: AccountStatus.ACTIVE,
  client: { id: 'client-uuid-1' } as any,
  outgoingTransactions: [],
  incomingTransactions: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockClientsService = {
  findOne: jest.fn(),
};

describe('AccountsService', () => {
  let service: AccountsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        { provide: getRepositoryToken(Account), useValue: mockRepo },
        { provide: ClientsService, useValue: mockClientsService },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return accounts with client relation', async () => {
      mockRepo.find.mockResolvedValue([mockAccount]);
      const result = await service.findAll();
      expect(result).toEqual([mockAccount]);
      expect(mockRepo.find).toHaveBeenCalledWith({ relations: ['client'] });
    });
  });

  describe('findOne', () => {
    it('should return account with client relation', async () => {
      mockRepo.findOne.mockResolvedValue(mockAccount);
      const result = await service.findOne('acc-uuid-1');
      expect(result).toEqual(mockAccount);
      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'acc-uuid-1' },
        relations: ['client'],
      });
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateBalance', () => {
    it('should add amount to balance', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockAccount });
      mockRepo.save.mockResolvedValue({ ...mockAccount, balance: 1500 });
      const result = await service.updateBalance('acc-uuid-1', 500);
      expect(result.balance).toBe(1500);
    });

    it('should throw BadRequestException on insufficient funds', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockAccount, balance: 100 });
      await expect(service.updateBalance('acc-uuid-1', -500)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('create', () => {
    it('should create account linked to client', async () => {
      mockClientsService.findOne.mockResolvedValue({ id: 'client-uuid-1' });
      mockRepo.create.mockReturnValue(mockAccount);
      mockRepo.save.mockResolvedValue(mockAccount);

      const result = await service.create({
        clientId: 'client-uuid-1',
        currency: CurrencyCode.DOP,
      });

      expect(result).toEqual(mockAccount);
      expect(mockClientsService.findOne).toHaveBeenCalledWith('client-uuid-1');
    });
  });
});