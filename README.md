# ICEPOT QA Workflow Assistant

The architecture and phased delivery plan are documented in
[Architecture.md](./Architecture.md). Phase 1 provides the local React web shell
and Fastify API. Phase 2 adds adapters for MongoDB, Qdrant, Ollama, and read-only
Jira Cloud access. No Jira access or source indexing is activated until the
connection details and approved RAG corpus are confirmed. LangChain workflows,
model generation, and script execution are later phases.

## Requirements

- Node.js 22.9 or newer
- npm 10 or newer

## Local development

1. Copy `.env.example` to `.env`; the API and web development server read
   `API_PORT` from it.
2. Install dependencies:

   ```powershell
   npm install
   ```

3. Start the API in one terminal:

   ```powershell
   npm run dev:api
   ```

4. Start the web UI in another terminal:

   ```powershell
   npm run dev:web
   ```

The API binds to `127.0.0.1:3001` by default. The web UI is served at
`http://127.0.0.1:5173` and proxies `/api` requests to the local API.

## Local service configuration

Copy `.env.example` to `.env` to configure MongoDB, Qdrant, and Ollama
endpoints. The application does not start these services for you. The API
endpoint `GET /api/dependencies` checks connectivity and reports only `up` or
`down` for each local service; it does not expose connection details.

The read-only Jira adapter accepts Jira Cloud base URL, account email, and API
token through `JIRA_BASE_URL`, `JIRA_EMAIL`, and `JIRA_API_TOKEN`. The email/API
token method is approved for read-only use. Supply all three values locally;
do not commit `.env`. Live reads remain gated until permitted project keys and
required issue fields are configured.

Qdrant storage operations are implemented, but no collection is created
automatically: vector dimensions depend on the not-yet-selected embedding
model. Source categories have been approved in principle, but source locations,
project scope, formats, sanitization rules, and retention policy are pending.
Indexing remains disabled until those details are confirmed.

## Checks

```powershell
npm test
npm run typecheck
npm run build
```
