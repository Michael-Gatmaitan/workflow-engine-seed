# sc-workflow-engine-seed

Standalone dev tool that seeds the `sc-workflow-engine` database with sample
data (a project, statuses, a workflow with canvas layout, work item types, a
custom field, work items, comments, and labels).

This is the `/dev/seed-workflow-engine` page extracted out of `sc-pwa` into
its own Next.js project, so it can be run without pulling in the rest of the
PWA (service worker, task board, kanban, etc.).

## Setup

```bash
npm install
cp .env.example .env
# fill in AUTH_SECRET, AUTH_API_BASE_URL, WORKFLOW_ENGINE_API_BASE_URL, etc.
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/login`. Sign in with
the same staff credentials used in sc-pwa (this project talks to the same
legacy auth API to get an access token), then you'll land on the seed page
at `/dev/seed-workflow-engine`.

## How auth works here

- `AUTH_API_BASE_URL` / `AUTH_API_TENANT` — the legacy auth service you log
  in against (same one sc-pwa uses). A successful login returns a token that
  is stored as the NextAuth session's `accessToken`.
- `WORKFLOW_ENGINE_API_BASE_URL` / `NEXT_PUBLIC_WORKFLOW_ENGINE_DEFAULT_HOUSE_ID`
  — the workflow-engine backend that gets seeded. The session's
  `accessToken` is sent as a Bearer token, and the house id as an `X-House`
  header, on every request.

Unlike sc-pwa, this project does **not** include WebAuthn/passkey login —
only email/password. It's a small internal tool, so that seemed like
unnecessary weight to carry over.

## What got carried over vs. left behind

Carried over unchanged: the seed page and its runner component, all the
`workflowEngine` API client / server actions / types, the seed data plan,
and the shadcn-based `Card` / `Badge` / `Button` primitives it renders with.

Left behind (not needed by this tool): the PWA/service-worker layer,
Drizzle/Postgres + WebAuthn passkey storage, the task board & kanban UI, and
push notifications.

## Notes

- Seeding is idempotent-ish: every run creates a new Project with a unique
  key (`SEED####`), so it's safe to click "Run Seed" more than once.
- The seed page 404s when `NODE_ENV=production`, same guard as in sc-pwa —
  this is meant to be run locally against a dev/staging workflow-engine, not
  shipped anywhere.
