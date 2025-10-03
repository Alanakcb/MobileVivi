import { MockMemoryRepository } from '../../../infra/repositories/MockMemoryRepository';
import { Memory } from '../../../domain/entities/Memory';

describe('MockMemoryRepository', () => {
  it('should save and find memory by id', async () => {
    const repo = new MockMemoryRepository();
  const memory = Memory.create('1', 'user-1', 'photo-url', 'First memory', new Date());

    await repo.save(memory);
    const found = await repo.findById('1');

    expect(found).toEqual(memory);
  });

  it('should list memories by userId', async () => {
    const repo = new MockMemoryRepository();
  const memory1 = Memory.create('1', 'user-1', 'photo-a', 'Memory A', new Date());
  const memory2 = Memory.create('2', 'user-1', 'photo-b', 'Memory B', new Date());
  const memory3 = Memory.create('3', 'user-2', 'photo-c', 'Memory C', new Date());

    await repo.save(memory1);
    await repo.save(memory2);
    await repo.save(memory3);

    const memories = await repo.findByUserId('user-1');
    expect(memories).toHaveLength(2);
  });
});
