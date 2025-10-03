import { IMemoryRepository } from "../../domain/repositories/IMemoryRepository";
import { Memory } from "../../domain/entities/Memory";

export class MockMemoryRepository implements IMemoryRepository {
  private memories: Memory[] = [];

  async save(memory: Memory): Promise<void> {
    this.memories.push(memory);
  }

  async findById(id: string): Promise<Memory | null> {
    return this.memories.find((m) => m.id === id) || null;
  }

  async findByUserId(userId: string): Promise<Memory[]> {
    return this.memories.filter((m) => m.userId === userId);
  }


  async update(memory: Memory): Promise<void> {
    const index = this.memories.findIndex((m) => m.id === memory.id);
    if (index !== -1) {
      this.memories[index] = memory;
    }
  }

  async findAll(): Promise<Memory[]> {
    return [...this.memories];
  }

  async delete(id: string): Promise<void> {
    this.memories = this.memories.filter((m) => m.id !== id);
  }
}
