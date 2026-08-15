import { Collection, Db } from "mongodb";
import { UserDocument } from "./User.js";

export class UserRepository {
  private readonly users: Collection<UserDocument>;

  public constructor(database: Db) {
    this.users = database.collection<UserDocument>("users");
  }

  public async ensureIndexes(): Promise<void> {
    await this.users.createIndex({ email: 1 }, { unique: true });
  }

  public async create(user: UserDocument): Promise<UserDocument> {
    const result = await this.users.insertOne(user);
    return { ...user, _id: result.insertedId };
  }

  public findByEmail(email: string): Promise<UserDocument | null> {
    return this.users.findOne({ email });
  }
}
