import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientsService } from './clients.service';
import { Client } from './client.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';

const mockClient: Client = {
  id: 'uuid-1',
  firstName: 'Juan',
  lastName: 'Pérez',
  email: 'juan@test.com',
  phone: '809-000-0000',
  documentId: '001-000-001',
  isActive: true,
  accounts: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

describe('ClientsService', () => {
  let service: ClientsService;
  let repo: Repository<Client>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        { provide: getRepositoryToken(Client), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
    repo = module.get<Repository<Client>>(getRepositoryToken(Client));
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return an array of clients', async () => {
      mockRepo.find.mockResolvedValue([mockClient]);
      const result = await service.findAll();
      expect(result).toEqual([mockClient]);
      expect(mockRepo.find).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a client by id', async () => {
      mockRepo.findOne.mockResolvedValue(mockClient);
      const result = await service.findOne('uuid-1');
      expect(result).toEqual(mockClient);
    });

    it('should throw NotFoundException if client not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('not-found')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create and return a new client', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.create.mockReturnValue(mockClient);
      mockRepo.save.mockResolvedValue(mockClient);

      const result = await service.create({
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan@test.com',
        documentId: '001-000-001',
      });

      expect(result).toEqual(mockClient);
      expect(mockRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException if email/documentId exists', async () => {
      mockRepo.findOne.mockResolvedValue(mockClient);
      await expect(
        service.create({
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'juan@test.com',
          documentId: '001-000-001',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should deactivate a client (soft delete)', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockClient });
      mockRepo.save.mockResolvedValue({ ...mockClient, isActive: false });
      const result = await service.remove('uuid-1');
      expect(result).toBe(true);
    });
  });
});