import { Memory } from "../entities/Memory";

export interface IMemoryRepository {
  save(memory: Memory): Promise<void>;
  findById(id: string): Promise<Memory | null>;
  findByUserId(userId: string): Promise<Memory[]>;
  findAll(): Promise<Memory[]>;
  update(memory: Memory): Promise<void>;
  delete(id: string): Promise<void>;
}
