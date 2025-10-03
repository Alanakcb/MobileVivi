import { makeUserUseCases } from '../../factories/makeUserUseCases';

describe('makeUserUseCases', () => {
  it('should create and return all user use cases', () => {
    const useCases = makeUserUseCases();

    expect(useCases.registerUser).toBeDefined();
    expect(useCases.loginUser).toBeDefined();
    expect(useCases.updateUser).toBeDefined();
  });
});
