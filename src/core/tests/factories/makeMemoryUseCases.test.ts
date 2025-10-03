import { makeMemoryUseCases } from '../../factories/makeMemoryUseCases';

describe('makeMemoryUseCases', () => {
  it('should create and return all memory use cases', () => {
    const useCases = makeMemoryUseCases();

  expect(useCases.createMemory).toBeDefined();
  expect(useCases.updateMemory).toBeDefined();
  expect(useCases.deleteMemory).toBeDefined();
  expect(useCases.findMemory).toBeDefined();
  expect(useCases.listUserMemories).toBeDefined();
  });
});
