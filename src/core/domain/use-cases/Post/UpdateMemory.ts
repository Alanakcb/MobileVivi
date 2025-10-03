// src/domain/use-cases/UpdateMemory.ts
import { Memory } from "../../entities/Memory";
import { IMemoryRepository } from "../../repositories/IMemoryRepository";

export class UpdateMemory {
  constructor(private readonly memoryRepository: IMemoryRepository) {}

  async execute(params: {
    id: string;
    caption?: string;
  }): Promise<Memory> {
    const memory = await this.memoryRepository.findById(params.id);
    if (!memory) {
      throw new Error("Memory not found");
    }

    const updatedMemory = Memory.create(
      memory.id,
      memory.userId,
      memory.photo,
      params.caption ?? memory.caption,
      memory.dateTime
    );

    await this.memoryRepository.update(updatedMemory);
    return updatedMemory;
  }
}
