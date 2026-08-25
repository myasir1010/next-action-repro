// Stands in for the `student_workspaces` row: no database needed, and
// `next start` is one process, which is all this repro requires.
export const store = { goal: null };

export function sleep(ms) {
  return ms > 0 ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve();
}
