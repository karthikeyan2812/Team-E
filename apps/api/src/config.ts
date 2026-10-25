import { z } from "zod";

const optionalString = z.string().trim().optional().transform((value) => value || undefined);

const EnvironmentSchema = z.object({
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  MONGODB_URI: z.string().url().default("mongodb://127.0.0.1:27017"),
  MONGODB_DATABASE: z.string().trim().min(1).default("icepot_qa"),
  QDRANT_URL: z.string().url().default("http://127.0.0.1:6333"),
  QDRANT_COLLECTION: z.string().trim().min(1).default("qa_sources"),
  QDRANT_API_KEY: optionalString,
  OLLAMA_BASE_URL: z.string().url().default("http://127.0.0.1:11434"),
  JIRA_BASE_URL: optionalString,
  JIRA_EMAIL: optionalString,
  JIRA_API_TOKEN: optionalString
}).superRefine((values, context) => {
  const jiraValues = [values.JIRA_BASE_URL, values.JIRA_EMAIL, values.JIRA_API_TOKEN];
  const configuredJiraValues = jiraValues.filter(Boolean).length;

  if (configuredJiraValues !== 0 && configuredJiraValues !== jiraValues.length) {
    context.addIssue({
      code: "custom",
      message: "Configure JIRA_BASE_URL, JIRA_EMAIL, and JIRA_API_TOKEN together.",
      path: ["JIRA_BASE_URL"]
    });
  }

  if (values.JIRA_BASE_URL) {
    const parsedUrl = new URL(values.JIRA_BASE_URL);
    const isLocalHttp = parsedUrl.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(parsedUrl.hostname);

    if (parsedUrl.protocol !== "https:" && !isLocalHttp) {
      context.addIssue({
        code: "custom",
        message: "JIRA_BASE_URL must use HTTPS except for a local test server.",
        path: ["JIRA_BASE_URL"]
      });
    }
  }
});

export type AppConfig = z.infer<typeof EnvironmentSchema>;

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
  return EnvironmentSchema.parse(environment);
}
