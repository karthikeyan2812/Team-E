import { MongoClient, type MongoClientOptions } from "mongodb";

export interface MongoDatabase {
  command(command: Record<string, number>): Promise<unknown>;
}

export interface MongoClientConnection {
  connect(): Promise<unknown>;
  db(name?: string): MongoDatabase;
  close(): Promise<void>;
}

export type MongoClientFactory = (
  uri: string,
  options: MongoClientOptions
) => MongoClientConnection;

export class MongoStore {
  private constructor(
    private readonly client: MongoClientConnection,
    private readonly database: MongoDatabase
  ) {}

  static async connect(
    uri: string,
    databaseName: string,
    clientFactory: MongoClientFactory = (connectionUri, options) =>
      new MongoClient(connectionUri, options)
  ): Promise<MongoStore> {
    const client = clientFactory(uri, {
      appName: "icepot-qa-workflow-assistant",
      serverSelectionTimeoutMS: 3000
    });

    try {
      await client.connect();
      await client.db("admin").command({ ping: 1 });
      return new MongoStore(client, client.db(databaseName));
    } catch (error) {
      await client.close();
      throw error;
    }
  }

  async ping(): Promise<void> {
    await this.database.command({ ping: 1 });
  }

  async close(): Promise<void> {
    await this.client.close();
  }
}
