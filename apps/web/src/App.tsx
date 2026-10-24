export function App() {
  return (
    <main className="workspace">
      <section className="hero" aria-labelledby="page-title">
        <p className="eyebrow">ICEPOT · QA WORKSPACE</p>
        <h1 id="page-title">Intelligent QA Workflow Assistant</h1>
        <p className="intro">
          Turn requirements into reviewable, evidence-grounded test cases.
        </p>
        <div className="status" role="status">
          <span className="status-dot" aria-hidden="true" />
          Local application foundation is ready
        </div>
      </section>

      <section className="next-step" aria-labelledby="next-step-title">
        <div>
          <p className="eyebrow">FIRST WORKFLOW</p>
          <h2 id="next-step-title">Requirement analysis</h2>
          <p>
            Jira, retrieval, and local model connections will be added in
            later, separately verified phases.
          </p>
        </div>
        <span className="phase-badge">Phase 1 of 6</span>
      </section>
    </main>
  );
}

