export class Email {
  constructor(readonly value: string) {
    if (!/\S+@\S+\.\S+/.test(value)) {
      throw new Error("Invalid email format");
    }
  }

  static create(value: string): Email {
    return new Email(value);
  }
}
