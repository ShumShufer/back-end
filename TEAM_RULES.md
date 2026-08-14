# Team Rules — Driving School Platform

Short, non-negotiable. If a rule feels wrong, raise it with Zeaman — don't quietly skip it.

---

## 1. Git & Branching

- Repos have three tiers: `main` ← `front-end-dev` / `back-end-dev` ← personal branches (`yonas/*`, `yeabsra/*`, `yohannes/*`, `zeaman/*`).
- **Nobody pushes directly to `main` or to `front-end-dev`/`back-end-dev`.** No exceptions, no "just this once."
- Work happens on your own branch → PR into the relevant `*-dev` branch.
- Only Zeaman merges PRs into `*-dev`, and only Zeaman merges `*-dev` into `main`.
- `main` only gets updated after the feature set on `*-dev` has been tested.
- Delete your branch after it's merged; cut a fresh one from the latest `*-dev` for your next task (don't keep reusing a stale branch).
- Pull/rebase from `*-dev` before opening a PR if it's been more than a day — don't let branches drift.

## 2. Commit Messages

Format: `<tag>: <short description>`

Tags: `feat` (new feature), `fix` (bug fix), `doc` (documentation), `ui` (styling/visual only, no logic), `refactor` (no behavior change), `test`, `chore` (config/tooling), `perf`.

- One logical change per commit — don't bundle an unrelated fix into a feature commit.
- Description in imperative mood: `feat: add classroom schedule endpoint`, not `added schedule stuff`.
- If a commit needs more explanation, add a body after a blank line — don't cram it into the subject line.
- No commits titled `wip`, `fix stuff`, `asdf`, or similar. Squash your own messy history before opening the PR if needed.

## 3. Pull Requests & Code Review

- PR description must state: what changed, why, and how to test it.
- Link the GitHub issue it closes (`Closes #12`).
- Keep PRs scoped to one issue/feature — don't drag in unrelated changes.
- Zeaman reviews every PR before merge. Reviews check: correctness, adherence to architecture (layers not skipped), styling rules (frontend), security basics (backend), and comment quality.
- If review requests changes, address them in new commits on the same branch — don't force-push over review history mid-review.
- Nothing gets merged with failing CI (lint/build/tests).

## 4. Frontend Rules

- **No hardcoded styles.** Every color, font, size, spacing, radius, shadow must reference a CSS variable/design token — never a raw hex code or magic pixel number in a component.
- **Strict layering**: UI components never fetch data or hold business state directly. Flow is always `UI → Context (state) → Service (interface)`. A component should not know or care whether data comes from mock or the real API.
- Mock data lives centrally in `services/mock/mockData/`, exposed only through the service interfaces — never imported directly into a component or context.
- Each component owns its own CSS Module. No component's styles should affect another's.
- State changes must update the UI reactively (React state/Context) — never trigger a full page reload to reflect a data change.
- Every screen must work on mobile widths from the start. Not "we'll fix responsiveness later."

## 5. Backend Rules

- **Layering is mandatory**: `routes → middleware (auth/validate) → controller → service → model/prisma`. Controllers never call Prisma directly. Business logic never lives in a controller or route file.
- Every input is validated with Zod before it touches a service.
- Every route that isn't explicitly public has `authenticate` + `authorize` middleware.
- Every resource scoped to a school checks the requester actually belongs to that school (`scopeToSchool`).
- No raw SQL string concatenation — Prisma queries only.
- Secrets/config only come from environment variables, validated at startup — never hardcoded.

## 6. Comments & Documentation

- Every exported function/service method gets a short comment explaining *why* it exists if the name alone isn't obvious — not a restatement of the code.
- Complex logic (price recommendation, schedule priority check, commission calc) must have a comment explaining the rule being implemented, so anyone reading it understands the business reason.
- Every repo has an up-to-date `README.md`: how to install, run, seed, and test.
- No leftover commented-out code blocks in merged PRs — delete it, git history is the backup.

## 7. Task & Communication

- Every task worked on must correspond to a GitHub issue, assigned to you, moved across the board (Todo → In Progress → In Review → Done).
- If you're blocked for more than ~30 minutes, say so in the team channel — don't sit on it silently.
- Daily check-in: what you finished yesterday, what you're doing today, anything blocking you.
- If you find a bug outside your current task, file an issue for it — don't silently fix unrelated code in your PR (unless it's a one-line blocker for your own task, and you mention it in the PR description).

## 8. Definition of Done

A task is only "done" when:
1. Code is merged into the relevant `*-dev` branch.
2. It matches the design/architecture rules above.
3. It has no leftover `console.log`/debug code.
4. It handles the error and loading states, not just the happy path.
5. It's been manually tested on both desktop and mobile widths (frontend) or with a real request (backend).
