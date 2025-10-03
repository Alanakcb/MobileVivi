import { FindMemory } from '../../../domain/use-cases/Post/FindMemory';
import { MockMemoryRepository } from '../../../infra/repositories/MockMemoryRepository';
import { Memory } from '../../../domain/entities/Memory';

describe('FindMemory', () => {
  it('should find a memory by id', async () => {
    const repo = new MockMemoryRepository();
    const findMemory = new FindMemory(repo);

    const memory = Memory.create(
      'm1',
      'user-1',
      'https://example.com/photo.jpg',
      'Minha lembrança',
      new Date()
    );

    await repo.save(memory);

    const found = await findMemory.execute({ id: memory.id });

    expect(found).toBe(memory);
  });

  it('should return null if the memory is not found', async () => {
    const repo = new MockMemoryRepository();
    const findMemory = new FindMemory(repo);

    const found = await findMemory.execute({ id: 'not-exists' });

    expect(found).toBeNull();
  });
});
