import { z } from "zod";

const JiraIssueSchema = z.object({
  key: z.string().min(1),
  self: z.string().url().optional(),
  fields: z.object({
    summary: z.string(),
    description: z.unknown().nullable().optional()
  })
});

const JiraSearchResponseSchema = z.object({
  issues: z.array(JiraIssueSchema)
});

export interface JiraCloudCredentials {
  baseUrl: string;
  email: string;
  apiToken: string;
}

export interface JiraIssue {
  key: string;
  summary: string;
  description: unknown | null;
  url: string;
}

export interface JiraCloudClientOptions {
  credentials: JiraCloudCredentials;
  fetchImplementation?: typeof fetch;
  timeoutMs?: number;
}

export class JiraCloudClient {
  private readonly fetchImplementation: typeof fetch;
  private readonly timeoutMs: number;
  private readonly baseUrl: string;
  private readonly authorization: string;

  constructor(options: JiraCloudClientOptions) {
    this.fetchImplementation = options.fetchImplementation ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 10000;
    this.baseUrl = options.credentials.baseUrl.replace(/\/+$/, "");
    this.authorization = `Basic ${Buffer.from(
      `${options.credentials.email}:${options.credentials.apiToken}`
    ).toString("base64")}`;
  }

  async getIssue(issueKey: string): Promise<JiraIssue> {
    if (!/^[A-Z][A-Z0-9_]{0,31}-\d+$/.test(issueKey)) {
      throw new TypeError("Jira issue key is invalid.");
    }

    const url = new URL(`${this.baseUrl}/rest/api/3/issue/${encodeURIComponent(issueKey)}`);
    url.searchParams.set("fields", "summary,description");

    const response = await this.request(url);
    return this.toIssue(await this.parseJson(response), this.baseUrl);
  }

  async searchIssues(projectKey: string, query: string, limit = 20): Promise<JiraIssue[]> {
    if (!/^[A-Z][A-Z0-9_]{0,31}$/.test(projectKey)) {
      throw new TypeError("Jira project key is invalid.");
    }
    if (query.length > 200) {
      throw new RangeError("Jira search query must be 200 characters or fewer.");
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
      throw new RangeError("Jira search limit must be between 1 and 50.");
    }

    const escapedQuery = query.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    const jql = query.trim()
      ? `project = "${projectKey}" AND text ~ "${escapedQuery}"`
      : `project = "${projectKey}"`;
    const url = new URL(`${this.baseUrl}/rest/api/3/search/jql`);
    url.searchParams.set("jql", jql);
    url.searchParams.set("fields", "summary,description");
    url.searchParams.set("maxResults", String(limit));

    const response = await this.request(url);
    const parsed = JiraSearchResponseSchema.safeParse(await this.parseJson(response));
    if (!parsed.success) {
      throw new Error("Jira returned an invalid issue-search response.");
    }

    return parsed.data.issues.map((issue) => this.toIssue(issue, this.baseUrl));
  }

  private async request(url: URL): Promise<Response> {
    const response = await this.fetchImplementation(url, {
      method: "GET",
      headers: {
        authorization: this.authorization,
        accept: "application/json"
      },
      signal: AbortSignal.timeout(this.timeoutMs)
    });

    if (!response.ok) {
      throw new Error(`Jira request failed with HTTP ${response.status}.`);
    }

    return response;
  }

  private async parseJson(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      throw new Error("Jira returned an invalid JSON response.");
    }
  }

  private toIssue(value: unknown, baseUrl: string): JiraIssue {
    const parsed = JiraIssueSchema.safeParse(value);
    if (!parsed.success) {
      throw new Error("Jira returned an invalid issue response.");
    }

    return {
      key: parsed.data.key,
      summary: parsed.data.fields.summary,
      description: parsed.data.fields.description ?? null,
      url: `${baseUrl}/browse/${encodeURIComponent(parsed.data.key)}`
    };
  }
}
