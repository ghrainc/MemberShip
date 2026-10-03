Run the QA agent on the current changes. The agent is read-only — it will review, run tests, and report findings. It never edits files.

Invoke the qa agent (defined at .claude/agents/qa.md) with this prompt:

Review the current changes in this project. Run both test suites (`npm test` in the project root for the frontend Vitest suite, and `npm test` in `server/` for the server node:test suite). Then review the changed files against the checklist in your instructions. Produce the full structured report: Checked / Findings / Blast Radius / Ambiguities / Summary.
