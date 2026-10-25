import { z } from "zod";

export interface VectorPoint {
  id: string | number;
  vector: number[];
  payload?: Record<string, unknown>;
}

export interface VectorSearchResult {
  id: string | number;
  score: number;
  payload?: Record<string, unknown> | null;
}

const QueryResponseSchema = z.object({
  result: z.object({
    points: z.array(z.object({
      id: z.union([z.string(), z.number()]),
      score: z.number(),
      payload: z.record(z.string(), z.unknown()).nullable().optional()
    }))
  })
});

export interface QdrantStoreOptions {
  url: string;
  collectionName: string;
  apiKey?: string;
  fetchImplementation?: typeof fetch;
  timeoutMs?: number;
}

export class QdrantStore {
  private readonly fetchImplementation: typeof fetch;
  private readonly baseUrl: string;

  constructor(private readonly options: QdrantStoreOptions) {
    this.fetchImplementation = options.fetchImplementation ?? fetch;
    this.baseUrl = options.url.replace(/\/+$/, "");
  }

  async ping(): Promise<void> {
    await this.request(`${this.baseUrl}/collections`, { method: "GET" });
  }

  async upsert(points: VectorPoint[]): Promise<void> {
    if (points.length === 0) {
      return;
    }

    await this.request(
      `${this.baseUrl}/collections/${encodeURIComponent(this.options.collectionName)}/points?wait=true`,
      {
        method: "PUT",
        headers: this.headers(),
        body: JSON.stringify({ points })
      }
    );
  }

  async search(vector: number[], limit: number): Promise<VectorSearchResult[]> {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new RangeError("Qdrant search limit must be between 1 and 100.");
    }

    const response = await this.request(
      `${this.baseUrl}/collections/${encodeURIComponent(this.options.collectionName)}/points/query`,
      {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({
          query: vector,
          limit,
          with_payload: true
        })
      }
    );
    const parsed = QueryResponseSchema.safeParse(await this.parseJson(response));
    if (!parsed.success) {
      throw new Error("Qdrant returned an invalid query response.");
    }

    return parsed.data.result.points.map((point) => ({
      id: point.id,
      score: point.score,
      payload: point.payload
    }));
  }

  private headers(): Record<string, string> {
    return {
      "content-type": "application/json",
      ...(this.options.apiKey ? { "api-key": this.options.apiKey } : {})
    };
  }

  private async request(url: string, init: RequestInit): Promise<Response> {
    const response = await this.fetchImplementation(url, {
      ...init,
      headers: {
        ...this.headers(),
        ...init.headers
      },
      signal: AbortSignal.timeout(this.options.timeoutMs ?? 5000)
    });

    if (!response.ok) {
      throw new Error(`Qdrant returned HTTP ${response.status}.`);
    }

    return response;
  }

  private async parseJson(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      throw new Error("Qdrant returned an invalid JSON response.");
    }
  }
}
