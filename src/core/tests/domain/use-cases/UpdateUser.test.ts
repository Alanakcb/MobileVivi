import { UpdateUser } from '../../../domain/use-cases/User/UpdateUser';
import { MockUserRepository } from '../../../infra/repositories/MockUserRepository';
import { User } from '../../../domain/entities/User';
import { Name } from '../../../domain/value-objects/Name';
import { Email } from '../../../domain/value-objects/Email';
import { Password } from '../../../domain/value-objects/Password';

describe('UpdateUser', () => {
  it('should update user information', async () => {
    const repo = new MockUserRepository();
    const user = User.create('1', Name.create('John Doe'), Email.create('john@example.com'), Password.create('12345678'));
    await repo.save(user);

    const useCase = new UpdateUser(repo);

    await useCase.execute({
      id: '1',
      name: 'Jane Doe',
      email: 'jane@example.com'
      // password não é suportado pelo use-case atual
    });

    const updated = await repo.findById('1');
  expect(updated?.name.value).toBe('Jane Doe');
  expect(updated?.email.value).toBe('jane@example.com');
  });
});
