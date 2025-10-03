import { IUserRepository } from '../domain/repositories/IUserRepository';
import { RegisterUser } from '../domain/use-cases/User/RegisterUser';
import { LoginUser } from '../domain/use-cases/User/LoginUser';
import { UpdateUser } from '../domain/use-cases/User/UpdateUser';
import { MockUserRepository } from '../infra/repositories/MockUserRepository';

export function makeUserUseCases() {
  const userRepository: IUserRepository = new MockUserRepository();

  const registerUser = new RegisterUser(userRepository);
  const loginUser = new LoginUser(userRepository);
  const updateUser = new UpdateUser(userRepository);

  return {
    registerUser,
    loginUser,
    updateUser,
  };
}
