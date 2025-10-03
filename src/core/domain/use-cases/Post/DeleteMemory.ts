// src/domain/use-cases/DeleteMemory.ts
import { IMemoryRepository } from "../../repositories/IMemoryRepository";

export class DeleteMemory {
  constructor(private readonly memoryRepository: IMemoryRepository) {}

  async execute(params: { id: string }): Promise<void> {
    const { id } = params;

    const memory = await this.memoryRepository.findById(id);
    if (!memory) {
      throw new Error("Memory not found");
    }

    await this.memoryRepository.delete(id);
  }
}
