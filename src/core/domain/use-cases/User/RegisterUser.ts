// src/domain/use-cases/RegisterUser.ts
import { User } from "../../entities/User";
import { IUserRepository } from "../../repositories/IUserRepository";
import { Name } from "../../value-objects/Name";
import { Email } from "../../value-objects/Email";
import { Password } from "../../value-objects/Password";

export class RegisterUser {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(params: {
    name: string;
    email: string;
    password: string;
  }): Promise<User> {
    const { name, email, password } = params;

    const userExists = await this.userRepository.findByEmail(email);
    if (userExists) {
      throw new Error("User already exists");
    }

    const hashedPassword = await this.hashPassword(password);

    const user = User.create(
      Math.random().toString(),
      new Name(name),
      new Email(email),
      new Password(hashedPassword)
    );

    await this.userRepository.save(user);
    return user;
  }

  private async hashPassword(password: string): Promise<string> {
    return `hashed_${password}`;
  }
}
