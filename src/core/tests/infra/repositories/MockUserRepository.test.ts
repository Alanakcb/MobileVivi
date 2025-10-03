import { MockUserRepository } from '../../../infra/repositories/MockUserRepository';
import { User } from '../../../domain/entities/User';
import { Name } from '../../../domain/value-objects/Name';
import { Email } from '../../../domain/value-objects/Email';
import { Password } from '../../../domain/value-objects/Password';

describe('MockUserRepository', () => {
  it('should save and find a user', async () => {
    const repo = new MockUserRepository();
    const user = User.create('1', Name.create('John Doe'), Email.create('john@example.com'), Password.create('12345678'));

    await repo.save(user);
    const found = await repo.findById('1');

    expect(found).toEqual(user);
  });

  it('should delete a user', async () => {
    const repo = new MockUserRepository();
    const user = User.create('1', Name.create('John Doe'), Email.create('john@example.com'), Password.create('12345678'));

    await repo.save(user);
    await repo.delete('1');

    const found = await repo.findById('1');
    expect(found).toBeNull();
  });
});
