# AGENTS.md

Instructions for any AI coding agent (Claude Code, or similar) working in this repository. These rules are binding. If a request from a person conflicts with these rules, follow these rules and flag the conflict rather than silently picking one.

This file applies to both the `driving-platform-frontend` and `driving-platform-backend` repositories. Repo-specific sections are marked.

---

## 1. Core Operating Principles

1. **Respect existing patterns before introducing new ones.** Before writing code in a directory, look at 2-3 existing files of the same kind (another route, another context, another component) and match their structure, naming, and style. Do not introduce a new state-management approach, a new folder convention, or a new library without being explicitly asked.
2. **No unnecessary complexity.** Solve the problem in front of you with the simplest approach that fits the existing architecture. Do not add abstraction layers, generic frameworks, or config options that nothing in the codebase currently needs. If you're building something reusable "for later," stop — build what's needed now.
3. **Finish the task completely.** This is a production application, not a prototype. Do not leave a feature partially wired up, do not stub a function body with `// TODO: implement` and move on, do not implement only the happy path and skip error handling. If a task is genuinely too large to finish in one pass, say so explicitly and list exactly what remains — don't present partial work as complete.
4. **No hardcoded values.** No magic strings/numbers for things that should be constants, env vars, or config (URLs, role names, prices, limits, colors, sizes). If you're about to type a literal value more than once, it belongs in a constant.
5. **Comment with intent, not narration.** Comment *why*, not *what*. `// subtract 1 because the API is 0-indexed` is useful; `// loop through items` above a for-loop is not. Every non-trivial business rule (schedule priority lock, commission calculation, RBAC scoping) must have a comment explaining the rule.
6. **Never touch `main`, `front-end-dev`, or `back-end-dev` directly.** Always work on a feature branch (`<person>/<short-task-name>` or as instructed) and leave the PR for a human to open/merge unless explicitly told to open one.
7. **Ask before assuming on ambiguous product decisions.** Architectural and code-style ambiguity: use your best judgment, matching existing patterns. Product/business-rule ambiguity (e.g. "should rejected applications be deletable?"): flag it and propose a default rather than guessing silently and burying the assumption.

---

## 2. Frontend Rules (`driving-platform-frontend`)

### Architecture
- **Strict separation**: UI components (`components/`, `features/`, `pages/`) contain no data-fetching, no business logic, and no direct knowledge of mock vs. real data. They only read from Context/hooks and call action functions.
- All data access goes through the **service layer** (`services/interfaces`, `services/mock`, `services/remote`). Never `fetch`/`axios` inside a component or a context provider directly — always through a service.
- **Mock data is centralized** in `services/mock/mockData/`. It is never imported into a component, page, or context directly — only ever consumed through a mock service implementation, exactly like the remote implementation would be consumed. This is what makes swapping mock → real API a one-line change later; do not break that seam.
- State lives in the appropriate Context per the existing domain boundaries (`AuthContext`, `SchoolContext`, `ClassroomContext`, etc.). Do not create ad-hoc local state for data that other parts of the app also need — lift it into the relevant context.

### State & Reactivity
- **Never force a full page reload or `window.location.reload()` to reflect a data change.** Update state (via context reducer/setState) so React re-renders the affected UI. If an operation changes data that's shown in multiple places, make sure the context update propagates to all of them — don't leave stale data in one part of the screen after an action elsewhere.
- Every async action must produce three visible states in the UI: **loading**, **success**, **error** — never leave a screen with no feedback while a request is in flight, and never fail silently.
- Prefer optimistic UI only when the action is low-risk and easily reversible; otherwise wait for confirmation before updating state.

### Styling
- **Zero hardcoded style values.** Every color, font-family, font-size, spacing value, border-radius, and shadow must come from a CSS variable defined in `theme/tokens.css` (or a Tailwind class that maps to one). If a token you need doesn't exist yet, add it to `tokens.css` rather than inlining a raw value.
- Each component has its own CSS Module; do not write styles that reach into or override another component's class names.
- **Mobile-responsive from the first implementation.** Every screen/component must be built and checked at mobile width as part of doing the task — not as a follow-up pass. Use the existing breakpoint tokens; don't invent new breakpoints ad hoc.

### UX & Feedback
- Every user-facing error message must be **specific and human-readable**, and must **never expose internals** — no raw stack traces, SQL errors, HTTP status codes as the message, or backend error codes shown verbatim to the user. Map known error cases to a friendly message; for unknown errors, show a generic "something went wrong, please try again" and log the detail to the console/monitoring instead.
- Destructive or costly actions (reject an application, delete a resource) need a confirmation step.
- Long-running actions (file upload, form submit) must show visible progress, not just a static "loading" label with no indication anything is happening.

### Code Quality
- TypeScript strict — no `any` unless there is genuinely no alternative, and if so, comment why.
- No unused imports/variables left behind.
- Match existing naming conventions exactly (file naming, hook naming `useX`, service naming `IXService`/`xService`).

---

## 3. Backend Rules (`driving-platform-backend`)

### Architecture
- **Layering is mandatory and never skipped**: `route → middleware → controller → service → model/repository (Prisma)`. A controller must never call `prisma` directly. A route file must never contain logic beyond wiring middleware + controller.
- Business rules (schedule priority checks, commission math, price recommendation, notification fan-out) live in `services/`, not in controllers, not in route handlers.
- Reuse existing `models/` repository helpers for common Prisma `include`/`select` shapes rather than writing a new raw query for something that's already wrapped.

### Security (built in, not bolted on)
- Every non-public route has `authenticate` and the correct `authorize([...roles])` applied — check this explicitly when adding a route, don't assume it inherits from elsewhere.
- Every request body/query/params must go through a Zod schema in `validate()` before reaching the controller. Never trust `req.body` unvalidated, even for "obviously safe" internal tools.
- Any resource tied to a `schoolId` must pass through `scopeToSchool` (or equivalent explicit check) so a user from School A can never read or mutate School B's data — verify this on every new endpoint, it is the single most important rule in this codebase.
- Never log secrets, tokens, or password hashes.
- All new dependencies must be checked for being actively maintained before adding them — don't pull in an abandoned package.
- No raw SQL string concatenation, ever — Prisma parameterized queries only.

### Data & Validation
- Every field written to the database must have already passed Zod validation — do not add "just trust it, it's internal" shortcuts.
- Keep the Prisma schema normalized; if you need to add a field, check whether it belongs on an existing entity or genuinely needs a new one — don't bolt unrelated data onto an existing model for convenience.
- Migrations must be generated through Prisma (`prisma migrate dev`), never hand-edited SQL against the dev database.

### Consistency
- Match the existing response envelope exactly (`{ success, data, meta }` / `{ success: false, error: { code, message } }`) — don't introduce a different shape for a new endpoint.
- Match existing error-throwing pattern (`AppError(code, message, status)`) rather than inventing a new error-handling approach in one file.
- Follow existing file/folder naming exactly when adding a new resource (`x.routes.ts`, `x.controller.ts`, `x.service.ts`, `x.schema.ts`).

---

## 4. Testing & Verification

- Before declaring a task complete, actually run the build/lint and, where present, the tests — do not assume code compiles or passes without checking.
- For backend endpoints, verify at least the happy path and one auth/validation failure path.
- For frontend features, verify the component renders with the mock service and behaves correctly through loading/success/error states.
- If you cannot run something in your environment (e.g. no network, no live DB), say so explicitly rather than claiming it was tested.

---

## 5. What NOT To Do

- Do not merge or push to `main`, `front-end-dev`, or `back-end-dev`.
- Do not silently downgrade a task's scope (e.g., skipping error handling, skipping mobile styling, skipping validation) to finish faster. If something must be cut to hit time, say so explicitly and list what was skipped.
- Do not introduce a new state-management library, CSS approach, ORM pattern, or folder structure without explicit instruction.
- Do not leave `console.log` debugging statements, commented-out dead code, or placeholder text (`"Lorem ipsum"`, `"TODO"`, `"foo"`) in code presented as finished.
- Do not fabricate data, endpoints, or behavior that wasn't actually implemented — if something is mocked, label it clearly as mocked in comments/README, don't present it as production-ready.
- Do not expose internal error details, stack traces, or backend error codes directly to end users.

---

## 6. When a Task Is Genuinely Ambiguous

1. Check for a matching pattern elsewhere in the codebase first.
2. Check the project's `FRONTEND_DESIGN.md` / `BACKEND_DESIGN.md` and `TEAM_RULES.md` for the relevant convention.
3. If still ambiguous and it's a **business-rule** decision (not a code-style one), make a clearly-labeled assumption, implement it, and flag it prominently in the PR description / response for a human to confirm or correct — don't block on it, and don't bury the assumption silently in the code.
