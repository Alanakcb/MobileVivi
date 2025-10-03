export class Name {
  constructor(readonly value: string) {
    if (!value || value.trim().length < 2) {
      throw new Error("Name must have at least 2 characters");
    }
  }

  static create(value: string): Name {
    return new Name(value);
  }
}
