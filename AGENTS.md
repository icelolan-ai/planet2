# Shared AI working rules

These rules apply to every AI working in this repository, including Codex and Claude.

1. Read `CLAUDE.md`, `docs/AI-HANDOFF.md`, `docs/AI-WORK-LOG.md`, architecture and QA guidance before editing. Read the newest handoff first; older entries may be superseded.
2. Check remote branches/open PRs and the work log before starting. Resume an existing checkpoint instead of implementing the same feature again. Never overwrite another AI's uncommitted work or force-push its branch.
3. Before editing, record the task, AI owner, branch, base commit and intended files in the current-work section of `docs/AI-WORK-LOG.md`. Publish that claim so other sessions can see it. If the same files have an active owner, coordinate with that owner/user before editing them. A log is a coordination record, not an automatic lock; check fresh remote state.
4. After every completed task or fix, append a dated history entry with Bangkok time, AI name, changed files, behavior/state touched, commit/PR, tests actually run, deployment status, limitations and remaining work. Update `docs/AI-HANDOFF.md` in the same change. Never call a build-only or unmerged feature released.
5. Before switching AI or stopping unfinished work, commit and publish a checkpoint branch; record exact status and the next action. Keep unverified product changes out of `main`. Mark ownership released only after the checkpoint is available. The next AI claims it before continuing.
6. Source edits only; generated `index.html`/`assets/` belong to the build workflow. Existing native controllers/state/history/rendering remain owners. Follow repository validation and release rules.
7. Final replies must link the PR/checkpoint and identify what is released versus pending. Reply in Thai.

User requested this shared history and non-overlapping handoff workflow on 2026-10-08.
