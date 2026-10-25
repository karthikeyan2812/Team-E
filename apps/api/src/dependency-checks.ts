import type { AppConfig } from "./config.js";
import { MongoStore } from "./integrations/mongodb-store.js";
import { OllamaClient } from "./integrations/ollama-client.js";
import { QdrantStore } from "./integrations/qdrant-store.js";

export interface DependencyChecks {
  mongodb: () => Promise<void>;
  qdrant: () => Promise<void>;
  ollama: () => Promise<void>;
}

export function createDependencyChecks(config: AppConfig): DependencyChecks {
  return {
    async mongodb() {
      const store = await MongoStore.connect(config.MONGODB_URI, config.MONGODB_DATABASE);
      await store.close();
    },
    async qdrant() {
      await new QdrantStore({
        url: config.QDRANT_URL,
        collectionName: config.QDRANT_COLLECTION,
        apiKey: config.QDRANT_API_KEY
      }).ping();
    },
    async ollama() {
      await new OllamaClient({
        baseUrl: config.OLLAMA_BASE_URL
      }).ping();
    }
  };
}
