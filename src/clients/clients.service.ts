import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './client.entity';
import { CreateClientInput, UpdateClientInput } from './dto/client.input';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  async findAll(): Promise<Client[]> {
    return this.clientRepository.find({ relations: ['accounts'] });
  }

  async findOne(id: string): Promise<Client> {
    const client = await this.clientRepository.findOne({
    where: { id },
    relations: ['accounts'],
    });
    if (!client) throw new NotFoundException(`Client ${id} not found`);
    return client;
  }

  async create(input: CreateClientInput): Promise<Client> {
    const existing = await this.clientRepository.findOne({
      where: [{ email: input.email }, { documentId: input.documentId }],
    });
    if (existing) throw new ConflictException('Email or documentId already exists');

    const client = this.clientRepository.create(input);
    return this.clientRepository.save(client);
  }

  async update(id: string, input: UpdateClientInput): Promise<Client> {
    const client = await this.findOne(id);
    Object.assign(client, input);
    return this.clientRepository.save(client);
  }

  async remove(id: string): Promise<boolean> {
    const client = await this.findOne(id);
    client.isActive = false;
    await this.clientRepository.save(client);
    return true;
  }
}