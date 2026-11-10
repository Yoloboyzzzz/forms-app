# Forms

A forms app in the style of Google Forms, for forms that are **assigned** to people. Built with Expo (React Native), TypeScript, Expo Router, Zustand and Supabase. Runs as a PWA first; the native Android/iOS app follows from the same code.

**Live app (PWA):** `https://yoloboyzzzz.github.io/forms-app/`


## Two views

The app shows a different home depending on the role of the account that logs in.

### Admin view

Admins create and manage forms, assign them and read the answers.

| Screen | What it does |
| --- | --- |
| **Forms** | All forms with a status filter (draft / published / archived). Create, publish, archive, duplicate. |
| **Form editor** | Sections and questions. Question types: short answer, paragraph, multiple choice, checkboxes, dropdown, linear scale, rating, multiple-choice grid, checkbox grid, date, time, file upload. Required switch, validation rules, question images, branching ("after this section go to …", per-option jumps). Changes autosave. |
| **Settings** | Accepting responses on/off, closing date, one response per person, editing after submit, shuffled questions, progress bar, confirmation message. |
| **Preview** | Fills in the form exactly like a user would, without saving anything. |
| **Assign** | Choose which users must fill in a form, with an optional due date. |
| **Responses** | Summary per question (counts per answer), the list of responses and every individual response, including uploaded files. |
| **Users** | Create accounts with a first-time password (generator + copy), reset passwords, change roles. |
| **Profile** | Name, language (Dutch/English), change password, log out. |

### User view

Users only see the forms assigned to them.

| Screen | What it does |
| --- | --- |
| **My forms** | Assigned forms split into to do / submitted, with due dates. |
| **Fill in** | One section at a time with a progress bar. Answers autosave as a draft, so closing the app loses nothing. Inline validation, required questions, branching, file upload. An offline banner shows when the connection drops and submit is disabled until it returns. |
| **Confirmation** | The confirmation message of the form after submitting. |
| **Profile** | Name, language, change password, log out. |

New accounts must change their first-time password at first login; nothing else is reachable before that.

## Test accounts

| Account | Role | Purpose |
| --- | --- | --- |
| `testuser1@test.com` | admin | Admin view |
| `testuser2@test.com` | user | User view |
| `testuser3@test.com` | user | Testing (second user, e.g. to check that forms are only visible when assigned) |
| `testuser4@test.com` | user | Testing |

The passwords are not stored in this repository; they are handed in with the assignment.

## How it works

```
page (app/)  →  hook (src/hooks)  →  store (src/state)  →  service (src/services)  →  Supabase
```

- `app/` only contains thin routes (Expo Router); all styling lives in components (`src/components`, base building blocks in `src/components/primitives`).
- `src/services` is the only place that talks to Supabase. `src/state` holds state that must survive a page switch (Zustand).
- `src/utils` has the pure logic: validation, branching, response summaries.
- Security is enforced in the database: **Row Level Security** on every table and storage bucket, triggers for the critical rules (required answers, one response, password-change lock). Admin user management runs in two Edge Functions (`supabase/functions`), so no secret key is ever in the app.
- Dutch and English, all text in `src/i18n/locales`.

More detail: [`AGENTS.md`](AGENTS.md) (guidelines and decisions), [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md) (steps and status).

## Run it locally

```bash
npm install
cp .env.example .env        # fill in the Supabase URL and publishable key
npm run web                 # http://localhost:8081
```

Database: apply `supabase/migrations/*` (`npx supabase db push`) and deploy the Edge Functions (`npx supabase functions deploy admin-create-user`, `admin-reset-password`). The first admin is created by hand (see `AGENTS.md` §7.1).

### Tests

```bash
npm run typecheck           # TypeScript, zero errors
npm test                    # Jest unit and component tests (coverage thresholds in jest.config.js)
npm run web                 # in one terminal …
npm run cypress:run         # … E2E tests in another; needs cypress.env.json (see cypress.env.example.json)
```

## Deploying to GitHub Pages

The workflow `.github/workflows/deploy-pages.yml` type-checks, runs the unit tests, exports the web build and publishes it.

One-time setup on GitHub:

1. Push the repository.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. **Settings → Secrets and variables → Actions → Variables**: add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (both are public values).
4. Push to `main` (or run the workflow by hand). The address appears in the workflow run and under Settings → Pages.

The site lives under `/<repository-name>/`; the build handles that through `EXPO_BASE_URL`. Unknown paths fall back to the app shell (`404.html`), so refreshing on a deep link works.

Install on a phone: open the address in Chrome/Safari and choose *Add to Home Screen*.
