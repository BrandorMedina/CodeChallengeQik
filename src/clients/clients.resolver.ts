import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { ClientsService } from './clients.service';
import { ClientType } from './dto/client.type';
import { CreateClientInput, UpdateClientInput } from './dto/client.input';

@Resolver(() => ClientType)
export class ClientsResolver {
  constructor(private readonly clientsService: ClientsService) {}

  @Query(() => [ClientType], { name: 'clients' })
  findAll() {
    return this.clientsService.findAll();
  }

  @Query(() => ClientType, { name: 'client' })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.clientsService.findOne(id);
  }

  @Mutation(() => ClientType)
  createClient(@Args('input') input: CreateClientInput) {
    return this.clientsService.create(input);
  }

  @Mutation(() => ClientType)
  updateClient(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateClientInput,
  ) {
    return this.clientsService.update(id, input);
  }

  @Mutation(() => Boolean)
  removeClient(@Args('id', { type: () => ID }) id: string) {
    return this.clientsService.remove(id);
  }
}