import { DeleteMemory } from '../../../domain/use-cases/Post/DeleteMemory';
import { MockMemoryRepository } from '../../../infra/repositories/MockMemoryRepository';
import { Memory } from '../../../domain/entities/Memory';

describe('DeleteMemory', () => {
  it('should delete a memory', async () => {
    const repo = new MockMemoryRepository();
    const deleteMemory = new DeleteMemory(repo);

    const memory = Memory.create(
      'm1',
      'user-1',
      'https://example.com/photo.jpg',
      'Legenda',
      new Date()
    );

    await repo.save(memory);

    await deleteMemory.execute({ id: memory.id });

    const found = await repo.findById(memory.id);
    expect(found).toBeNull();
  });

  it('should throw if memory not found', async () => {
    const repo = new MockMemoryRepository();
    const deleteMemory = new DeleteMemory(repo);

    await expect(deleteMemory.execute({ id: 'not-exists' })).rejects.toThrow('Memory not found');
  });
});
