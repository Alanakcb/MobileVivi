import { CreateMemory } from '../../../domain/use-cases/Post/CreateMemory';
import { MockMemoryRepository } from '../../../infra/repositories/MockMemoryRepository';

describe('CreateMemory', () => {
  it('should create and save a new memory', async () => {
    const repo = new MockMemoryRepository();
    const useCase = new CreateMemory(repo);

    const memory = await useCase.execute({
      userId: 'user-1',
      photo: 'photo-url',
      caption: 'My first memory'
    });

    const found = await repo.findById(memory.id);
    expect(found).toEqual(memory);
  });
});
