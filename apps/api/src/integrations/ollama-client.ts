import { z } from "zod";

const OllamaTagsSchema = z.object({
  models: z.array(z.object({
    name: z.string().min(1)
  }))
});

export interface OllamaClientOptions {
  baseUrl: string;
  fetchImplementation?: typeof fetch;
  timeoutMs?: number;
}

export class OllamaClient {
  private readonly fetchImplementation: typeof fetch;
  private readonly timeoutMs: number;
  private readonly baseUrl: string;

  constructor(options: OllamaClientOptions) {
    this.fetchImplementation = options.fetchImplementation ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 5000;
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
  }

  async listModels(): Promise<string[]> {
    const response = await this.fetchImplementation(`${this.baseUrl}/api/tags`, {
      method: "GET",
      signal: AbortSignal.timeout(this.timeoutMs)
    });

    if (!response.ok) {
      throw new Error(`Ollama returned HTTP ${response.status}.`);
    }

    const result = OllamaTagsSchema.safeParse(await response.json());
    if (!result.success) {
      throw new Error("Ollama returned an invalid model-list response.");
    }

    return result.data.models.map((model) => model.name);
  }

  async ping(): Promise<void> {
    await this.listModels();
  }
}
