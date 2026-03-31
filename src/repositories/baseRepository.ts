import { Collection, Db, Document, Filter, FindOptions, OptionalId, WithId } from 'mongodb';

export class BaseRepository<T extends Document> {
  protected readonly collection: Collection<T>;

  constructor(db: Db, collectionName: string) {
    this.collection = db.collection<T>(collectionName);
  }

  public async insertOne(doc: OptionalId<T>): Promise<WithId<T>> {
    const result = await this.collection.insertOne(doc);
    return { ...doc, _id: result.insertedId } as WithId<T>;
  }

  public async find(filter: Filter<T>, options?: FindOptions<T>): Promise<T[]> {
    return this.collection.find(filter, options).toArray();
  }

  public async findOne(filter: Filter<T>): Promise<T | null> {
    return this.collection.findOne(filter);
  }
}
