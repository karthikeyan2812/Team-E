import { describe, expect, it } from "vitest";
import { loadConfig } from "./config.js";

describe("application configuration", () => {
  it("uses loopback service defaults without requiring Jira credentials", () => {
    const config = loadConfig({});

    expect(config.API_PORT).toBe(3001);
    expect(config.MONGODB_URI).toBe("mongodb://127.0.0.1:27017");
    expect(config.QDRANT_URL).toBe("http://127.0.0.1:6333");
    expect(config.OLLAMA_BASE_URL).toBe("http://127.0.0.1:11434");
    expect(config.JIRA_API_TOKEN).toBeUndefined();
  });

  it("rejects partial Jira credentials without printing supplied secrets", () => {
    const token = "do-not-include-this-token";

    expect(() => loadConfig({
      JIRA_EMAIL: "qa@example.invalid",
      JIRA_API_TOKEN: token
    })).toThrow();

    try {
      loadConfig({
        JIRA_EMAIL: "qa@example.invalid",
        JIRA_API_TOKEN: token
      });
    } catch (error) {
      expect(String(error)).not.toContain(token);
    }
  });

  it("requires HTTPS for non-local Jira hosts", () => {
    expect(() => loadConfig({
      JIRA_BASE_URL: "http://jira.example.invalid",
      JIRA_EMAIL: "qa@example.invalid",
      JIRA_API_TOKEN: "token"
    })).toThrow(/HTTPS/);
  });
});
