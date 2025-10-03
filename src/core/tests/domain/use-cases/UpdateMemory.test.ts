import { UpdateMemory } from '../../../domain/use-cases/Post/UpdateMemory';
import { MockMemoryRepository } from '../../../infra/repositories/MockMemoryRepository';
import { Memory } from '../../../domain/entities/Memory';

describe('UpdateMemory', () => {
  it('should update a memory caption', async () => {
    const repo = new MockMemoryRepository();
    const updateMemory = new UpdateMemory(repo);

    const memory = Memory.create(
      'm1',
      'user-1',
      'https://example.com/photo.jpg',
      'Legenda antiga',
      new Date()
    );

    await repo.save(memory);

    const updated = await updateMemory.execute({
      id: memory.id,
      caption: 'Legenda nova'
    });

    expect(updated.caption).toBe('Legenda nova');

    const found = await repo.findById(memory.id);
    expect(found).not.toBeNull();
    expect(found!.caption).toBe('Legenda nova');
  });

  it('should throw if memory not found', async () => {
    const repo = new MockMemoryRepository();
    const updateMemory = new UpdateMemory(repo);

    await expect(
      updateMemory.execute({ id: 'not-exists', caption: 'x' })
    ).rejects.toThrow('Memory not found');
  });
});
