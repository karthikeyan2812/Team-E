import { describe, expect, it, vi } from "vitest";
import { QdrantStore } from "./qdrant-store.js";

describe("QdrantStore", () => {
  it("checks local service connectivity without exposing an API key", async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({ result: { collections: [] } })
    );
    const store = new QdrantStore({
      url: "http://127.0.0.1:6333/",
      collectionName: "qa_sources",
      apiKey: "local-test-key",
      fetchImplementation
    });

    await store.ping();

    expect(fetchImplementation).toHaveBeenCalledWith(
      "http://127.0.0.1:6333/collections",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ "api-key": "local-test-key" })
      })
    );
  });

  it("upserts vectors and maps search hits", async () => {
    const fetchImplementation = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ status: "ok" }))
      .mockResolvedValueOnce(Response.json({
        result: {
          points: [{ id: "source-1", score: 0.91, payload: { sourceId: "jira-1" } }]
        }
      }));
    const store = new QdrantStore({
      url: "http://127.0.0.1:6333",
      collectionName: "qa_sources",
      fetchImplementation
    });

    await store.upsert([{ id: "source-1", vector: [0.1, 0.2], payload: { sourceId: "jira-1" } }]);
    await expect(store.search([0.1, 0.2], 5)).resolves.toEqual([
      { id: "source-1", score: 0.91, payload: { sourceId: "jira-1" } }
    ]);
    expect(fetchImplementation.mock.calls.map(([url, init]) => [url, init?.method])).toEqual([
      ["http://127.0.0.1:6333/collections/qa_sources/points?wait=true", "PUT"],
      ["http://127.0.0.1:6333/collections/qa_sources/points/query", "POST"]
    ]);
  });

  it("validates search limits before making a request", async () => {
    const fetchImplementation = vi.fn<typeof fetch>();
    const store = new QdrantStore({
      url: "http://127.0.0.1:6333",
      collectionName: "qa_sources",
      fetchImplementation
    });

    await expect(store.search([0.1], 101)).rejects.toThrow(RangeError);
    expect(fetchImplementation).not.toHaveBeenCalled();
  });
});
