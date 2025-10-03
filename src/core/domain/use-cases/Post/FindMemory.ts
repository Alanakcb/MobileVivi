// src/domain/use-cases/FindMemory.ts
import { Memory } from "../../entities/Memory";
import { IMemoryRepository } from "../../repositories/IMemoryRepository";

export class FindMemory {
  constructor(private readonly memoryRepository: IMemoryRepository) {}

  async execute(params: { id: string }): Promise<Memory | null> {
    return this.memoryRepository.findById(params.id);
  }
}
