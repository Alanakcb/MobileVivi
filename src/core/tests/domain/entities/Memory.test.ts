import { Memory } from '../../../domain/entities/Memory';

describe('Memory', () => {
  it('should create a valid memory', () => {
    const memory = Memory.create(
      '1',
      'user-1',
      'photo-url',
      'This is my first memory',
      new Date()
    );

    expect(memory.id).toBe('1');
    expect(memory.userId).toBe('user-1');
    expect(memory.photo).toBe('photo-url');
    expect(memory.caption).toBe('This is my first memory');
    expect(memory.dateTime).toBeInstanceOf(Date);
  });

});
