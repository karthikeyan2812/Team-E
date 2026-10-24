# ICEPOT QA Workflow Assistant

The architecture and phased delivery plan are documented in
[Architecture.md](./Architecture.md). The current implementation is Phase 1:
a local React web shell, Fastify API, shared health contract, and readiness
endpoint. Jira, retrieval, model calls, and script execution are not implemented
yet.

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

## Checks

```powershell
npm test
npm run typecheck
npm run build
```
