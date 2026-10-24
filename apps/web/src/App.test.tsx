import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { App } from "./App.js";

describe("QA workspace", () => {
  it("renders the assistant identity, first workflow, and phase status", () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain("<h1");
    expect(markup).toContain("Intelligent QA Workflow Assistant");
    expect(markup).toContain("Requirement analysis");
    expect(markup).toContain("Local application foundation is ready");
    expect(markup).toContain("Phase 1 of 6");
  });
});
