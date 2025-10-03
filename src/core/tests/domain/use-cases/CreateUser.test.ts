import { RegisterUser } from '../../../domain/use-cases/User/RegisterUser';
import { MockUserRepository } from '../../../infra/repositories/MockUserRepository';
import { Name } from '../../../domain/value-objects/Name';
import { Email } from '../../../domain/value-objects/Email';
import { Password } from '../../../domain/value-objects/Password';

describe('RegisterUser', () => {
  it('should create and save a new user', async () => {
    const repo = new MockUserRepository();
    const useCase = new RegisterUser(repo);

    const user = await useCase.execute({
      name: 'John Doe',
      email: 'john@example.com',
      password: '12345678'
    });

    const found = await repo.findById(user.id);
    expect(found).toEqual(user);
  });
});
