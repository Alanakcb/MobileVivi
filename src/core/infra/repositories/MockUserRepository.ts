import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User } from '../../domain/entities/User';

export class MockUserRepository implements IUserRepository {
  private users: User[] = [];

  async save(user: User): Promise<void> {
    this.users.push(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find(user => user.email.value === email) || null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find(user => user.id === id) || null;
  }

  async update(user: User): Promise<void> {
    const userIndex = this.users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      this.users[userIndex] = user;
    }
  }

  async delete(id: string): Promise<void> {
    this.users = this.users.filter(user => user.id !== id);
  }
}