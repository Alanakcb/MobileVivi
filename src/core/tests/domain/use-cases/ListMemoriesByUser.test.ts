import { ListUserMemories } from '../../../domain/use-cases/Post/ListUserMemories';
import { MockMemoryRepository } from '../../../infra/repositories/MockMemoryRepository';
import { Memory } from '../../../domain/entities/Memory';

describe('ListUserMemories', () => {
  it('should return all memories of a user', async () => {
    const repo = new MockMemoryRepository();
    const memory1 = Memory.create('1', 'user-1', 'photo-a', 'Memory A', new Date());
    const memory2 = Memory.create('2', 'user-1', 'photo-b', 'Memory B', new Date());
    const memory3 = Memory.create('3', 'user-2', 'photo-c', 'Memory C', new Date());

    await repo.save(memory1);
    await repo.save(memory2);
    await repo.save(memory3);

    const useCase = new ListUserMemories(repo);

    const memories = await useCase.execute({ userId: 'user-1' });
    expect(memories).toHaveLength(2);
    expect(memories.map(m => m.caption)).toContain('Memory A');
    expect(memories.map(m => m.caption)).toContain('Memory B');
  });
});
