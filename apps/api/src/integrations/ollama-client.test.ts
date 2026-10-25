import { describe, expect, it, vi } from "vitest";
import { OllamaClient } from "./ollama-client.js";

describe("OllamaClient", () => {
  it("lists local model names using a GET request", async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        models: [{ name: "local-qa-model" }]
      })
    );
    const client = new OllamaClient({
      baseUrl: "http://127.0.0.1:11434/",
      fetchImplementation
    });

    await expect(client.listModels()).resolves.toEqual(["local-qa-model"]);
    expect(fetchImplementation).toHaveBeenCalledWith(
      "http://127.0.0.1:11434/api/tags",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("rejects malformed service responses", async () => {
    const client = new OllamaClient({
      baseUrl: "http://127.0.0.1:11434",
      fetchImplementation: vi.fn<typeof fetch>().mockResolvedValue(
        Response.json({ error: "not the tags format" })
      )
    });

    await expect(client.listModels()).rejects.toThrow("invalid model-list response");
  });
});
