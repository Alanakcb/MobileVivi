export class Password {
  constructor(readonly value: string) {
    if (value.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }
  }

  static create(value: string): Password {
    return new Password(value);
  }
}
