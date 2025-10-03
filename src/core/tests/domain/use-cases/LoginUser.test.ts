import { LoginUser } from '../../../domain/use-cases/User/LoginUser';
import { MockUserRepository } from '../../../infra/repositories/MockUserRepository';
import { User } from '../../../domain/entities/User';
import { Name } from '../../../domain/value-objects/Name';
import { Email } from '../../../domain/value-objects/Email';
import { Password } from '../../../domain/value-objects/Password';

describe('LoginUser', () => {
  it('should login with correct credentials', async () => {
    const repo = new MockUserRepository();
  const user = User.create('1', Name.create('John Doe'), Email.create('john@example.com'), Password.create('hashed_12345678'));
    await repo.save(user);

    const useCase = new LoginUser(repo);

    const loggedIn = await useCase.execute({
      email: 'john@example.com',
      password: '12345678'
    });

    expect(loggedIn).toEqual(user);
  });

  it('should throw for invalid credentials', async () => {
    const repo = new MockUserRepository();
    const useCase = new LoginUser(repo);

    await expect(
      useCase.execute({ email: 'notfound@example.com', password: 'wrong' })
    ).rejects.toThrow('Invalid credentials');
  });
});
