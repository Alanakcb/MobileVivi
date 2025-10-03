// src/domain/use-cases/CreateMemory.ts
import { Memory } from "../../entities/Memory";
import { IMemoryRepository } from "../../repositories/IMemoryRepository";

export class CreateMemory {
  constructor(private readonly memoryRepository: IMemoryRepository) {}

  async execute(params: {
    userId: string;
    photo: string;
    caption: string;
  }): Promise<Memory> {
    const memory = Memory.create(
      Math.random().toString(),
      params.userId,
      params.photo,
      params.caption,
      new Date()
    );

    await this.memoryRepository.save(memory);
    return memory;
  }
}
