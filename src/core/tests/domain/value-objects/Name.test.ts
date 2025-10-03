import { Name } from '../../../domain/value-objects/Name';

describe('Name', () => {
  it('should create a valid name', () => {
    const name = Name.create('John Doe');
    expect(name.value).toBe('John Doe');
  });

  it('should throw for empty name', () => {
    expect(() => Name.create('')).toThrow('Name must have at least 2 characters');
  });
});
