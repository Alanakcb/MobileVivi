import { IMemoryRepository } from '../domain/repositories/IMemoryRepository';
import { CreateMemory } from '../domain/use-cases/Post/CreateMemory';
import { UpdateMemory } from '../domain/use-cases/Post/UpdateMemory';
import { DeleteMemory } from '../domain/use-cases/Post/DeleteMemory';
import { FindMemory } from '../domain/use-cases/Post/FindMemory';
import { ListUserMemories } from '../domain/use-cases/Post/ListUserMemories';
import { MockMemoryRepository } from '../infra/repositories/MockMemoryRepository';

export function makeMemoryUseCases() {
  const memoryRepository: IMemoryRepository = new MockMemoryRepository();

  const createMemory = new CreateMemory(memoryRepository);
  const updateMemory = new UpdateMemory(memoryRepository);
  const deleteMemory = new DeleteMemory(memoryRepository);
  const findMemory = new FindMemory(memoryRepository);
  const listUserMemories = new ListUserMemories(memoryRepository);

  return {
    createMemory,
    updateMemory,
    deleteMemory,
    findMemory,
    listUserMemories,
  };
}
