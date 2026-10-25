import { describe, expect, it, vi } from "vitest";
import { JiraCloudClient } from "./jira-cloud-client.js";

const credentials = {
  baseUrl: "https://example.atlassian.net",
  email: "qa@example.invalid",
  apiToken: "test-token"
};

describe("JiraCloudClient", () => {
  it("retrieves an issue with a read-only request and returns a safe source URL", async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        key: "PROJ-123",
        fields: {
          summary: "Requirement summary",
          description: null
        }
      })
    );
    const client = new JiraCloudClient({ credentials, fetchImplementation });

    await expect(client.getIssue("PROJ-123")).resolves.toEqual({
      key: "PROJ-123",
      summary: "Requirement summary",
      description: null,
      url: "https://example.atlassian.net/browse/PROJ-123"
    });

    const [requestUrl, requestOptions] = fetchImplementation.mock.calls[0];
    expect(requestUrl).toBeInstanceOf(URL);
    expect(requestOptions?.method).toBe("GET");
    expect(requestOptions?.headers).toMatchObject({
      authorization: `Basic ${Buffer.from("qa@example.invalid:test-token").toString("base64")}`
    });
    expect(String(requestUrl)).not.toContain(credentials.apiToken);
  });

  it("escapes JQL text and constrains search count", async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        issues: [{
          key: "PROJ-1",
          fields: { summary: "A result" }
        }]
      })
    );
    const client = new JiraCloudClient({ credentials, fetchImplementation });

    await client.searchIssues("PROJ", 'login" OR project = "OTHER', 10);

    const [requestUrl, requestOptions] = fetchImplementation.mock.calls[0];
    const url = new URL(String(requestUrl));
    expect(url.pathname).toBe("/rest/api/3/search/jql");
    expect(url.searchParams.get("jql")).toContain('\\"');
    expect(url.searchParams.get("maxResults")).toBe("10");
    expect(requestOptions?.method).toBe("GET");
  });

  it("rejects invalid issue keys and search bounds before any network call", async () => {
    const fetchImplementation = vi.fn<typeof fetch>();
    const client = new JiraCloudClient({ credentials, fetchImplementation });

    await expect(client.getIssue("PROJ-1?expand=all")).rejects.toThrow("invalid");
    await expect(client.searchIssues("PROJ", "query", 51)).rejects.toThrow(RangeError);
    expect(fetchImplementation).not.toHaveBeenCalled();
  });

  it("does not include credentials or response bodies in upstream errors", async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("private upstream detail", { status: 403 })
    );
    const client = new JiraCloudClient({ credentials, fetchImplementation });

    await expect(client.getIssue("PROJ-1")).rejects.toThrow("HTTP 403");
    await expect(client.getIssue("PROJ-1")).rejects.not.toThrow(credentials.apiToken);
  });
});
