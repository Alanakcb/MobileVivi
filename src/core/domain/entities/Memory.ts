export class Memory {
  private constructor(
    readonly id: string,
    readonly userId: string,
    readonly photo: string,   
    readonly caption: string, 
    readonly dateTime: Date
  ) {}

  static create(
    id: string,
    userId: string,
    photo: string,
    caption: string,
    dateTime: Date
  ): Memory {
    return new Memory(id, userId, photo, caption, dateTime);
  }
}
