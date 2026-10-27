# AGENTS.md

Guidelines for every agent (and human) working on this codebase. Read this file completely before you write or change code. When this file and your own habits disagree, this file wins. When this file is silent or unclear, **ask the project owner (Henry) instead of guessing**.

> **Status: v1.0 (2026-10-27).** Henry's decisions are included. Points marked **⚙️ DEFAULT** were not decided explicitly by Henry: they are adopted as the rule for now, and Henry can change them at any time. When one changes, update this file in the same commit. Appendix A lists every decision.

---

## 0. Quick rules (the non-negotiables)

1. **Style lives in components, never in pages.** Use `StyleSheet.create` inside component files. Route files in `app/` contain no `StyleSheet`, no inline `style={{…}}`, no colours or pixel values. Pages compose components.
2. **Work in components as much as possible.** A page is a thin shell: read params, call a hook/store, render components.
3. **Every interactive or asserted element has a `testID`** following the convention in §8.
4. **No hardcoded credentials, keys, URLs or test passwords.** Everything comes from env files (§6). `.env` is never committed.
5. **All backend interaction goes through `src/services/`.** Not a single Supabase call, `fetch`, or other network request anywhere else.
6. **State that must survive a page switch lives in `src/state/`** (Zustand store). State that may reset on page switch stays local (`useState`).
7. **Data from a service call that is needed on more than one page is saved into a store** in `src/state/`; pages then read it from the store.
8. **Everything is typed.** TypeScript strict, no `any`, no unexplained `as` casts (§4).
9. **Use the base components** in `src/components/primitives/`. Extend them; do not bypass them with raw `View`/`Text`/`Pressable` in pages.
10. **No user-facing text hardcoded in JSX.** All UI strings go through i18n (`t('key')`), in Dutch **and** English (§10.3).
11. **Security is server-side.** Hiding a button is UX, not security. Every permission is enforced by Supabase Row Level Security (§7).
12. **Commit small and often, locally. Never push, never open PRs** (§14).

---

## 1. Project context

**What we build:** a React Native forms app, comparable to Google Forms, for assigned forms.

- **Admins** create and manage forms with every useful Google Forms option (sections, branching, all question types, validation, settings), publish them, **assign** them to users, and review the responses.
- **Users** log in, see only the forms **assigned to them**, fill them in (progress is saved), and submit them.

**Course context (UCLL – Mobile Applications, 2026-2027):**

- The app must solve a real issue, run on **iOS and Android**, fully work, and be **E2E tested**. It must use the starter codebase and its guidelines.
- Delivery order: **PWA first** (assignment 1, due **04.11.2026**), then the **native app** for Android and iOS (assignment 2, final version due **31.12.2026**). Pitch + video due 09.01.2027, exam January 2027.
- Components and UI must not need to change when moving from PWA to native, so keep them reusable, complete and free of business logic from day one. Do not use web-only APIs in shared code.
- Henry works **solo** on this project.

**Tech stack (decided; do not swap or add alternatives):**

| Concern | Choice |
| --- | --- |
| Framework | **Expo, managed workflow** (SDK 52, React Native 0.76, New Architecture on, React 18) |
| Language | **TypeScript** for all app code (`app/`, `src/`: `.ts`/`.tsx`). Only config files (`babel.config.js`, `metro.config.js`, `cypress.config.js`) are JS |
| Routing | **Expo Router** (file-based, `app/`, typed routes). No direct `@react-navigation/*` imports; it is only used indirectly through Expo Router |
| State | **Zustand** (`create` from `zustand`). No Redux Toolkit, no `createContext` for app state, no TanStack Query |
| Styling | React Native **`StyleSheet`** inside components, values from theme tokens |
| Backend | **Supabase**: Postgres + Auth (**email/password only, accounts created by admins**) + Storage + RLS + Edge Functions (admin user management only) |
| i18n | Dutch + English, extensible (`i18next` + `react-i18next` + `expo-localization`) |
| Tests | Jest (`jest-expo`) + React Native Testing Library for unit/component tests; Cypress for E2E on web |
| Component catalogue | Storybook (`*.stories.tsx` next to each component) |
| Builds | EAS (`eas.json`: development / preview / production) for Android and iOS |

**Expo managed workflow rules**

- Do not commit `ios/` or `android/` folders and do not run `npx expo prebuild` to edit native code by hand. Native configuration goes through `app.json` / `app.config.ts` and **config plugins**.
- Install packages with `npx expo install <pkg>` so versions match the SDK. Only use libraries that work in the managed workflow (Expo modules or libraries with a config plugin).
- Native-only features (push notifications, file picker on device) must have a sensible web fallback or be clearly gated by `Platform.OS`, because the PWA ships first.

Do not add a dependency unless it clearly saves more than a couple of days of work and is actively maintained (last release < 1 year). Ask before adding anything that overlaps an existing choice.

---

## 2. Folder structure

**Keep the current folder layout.** Do not rename, move or remove existing folders. Add new folders only where a logical, standard implementation needs them, inside the existing structure (mainly under `src/`). Unused folders stay.

```
app/                         # Routes only (Expo Router). Thin pages, no styles.
  _layout.tsx                # Root: providers, i18n init, session bootstrap, splash
  login.tsx
  (app)/                     # Authenticated area (guarded in its _layout)
    _layout.tsx
    index.tsx                # Redirects to the right home based on role
    admin/…                  # Admin-only routes (§9)
    user/…                   # User routes (§9)
src/
  components/
    primitives/              # Base UI building blocks (Text, Stack, InputField, …) + stories
    <Name>.tsx               # Composed components (FormCard, QuestionEditor, …) + stories
  services/                  # ALL backend interaction. Supabase client lives here.
  state/                     # Zustand stores for cross-page state (use<Name>Store.ts)
  types/                     # Domain models, DB row types, enums, generated Supabase types
  hooks/                     # Custom hooks that glue pages to stores/services
  theme/                     # Design tokens: colors, spacing, typography, radii
  i18n/                      # i18n setup + locales/nl.json, locales/en.json
  constants/                 # testIds.ts, routes.ts
  config/                    # env.ts (validated access to EXPO_PUBLIC_* variables)
  utils/                     # Pure helpers (formatting, validation, branching logic)
supabase/
  migrations/                # SQL migrations, timestamped, committed
  functions/                 # Edge Functions (server-side, Deno): admin-create-user, admin-reset-password
  tests/                     # SQL/RLS tests
  seed.sql                   # Dev/test seed data (no real personal data)
cypress/
  e2e/                       # *.cy.ts specs
  support/                   # commands.ts (custom commands), e2e.ts
public/                      # PWA assets (manifest icons, service worker)
```

Unit tests live next to the code they test as `<file>.test.ts(x)`.

### Naming conventions

- Components: `PascalCase.tsx`, one component per file, file name = component name (`FormCard.tsx`).
- Stories: `<Component>.stories.tsx` next to the component.
- Hooks: `useSomething.ts`. Stores: `use<Name>Store.ts`. Services: `<domain>Service.ts`.
- Types/interfaces/enums: `PascalCase`. Variables/functions: `camelCase`. `UPPER_SNAKE_CASE` only for true constants.
- Route files follow Expo Router conventions (`[id].tsx`, `(group)/`, `_layout.tsx`).
- Use the `@/` path alias (`@/components/primitives`) instead of `../../../`. Existing relative imports are migrated when a file is touched.
- Do not create barrel `index.ts` files in every folder. The existing ones in `primitives/`, `services/` and `types/` stay.

---

## 3. Architecture and data flow

```
Page (app/…)  ──►  custom hook (src/hooks)  ──►  store (src/state)  ──►  service (src/services)  ──►  Supabase
      │                                         ▲                                  │
      └──── renders components (props only) ────┘◄──────── mapped domain models ◄──┘
```

| Layer | May do | May NOT do |
| --- | --- | --- |
| `app/` pages | Read route params, call hooks/stores, compose components, navigate | Style anything, call Supabase, contain business logic, hold cross-page state |
| `src/components/primitives` | Render UI from props, own their styles, expose `testID` | Import services, stores, or data hooks; know about forms/users |
| `src/components/*` (composed) | Combine primitives into feature UI, local UI state (open/closed, input text) | Call services; read stores (data comes in via props) |
| `src/hooks` | Combine store + service calls for a page (`useAssignedForms`, `useFormEditor`), expose `{ data, isLoading, error, actions }` | Render UI |
| `src/state` | Hold cross-page state, call services in actions, expose selectors | Import `@supabase/supabase-js`, render UI |
| `src/services` | Talk to Supabase (DB, Auth, Storage), map rows ⇄ models, throw typed errors | Hold state, import React, navigate |
| `src/utils` | Pure functions (validation rules, branching path, formatting) | Side effects |

**Rules**

- **Presentational components** get all data and callbacks through props so they render in Storybook, unit tests and Cypress without a backend.
- **Page-local data** (shown on one page only) may be fetched by a hook that calls the service and keeps the result in `useState`. If a second page needs it, move it into a store.
- **Cross-page data** (session, profile/role, language, assigned forms, the admin's forms list, the form being edited across several pages, the in-progress draft) lives in a store. The store action calls the service and saves the result.
- After a mutation, update or refetch the affected store so every screen shows fresh data.
- Navigation params carry **ids only**, never whole objects.
- Branching and validation logic (which section comes next, is this answer valid) lives in `src/utils` as pure, unit-tested functions, shared by the fill-in screen and the admin preview. The database repeats the critical checks (§7.6).

---

## 4. TypeScript rules

From the course guidelines ("EVERYTHING IS TYPED"):

- `strict`, `noImplicitAny`, `strictNullChecks`, `noUnusedLocals`, `noUnusedParameters` stay on. `npx tsc --noEmit` must pass with zero errors.
- **No `any`.** Use `unknown` + narrowing for untrusted input (Supabase `jsonb` columns are parsed by typed parsers in `src/services/mappers`).
- **No `as` type assertions unless commented** with why it is safe. `as const` is fine. The non-null assertion `!` counts as an assertion: same rule.
- **No `never` hacks** (casting to `never` to silence errors). Exhaustive `switch` checks with a `never` variable are allowed and expected for `QuestionType`.
- Every exported function has explicit parameter and return types. Props are declared as `interface <Component>Props`.
- Types are split like the course example: `enums.ts`, `database.ts` / generated `supabase.ts` (rows, snake_case), `models.ts` (domain models, camelCase, `Date` objects). Services convert rows → models; UI only sees models.
- Question settings and answer values are **discriminated unions** on `questionType` (see §7.5), never loose objects.

> **⚙️ DEFAULT D16 – "No null".** The course slide says "No null". Default: DB row types may contain `null` (they mirror Postgres); **domain models avoid `null`** and use optional fields (`description?: string`). The existing `User | null` in `useAuthStore` stays until confirmed.

---

## 5. Components and styling

### 5.1 Where styles go

- Styles are written **inside components** with `StyleSheet.create` at the bottom of the component file.
- **Pages contain zero styling.** For layout use `Screen`, `Stack`, `Row`, `Container`, or create a component. (`app/login.tsx` currently has a `StyleSheet`: move it into a component when touching that file.)
- Components expose **variants via props** (`variant`, `size`, `gap`), not a `style` prop that lets pages inject styles. If a page needs a new look, add a variant to the component.
- **No hardcoded colours, font sizes or spacing numbers** in components: use tokens from `src/theme/`. Existing primitives with hardcoded values (`#111827`, `fontSize: 14`) or empty style objects are migrated to tokens as they are filled in.
- Layout: flexbox only (no CSS grid, float, `position: fixed`). Use `marginStart`/`marginEnd`/`paddingStart`/`paddingEnd`. Use `minHeight` instead of fixed `height` for anything with text.
- No browser APIs (`window`, `document`, `localStorage`, `alert`) in components or shared code.

> **⚙️ DEFAULT D15 – theme.** Default: light **and** dark mode via tokens + `useColorScheme()` (app.json already has `userInterfaceStyle: automatic`). Is there a style guide / Figma (colours, font, logo) to follow?

### 5.2 Component rules

- **Reuse before you create.** Check `src/components/primitives/index.ts` first. Prefer a new variant over a near-duplicate.
- Every component gets a **Storybook story** (default, loading, error, empty, disabled where relevant) and a **unit test**.
- Every component accepts an optional `testID` prop, passes it to its root, and derives ids for important children (§8.1).
- Components have **no side effects on mount** (no fetching).
- Keep components small. Split when a file grows beyond ~150 lines or does two things.
- Every screen state is designed: **loading** (`Skeleton`/`Spinner`), **empty** (`EmptyState`), **error** (message + retry), **success** (`Toast`).

### 5.3 Forms-domain components (expected set)

- Lists: `FormCard`, `FormStatusBadge`, `AssignmentCard` (due date, status).
- Fill-in: `QuestionRenderer` switching on `questionType`, with one component per type: `ShortAnswerQuestion`, `ParagraphQuestion`, `MultipleChoiceQuestion`, `CheckboxesQuestion`, `DropdownQuestion`, `LinearScaleQuestion`, `RatingQuestion`, `ChoiceGridQuestion` (single + checkbox variant), `DateQuestion`, `TimeQuestion`, `FileUploadQuestion`. Plus `SectionHeader`, `ProgressHeader`, `ConfirmationScreen`.
- Admin editor: `QuestionEditor`, `QuestionTypePicker`, `OptionListEditor` (with "Other" option and per-option "go to section"), `GridEditor`, `ScaleEditor`, `ValidationRuleEditor`, `SectionEditor` ("after section …" action), `FormSettingsPanel`, `AssignUserList`.
- Admin responses: `ResponseSummary` (per-question counts/charts), `SubmissionList`, `SubmissionDetail`.
- Accounts: `LoginForm`, `ForgotPasswordForm` (email step + code/new-password step), `ChangePasswordForm` (forced and voluntary mode), `CreateUserForm` (with password generator), `UserListItem` (role badge, reset-password action).
- Shared: `ConfirmDialog`, `OfflineBanner`, `LanguageSwitcher`.

---

## 6. Environment variables and secrets

- **Nothing secret goes in the app bundle.** Every `EXPO_PUBLIC_*` variable is readable by anyone who installs the app.
- The app only needs **public** values:

```bash
# .env.example  (committed, no real values)
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-or-anon-key>
```

- The Supabase **publishable/anon key is designed to be public** and is only safe because **RLS is on for every table and bucket** (§7). The **service_role / secret key must never appear** in the app, in env files used by the app, in Cypress, or in git. Anything needing elevated rights becomes a Supabase Edge Function or a `security definer` SQL function. Edge Functions read the service-role key from the `SUPABASE_SERVICE_ROLE_KEY` variable that Supabase injects on the server; nobody copies it anywhere.
- `.env`, `.env.local`, `.env.*.local`, `cypress.env.json` are in `.gitignore`. `.env.example` and `cypress.env.example.json` are committed with placeholders. Make sure `.gitignore` contains these before the first commit with real values.
- Read env vars **only in `src/config/env.ts`**, with **static dot access** (Expo only inlines `process.env.EXPO_PUBLIC_X` written literally). Validate at startup and throw a clear error when a value is missing:

```ts
// src/config/env.ts
function required(name: string, value: string | undefined): string {
  if (value === undefined || value === '') {
    throw new Error(`Missing environment variable ${name}. Copy .env.example to .env and fill it in.`);
  }
  return value;
}

export const env = {
  supabaseUrl: required('EXPO_PUBLIC_SUPABASE_URL', process.env.EXPO_PUBLIC_SUPABASE_URL),
  supabasePublishableKey: required(
    'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  ),
} as const;
```

- EAS builds do not see the gitignored `.env`; set the same variables as **EAS environment variables** per profile.
- Cypress credentials come from `cypress.env.json` / `CYPRESS_*` env vars, never from spec files. (The current `cypress/e2e/login.cy.ts` hardcodes `test@example.com` / `password123`: replace when touching it.)
- If a secret is ever committed, **rotate it** in Supabase and tell Henry.

---

## 7. Supabase

### 7.1 Setup checklist

1. Create a Supabase project (EU region for GDPR). Put the project URL and publishable/anon key in `.env`.
2. Install client deps with Expo: `npx expo install @supabase/supabase-js @react-native-async-storage/async-storage expo-secure-store` (plus what D11 needs).
3. Apply the migrations in `supabase/migrations/` in order:
   - `20261027000000_init_forms.sql` – tables, triggers, RLS
   - `20261027000100_storage.sql` – Storage buckets and policies
4. Authentication (Dashboard → Authentication):
   - **Email/password is the only provider.** Disable all other providers.
   - **Turn off "Allow new users to sign up".** Accounts are only created by admins (§7.8).
   - Set the minimum password length to at least 8 (matches `MIN_PASSWORD_LENGTH` in the Edge Functions and the app's validation).
   - Add redirect URLs for the web dev server and the app `scheme` (`ucllstarter://`, rename together with the app).
5. Deploy the Edge Functions: `npx supabase functions deploy admin-create-user` and `npx supabase functions deploy admin-reset-password`.
6. Create the first admin (one time, by hand): Dashboard → Authentication → Users → *Add user* (email + temporary password, auto-confirm), then in the SQL editor run
   `update public.profiles set role = 'admin' where email = '<henry's email>';`
   Log in and change the temporary password; admin rights only work after that. (Roles are **never** taken from user metadata.)
7. Generate types after every migration: `npx supabase gen types typescript --project-id <ref> > src/types/supabase.ts`.

### 7.2 The client (only place `createClient` is called)

```ts
// src/services/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
import { env } from '@/config/env';
import type { Database } from '@/types/supabase';
import { authStorage } from './authStorage';

export const supabase = createClient<Database>(env.supabaseUrl, env.supabasePublishableKey, {
  auth: {
    storage: authStorage,          // undefined on web → supabase-js uses localStorage
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

// Native apps: only refresh tokens while the app is in the foreground.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
```

- **Only `src/services/**` may import `@supabase/supabase-js` or the client.** Enforce with ESLint `no-restricted-imports`.
- Always pass the `Database` generic. Always check `error` on every response. Select only needed columns for lists.
- Before writing new Supabase code, check the current Supabase docs for Expo: recommended storage/setup details change between versions.

> **⚙️ DEFAULT D11 – session storage on native.** The course says tokens belong in secure storage, not AsyncStorage. `expo-secure-store` has a ~2 KB value limit and sessions can be larger, so the default is the **"LargeSecureStore"** pattern from the Supabase docs (encryption key in SecureStore, encrypted session in AsyncStorage). Web uses localStorage.

### 7.3 Services layout

```
src/services/
  supabase/client.ts        # the client (above)
  supabase/authStorage.ts   # platform-aware session storage adapter
  errors.ts                 # ServiceError + toServiceError(postgrestError)
  mappers/                  # row → model, model → payload, jsonb parsers
  authService.ts            # signIn, signOut, changePassword, requestPasswordReset, resetPasswordWithCode, getSession, onAuthStateChange
  profileService.ts         # getMyProfile, updateMyName
  adminUserService.ts       # listUsers, createUser / resetPassword (Edge Functions), setUserRole (RPC)
  formService.ts            # list/get/create/update/publish/archive/duplicate forms + settings
  sectionService.ts         # add/update/reorder/delete sections
  questionService.ts        # add/update/reorder/duplicate/deactivate questions
  assignmentService.ts      # assign/unassign users, list assignments
  submissionService.ts      # get-or-create draft, save answer, submit, reopen, list (admin)
  storageService.ts         # upload/delete answer files, signed URLs, question images
  index.ts
```

- Services return **domain models**, never raw rows, and throw `ServiceError` (user-friendly i18n key + `code`), never raw Supabase errors.
- Services never decide permissions themselves. RLS is the real check.
- The auth store subscribes once to `onAuthStateChange` (via `authService`). The root layout keeps the **splash screen** up until the session is restored.

### 7.4 Migrations workflow

- **Every schema change is a migration file** in `supabase/migrations/<timestamp>_<name>.sql`, committed. Never change the schema only by clicking in the dashboard.
- Never edit an applied migration; add a new one.
- Every new table or bucket: RLS + policies **in the same migration**.
- After a migration: regenerate `src/types/supabase.ts`, update mappers/models/seed, add RLS tests (§8.4).

> **⚙️ DEFAULT D12 – Supabase CLI or SQL editor?** Default: Supabase CLI (`npx supabase migration new`, `npx supabase db push`) with committed files. If Henry prefers the SQL editor, the files are still the source of truth.

### 7.5 Data model

Two roles: `admin` and `user` (`profiles.role`).

| Table | Purpose | Key columns |
| --- | --- | --- |
| `profiles` | 1 row per auth user, created by trigger | `id`, `email`, `full_name`, `role`, `must_change_password` |
| `forms` | A form | `title`, `description`, `status` (`draft`/`published`/`archived`), settings (below), `created_by`, `published_at` |
| `form_sections` | Pages of a form; every form gets one automatically | `form_id`, `title`, `description`, `order_index`, `after_action` (`next`/`goto`/`submit`), `go_to_section_id` |
| `form_questions` | Questions inside a section | `form_id`, `section_id`, `title`, `description`, `question_type`, `is_required`, `options` (jsonb), `settings` (jsonb), `image_path`, `order_index`, `is_active` |
| `form_assignments` | Which user must fill in which form | `form_id`, `user_id`, `assigned_by`, `due_at`; unique (`form_id`, `user_id`) |
| `form_submissions` | One response to an assignment | `assignment_id`, `status` (`draft`/`submitted`), `submitted_at`; max one open draft per assignment |
| `form_answers` | One answer to one question | `submission_id`, `question_id`, `value` (jsonb); unique (`submission_id`, `question_id`) |

**Form settings** (columns on `forms`, mirroring Google Forms): `is_accepting_responses`, `closes_at`, `limit_one_response` (default true), `allow_edit_after_submit`, `shuffle_question_order`, `show_progress_bar`, `confirmation_message`.

**Question types** (Google Forms set), with `options` / `settings` / answer `value` shapes. Mirror these as discriminated unions in `src/types/models.ts`:

| `question_type` | `options` | `settings` (all optional) | answer `value` |
| --- | --- | --- | --- |
| `short_answer` | – | `validation` (see below) | `"text"` |
| `paragraph` | – | `validation` (length/regex) | `"text"` |
| `multiple_choice` | `[{ id, label, goTo }]` | `hasOtherOption`, `shuffleOptions`, `goToSectionBasedOnAnswer` | `{ "optionId": "o1" }` or `{ "other": "text" }` |
| `checkboxes` | `[{ id, label }]` | `hasOtherOption`, `shuffleOptions`, `validation` (select at least/at most/exactly n) | `{ "optionIds": ["o1","o3"], "other"?: "text" }` |
| `dropdown` | `[{ id, label, goTo }]` | `shuffleOptions`, `goToSectionBasedOnAnswer` | `{ "optionId": "o2" }` |
| `linear_scale` | – | `min` (0/1), `max` (2–10), `minLabel`, `maxLabel` | `4` |
| `rating` | – | `max` (3–10), `icon` (`star`/`heart`/`thumb`) | `4` |
| `multiple_choice_grid` | `{ rows: [{id,label}], columns: [{id,label}] }` | `requireEachRow`, `limitOnePerColumn`, `shuffleRows` | `{ "<rowId>": "<colId>" }` |
| `checkbox_grid` | same as above | `requireEachRow`, `limitOnePerColumn`, `shuffleRows` | `{ "<rowId>": ["<colId>"] }` |
| `date` | – | `includeYear`, `includeTime` | `"2026-10-27"` or `"2026-10-27T14:30"` |
| `time` | – | `isDuration` | `"14:30"` or `"01:15:00"` |
| `file_upload` | – | `allowedTypes`, `maxFiles` (1/5/10), `maxFileSizeMb` | `["<storage path>", …]` |

`goTo` on an option is `null` (continue), a section id, or `"submit"`. Option, row and column ids are stable strings generated by the app (uuid), so renaming a label never breaks existing answers.

**Response validation** (`settings.validation`), like Google Forms: `{ kind: 'number' | 'text' | 'length' | 'regex' | 'checkboxCount', operator, value, errorMessage }`, e.g. number between, text contains / is email / is URL, max/min length, regex matches. Implemented in `src/utils/validation.ts` (unit-tested) and shown inline under the field.

**Design rules**

- Questions and forms are never hard-deleted once answers exist; the database blocks it. Deactivate the question (`is_active = false`) or archive the form instead.
- `created_at`/`updated_at` on every table, `updated_at` maintained by trigger. UUID primary keys. Timestamps `timestamptz`, displayed with `Intl.DateTimeFormat` in the active language.
- Uploaded files live in Supabase Storage, not in the database (§7.7).

> **⚙️ DEFAULTS on features** (adopted; Henry can change them; the migration implements them):
> - **D1 Roles:** only `admin` and `user`? Default: yes.
> - **D3 Assignment target:** individual users only, or also groups? Default: individuals.
> - **D5 Editing published forms:** Default: once a form has responses, admins can only deactivate questions or archive it; bigger changes go through "duplicate form".
> - **D7 Anonymous responses:** Default: no, every response is tied to the logged-in user (the "collect email" setting is implicit).
> - **D8 Due dates & reminders:** Default: optional `due_at`; push reminders only in the native phase.
> - **D19 Multiple admins:** Default: every admin can see and manage every form.
> - **D21 Quiz mode** (points, answer key, automatic grading, feedback): Default: not in v1.
> - **D23 File uploads:** Default: max 10 MB per file, max 10 files per question, any type the admin allows.
> - **D24 Responses for admins:** Default: summary per question + individual responses in the app; CSV export later.

### 7.6 Row Level Security and server-side rules

RLS is **on for every table and bucket**. Policies use the `security definer` helper `public.is_admin()` (with `set search_path = ''`) and `(select auth.uid())`.

| Table | Admin | User |
| --- | --- | --- |
| `profiles` | read all; change roles only via `set_user_role()` RPC | read + update own row, **only `full_name`** (column grant: nobody can make themselves admin) |
| `forms`, `form_sections` | full access | read published forms they are assigned to (and their sections) |
| `form_questions` | full access | read active questions of published forms they are assigned to |
| `form_assignments` | full access | read own |
| `form_submissions` | read all | read own; start a draft only if the form is published, accepting responses and not closed; update own drafts; reopen a submitted response only if `allow_edit_after_submit` |
| `form_answers` | read all | read own; write only while the submission is a draft and only for questions of that form |

Database-enforced rules (triggers), so the client cannot bypass them:

- New auth user → `profiles` row with role `user` and `must_change_password = true` (the course example reads the role from metadata, which would let anyone become admin).
- When a user's password changes, `must_change_password` is cleared automatically (trigger on `auth.users`). Users cannot change the flag themselves.
- While `must_change_password` is true, the user sees **no form data at all** (`public.has_active_password()` in the assignments policy, which every other user policy goes through) and `public.is_admin()` returns false, so a first-time password never gives admin rights.
- Every new form gets a first section.
- A question's section must belong to the same form.
- Answer `value` must have the right JSON shape for the question type.
- "Limit to 1 response": a second submission for the same assignment is rejected.
- Submitting fails if a required active question **in a section the user actually visited** (following the branching) has no answer; sets `submitted_at`.
- Reopening clears `submitted_at`.

The draft migrations were run on Postgres 16 with stubbed Supabase auth/storage and checked for: role escalation blocked, first-time-password lockout and its release after a password change, users only see assigned published forms, cross-form answers rejected, wrong answer shapes rejected, branching-aware required check, limit-one-response, reopen only when allowed, storage folders isolated per user, and a second user sees nothing.

When you add a feature, write the policy first and test it as a non-admin (§8.4).

### 7.7 Storage

- `form-uploads` (private): answer files. Path `<user_id>/<submission_id>/<question_id>/<file>`. Users manage only their own folder; admins can read all.
- `form-media` (private): question images uploaded by admins. Path `<form_id>/<question_id>/<file>`. Admins write; every signed-in user reads.
- Show files with **signed URLs** from `storageService`, never public URLs. Validate type and size in the app before uploading.

### 7.8 Accounts and auth flow

**Decided:** there is no public sign-up. **Admins create accounts** and give the user a first-time password. On first login the user is **immediately forced to change it**.

**Creating and resetting accounts (admin)**

- Admin screen `admin/users` → "New user" form: full name, email, role (`user`/`admin`), first-time password (with a "generate" button and a copy action so the admin can pass it on).
- The app calls `adminUserService.createUser()`, which invokes the **`admin-create-user` Edge Function** (`supabase/functions/admin-create-user/`). The function:
  1. checks the caller is an admin, using the caller's own JWT and `public.is_admin()`;
  2. creates the auth user with the service-role key (`email_confirm: true`, so no confirmation mail);
  3. sets the role if `admin` was chosen.
  The profile is created by the trigger with `must_change_password = true`.
- "Reset password" on a user calls the **`admin-reset-password` Edge Function**: it sets a new first-time password and turns `must_change_password` back on.
- Changing roles later uses the `set_user_role()` RPC.
- Creating users **never** happens in the app with the service-role key, and never through `supabase.auth.signUp`.
- The admin hands over the first-time password outside the app.

**Forgot password (self-service, user and admin)**

Henry asked that a reset-password flow exists. Assumption: users get a self-service "forgot password" flow **and** admins keep the admin reset above. Both exist.

- Login screen → "Forgot password?" → `forgot-password` screen: enter email → `authService.requestPasswordReset(email)` (`supabase.auth.resetPasswordForEmail`). Always show the same neutral message ("If this address has an account, you'll get an email"), so the screen does not reveal which emails exist.
- The email contains a **6-digit recovery code** instead of a link, so the same flow works on web and native without deep-link setup: in Supabase → Authentication → Email Templates → *Reset Password*, include `{{ .Token }}` (Dutch + English text).
- The user enters code + new password (+ confirmation) on the same screen → `authService.resetPasswordWithCode(email, code, newPassword)`: `supabase.auth.verifyOtp({ email, token, type: 'recovery' })`, then `supabase.auth.updateUser({ password })`. The user is then logged in and routed normally. The password-change trigger also clears `must_change_password`.
- Errors (wrong/expired code, weak password, rate limit) are shown inline with translated messages and a "send new code" action.
- Supabase's built-in mail service has a very low rate limit and is meant for testing. Before real users use the app, configure **custom SMTP** in Supabase (Authentication → SMTP).

**Login and first-time password change (user and admin)**

- **Email + password only** (`authService.signIn`). Silent token refresh is handled by supabase-js.
- `app/_layout.tsx` restores the session (splash screen stays visible), then loads the `profile` (including `mustChangePassword`) into `useAuthStore`.
- Route guards, in order:
  1. No session → `<Redirect href="/login" />`.
  2. Session and `profile.mustChangePassword` → `<Redirect href="/change-password" />`. **No other screen is reachable**, including deep links. The only other action on that screen is "log out".
  3. Otherwise → route by role (`/admin` or `/user`). Admin routes also check the role in their `_layout.tsx`. This is UX only: RLS is the real guard.
- `change-password` screen: new password + confirmation, with inline validation (minimum length, the two fields match, must differ from the current password). It calls `authService.changePassword()` (`supabase.auth.updateUser({ password })`), then reloads the profile. The database clears the flag itself; the app never writes `must_change_password`.
- Users can also change their password later from Profile (same component, not forced).
- Logout clears every store with user data (`resetAll()` on each store).
- Login screens: few fields, clear error messages, correct `textContentType`/`autoComplete` (`password` / `newPassword`)/`keyboardType`.

---

## 8. Testing

Henry wants **full testing with as much coverage as possible**. Every feature ships with unit tests, component tests, E2E tests and, for database changes, RLS tests.

### 8.1 testID convention (for Cypress E2E)

- **Every interactive element** and **every element a test asserts on** (titles, error messages, empty states, toasts, list containers) has a `testID`.
- Format: **kebab-case `<screen-or-component>-<element>[-<qualifier>]`**
  - `login-email-input`, `login-submit-button`, `login-error-text`
  - `admin-forms-list`, `admin-forms-create-button`
  - `form-card-<formId>`, `question-<questionId>-input`, `question-<questionId>-option-<optionId>`
  - `form-fill-next-button`, `form-fill-submit-button`, `form-fill-progress`
- Dynamic ids use the **record id**, never the array index.
- Ids are constants in `src/constants/testIds.ts` (`as const` object + helper functions for dynamic ids), imported by components **and** Cypress specs.
- Reusable components accept `testID` and derive child ids (`${testID}-input`, `${testID}-error`).
- On web, React Native Web renders `testID` as `data-testid`. Cypress selects with `cy.getByTestId(...)` (custom command in `cypress/support/commands.ts`). Never select by text, class or DOM structure (text changes per language).
- The existing ids `email-input`, `password-input`, `login-button` are renamed to the convention together with the login spec.

### 8.2 Unit and component tests (Jest)

- Tooling: `jest-expo` preset + `@testing-library/react-native`. Tests next to the file: `<file>.test.ts(x)`.
- Test: utils (validation, branching path, formatting), mappers/parsers, services (Supabase client mocked), stores (services mocked), hooks, and **every component** (renders, variants, interactions, accessibility labels).
- Never call the real Supabase from unit tests. One behaviour per test; test behaviour, not implementation.
- **Coverage thresholds** in the Jest config (fail the run below them): 80% lines/branches overall, 90% for `src/utils`, `src/services`, `src/state`. Raise them over time, never lower them to make a change pass.

### 8.3 E2E tests (Cypress)

- Run against the web build: `npm run web`, then `npm run cypress:run` (baseUrl `http://localhost:8081`).
- Coverage: a **smoke test per page** (it loads, main content appears) plus every critical flow:
  - auth: login valid/invalid, logout, role-based redirect, first login forces the password change (no other page reachable, deep link included), changed password works on next login, forgot-password screen (neutral message, invalid code error);
  - admin users: create a user with a first-time password, duplicate email error, reset a password, change a role;
  - admin: create form, add a question of **every type**, sections + branching, validation rules, settings, publish, assign, duplicate, archive, view responses and summary;
  - user: sees only assigned forms, fills in every question type, draft is kept after reload, branching skips sections, validation messages, required fields, submit, confirmation message, limit-one-response, edit-after-submit when allowed, cannot open an unassigned form by URL;
  - i18n: switch language and check a page renders in both languages.
- Tests use dedicated **test accounts** (one admin, two users, all with `must_change_password = false`) from `cypress.env.json`, and unique names (`E2E form <timestamp>`, `e2e+<timestamp>@…`) so runs are repeatable. Accounts created by tests use unique e-mails and are cleaned up by resetting the test project's seed data (the app itself cannot delete auth users).
- Edge Functions get their own tests (Deno test or the Supabase CLI's local functions server) for: non-admin caller rejected, invalid input rejected, success path.
- For every bug you fix, first add the test that would have caught it.

> **⚙️ DEFAULT D14 – which Supabase does E2E hit?** Default: a separate Supabase *test/dev* project with seeded test users (not production). Alternative: local Supabase via the CLI (needs Docker).

### 8.4 Database (RLS) tests

- Every policy and trigger gets SQL tests in `supabase/tests/` (pgTAP via `npx supabase test db`, or plain SQL scripts if the CLI is not used, D12): run as admin, as the assigned user, and as an unrelated user, and assert what each can and cannot read/write.

### 8.5 Definition of done (per feature)

1. Works on **web (PWA)**, and once native exists, on **Android and iOS**.
2. Validation criteria written step by step (in the commit message body or `docs/test-plan.md`).
3. `testID`s on all interactive/asserted elements; Cypress covers the flow.
4. Unit/component tests written; coverage thresholds pass.
5. Storybook stories for new components.
6. Loading, empty and error states exist.
7. All strings in `nl.json` **and** `en.json`.
8. RLS policies exist and were tested with a non-admin account.
9. `npx tsc --noEmit` passes, no `console.log`, no styles in pages.
10. Tested on a real phone, not only the desktop browser.

### 8.6 Platform testing (native phase)

- Test on at least one iPhone, one iPad (one is available in the UCLL library) and one or two Android devices from different manufacturers, including an older/budget one.
- Check the Android hardware back button while filling in a form (no lost answers, no unexpected exit).

---

## 9. Navigation (Expo Router)

Proposed routes (screen list still to be confirmed with Henry):

```
app/login.tsx                                   # login (no sign-up)
app/change-password.tsx                         # forced first-login password change
app/forgot-password.tsx                         # request code + set new password
app/(app)/_layout.tsx                           # auth + must-change-password guard
app/(app)/index.tsx                             # redirect by role
app/(app)/admin/_layout.tsx                     # admin guard + tabs
app/(app)/admin/forms/index.tsx                 # forms (filter by status)
app/(app)/admin/forms/new.tsx
app/(app)/admin/forms/[formId]/edit.tsx         # sections + questions
app/(app)/admin/forms/[formId]/settings.tsx
app/(app)/admin/forms/[formId]/preview.tsx      # fill-in view without saving
app/(app)/admin/forms/[formId]/assign.tsx
app/(app)/admin/forms/[formId]/responses.tsx    # summary + list
app/(app)/admin/submissions/[submissionId].tsx
app/(app)/admin/users/index.tsx                 # users, roles, reset password
app/(app)/admin/users/new.tsx                   # create account with first-time password
app/(app)/user/forms/index.tsx                  # my forms (to do / submitted)
app/(app)/user/forms/[assignmentId].tsx         # fill in (section by section)
app/(app)/user/forms/[assignmentId]/done.tsx    # confirmation message
app/(app)/profile.tsx                           # name, language, change password, logout
```

- Typed routes are on; route helpers live in `src/constants/routes.ts`. Params are ids only.
- Tabs for parallel sections (admin: Forms / Users / Profile; user: My forms / Profile), at the bottom (thumb zone). Keep stacks shallow (max ~4 levels). Modals for short interruptions (confirm, pick question type).
- Deep links (e.g. a reminder to a specific assignment) use the app `scheme`.

---

## 10. UX, accessibility and language

### 10.1 UX guidelines

From the course's design principles, applied to a forms app:

- **Clarity:** one main task per screen; clear hierarchy; whitespace; limited colours and fonts.
- **Consistency:** same component, same look and behaviour everywhere; familiar patterns (tab bar, pull-to-refresh, switches); icons only from `@expo/vector-icons`.
- **Remove friction:** smart defaults, correct keyboard types, visible labels (not only placeholders).
- **Progressive disclosure:** forms are filled **section by section** with a progress bar (if enabled); editors only show options relevant to the chosen question type.
- **Feedback:** pressed states, spinners on buttons, "saved" indicator for drafts, toasts on publish/submit, validation messages under the field.
- **Error prevention:** confirmation before destructive or final actions (delete, unassign, submit, archive); drafts autosave so nothing is lost.
- **Touch-friendly:** touch targets ≥ 44×44 pt / 48×48 dp; primary actions in the bottom half.
- **Performance:** `FlatList` with id-based `keyExtractor` for lists; nothing on mount that the first screen does not need.

> **⚙️ DEFAULT D9 – offline.** Default: answers autosave to Supabase as a `draft` (debounced ~1 s, like Google Forms saving progress). An `OfflineBanner` shows when there is no connection and submit is disabled. No offline queue in v1.

### 10.2 Accessibility (a11y)

- Every interactive component sets `accessibilityRole` and `accessibilityLabel` (translated), plus `accessibilityHint` when the result is not obvious.
- Contrast ≥ 4.5:1 (normal text) / 3:1 (large text). Never colour alone: errors get text and an icon.
- Respect system font scaling; flexible layouts (`minHeight`).
- Validation messages use `accessibilityLiveRegion="polite"`.
- Once per release, run log in → fill in → submit with VoiceOver/TalkBack.

### 10.3 Languages (i18n)

- Supported: **Dutch (`nl`) and English (`en`)**, built so more languages can be added by adding one locale file.
- Setup in `src/i18n/` with `i18next` + `react-i18next`; language detected with `expo-localization`; the user can override it in Profile (`LanguageSwitcher`), stored in a persisted Zustand store.
- Every user-facing string uses `t('key')`. Keys are descriptive and namespaced (`login.submitButton`, `form.fill.requiredError`). Both `nl.json` and `en.json` always contain every key; a unit test fails if a key is missing in either file.
- Use interpolation and plural rules (`t('forms.count', { count })`), never string concatenation.
- Dates, times and numbers use `Intl` with the active locale.
- Error messages from services are i18n keys, translated in the UI.

> **⚙️ DEFAULT D22 – language details.** Default: fallback language **Dutch** when the device language is neither nl nor en. Form content written by admins (titles, questions) is **not** translated; it is shown as written.

---

## 11. PWA (assignment 1)

- Build: `npx expo export -p web` → `dist/`. Run locally: `npm run web`. On campus (Eduroam blocks device ↔ laptop traffic) use a phone hotspot or `npm run tunnel`.
- Needs a valid web manifest (name, icons, theme colour, start URL) and a service worker. The current file `public/icons/sw,js` has a typo in its name (comma) and code (`waitUntill`): fix it as `public/sw.js` during PWA work.
- Develop in the browser, but **validate daily on a real phone**. Test the **production build** and "Add to Home Screen".
- Deploy options: EAS Hosting, Vercel, Netlify or GitHub Pages.

## 12. Native build and release (assignment 2)

- Target: **Android and iOS**, built with EAS from the managed project.
- EAS profiles: `development` (dev client, internal), `preview` (internal test builds), `production` (store).
- One-time: `npm i -g eas-cli`, `eas login`, `eas build:configure`, `npx expo install expo-dev-client`.
- Dev build: `eas build -p android --profile development` / `-p ios`, then `npx expo start --dev-client`.
- **Rebuild only for native changes** (new config plugin, permission, SDK bump). JS/TS changes hot-reload.
- Internal distribution: Android preview `.apk` via link/QR; iOS ad-hoc needs a paid Apple account + registered UDIDs (`eas device:create`). The lecturer must be able to install and start the app.
- **Versioning:** semantic versioning in `app.json`. Every release gets a short, user-focused entry in `CHANGELOG.md`.
- OTA updates (`eas update`) only for JS changes.
- Permissions (notifications, files/camera for uploads): ask at the moment of use, explain why first, handle "deny" gracefully, always the real OS dialog.

---

## 13. Security checklist

- HTTPS only. No secrets in the bundle; only the Supabase URL and publishable/anon key.
- RLS on every table and bucket; permissions enforced in the database.
- Session tokens in secure storage on native (D11).
- Server-side checks (constraints/triggers) for everything that matters; client validation is UX.
- No logging of passwords, tokens, emails or answers. No `console.log` in committed code.
- `.env` in `.gitignore`; `npm audit` before each release.
- GDPR: collect only what forms need; admins can delete a user's data on request; uploaded files are private.

---

## 14. Git workflow and code quality

Henry works alone, so:

- **Commit small and often** so every step is easy to revert: one logical change per commit (a component + its test + story; a migration; a service function + tests). Never mix unrelated changes in one commit.
- Commit messages: Conventional Commits (`feat: add rating question component`, `fix:`, `test:`, `refactor:`, `docs:`, `chore:`), imperative, with a short body when the why is not obvious.
- Work directly on `main` (or a local branch if Henry asks). **Do not push** and **do not create pull requests** unless Henry explicitly asks.
- If the project is not a git repository yet, run `git init` first and make sure `.gitignore` covers `node_modules/`, `.expo/`, `dist/`, `.env*` (except `.env.example`), `cypress.env.json`, `coverage/`, `ios/`, `android/`.
- Before every commit: `npx tsc --noEmit`, the unit tests for what you touched, and the relevant Cypress specs. (Add Husky + lint-staged when ESLint/Prettier are added.)
- Comments explain **why**, not what. JSDoc on exported service functions and shared hooks.
- No dead code, commented-out blocks, `console.log`, or TODOs without explanation. Do not edit generated files (`src/types/supabase.ts`) by hand.
- No `useEffect` for derived data; respect `exhaustive-deps`; always clean up listeners/subscriptions.
- Architectural decisions are recorded as short ADRs in `docs/adr/`.

---

## 15. How agents should work

1. Read this file, then the files you are about to change. Follow existing patterns.
2. **When something is unclear or not covered here, ask Henry before implementing.** Do not invent requirements. The ⚙️ DEFAULT points are rules until Henry changes them.
3. Follow `IMPLEMENTATION_PLAN.md` step by step; commit after each step.
4. Before writing code for a feature, list the components, store changes, service functions, SQL/RLS changes, translations and tests you will add.
5. Build UI as components first (with stories, tests, testIDs, translations), then wire the page.
6. Never weaken a rule in this file to make something work (disabling RLS, styling a page, calling Supabase from a component, lowering coverage). Ask instead.
7. When a convention changes with Henry's approval, update this file in the same commit.

---

## Appendix A – Decisions

**Decided by Henry (2026-10-27)**

| Topic | Decision |
| --- | --- |
| Platform | PWA for the first deadline, then a native app; **Expo managed workflow** |
| Language / routing / state | TypeScript, Expo Router, Zustand (no Redux, no Context for state) |
| Styling | React Native `StyleSheet` in components |
| Auth | Supabase **email/password only** |
| Accounts (D2) | No sign-up. Admins create accounts with a first-time password (Edge Function); first login forces a password change |
| Reset password | Self-service "forgot password" with an emailed 6-digit code, plus admin reset (assumption: Henry meant both) |
| Form features | Every useful Google Forms option (D6) |
| Testing | Full testing, as much coverage as possible (D13: Jest + RNTL + Cypress + RLS tests) |
| Release | Android and iOS |
| UI language | Dutch + English, extensible (D10) |
| Folders | Keep current layout; add only logical standard folders (D17) |
| Git | Solo: many small local commits, no pushing, no PRs (D18) |
| Responses per assignment | Google-style per-form "limit to 1 response" + "allow editing after submit" settings (replaces D4) |

**Adopted defaults (Henry can change these at any time)**

| ID | Topic | Adopted default |
| --- | --- | --- |
| D1 | Only `admin` and `user` roles? | Yes |
| D3 | Assign to individuals and/or groups? | Individuals |
| D5 | Edit forms after responses exist? | Deactivate/archive only; duplicate for big changes |
| D7 | Anonymous responses? | No |
| D8 | Due dates and reminders? | Optional due date; push reminders in native phase |
| D9 | Offline filling-in? | Online autosave drafts; no offline queue |
| D11 | Native session storage | Encrypted (LargeSecureStore pattern) |
| D12 | Supabase CLI vs SQL editor | CLI + committed migrations |
| D14 | Which Supabase for E2E | Separate test/dev project with seeded users |
| D15 | Style guide / dark mode | Tokens, light + dark; style guide unknown |
| D16 | Meaning of "No null" | `null` only in DB row types |
| D19 | Multiple admins: shared or own forms? | All admins manage all forms |
| D20 | Minimum OS versions | iOS 16+, Android API 26+ |
| D21 | Quiz mode (points, answer key, grading)? | Not in v1 |
| D22 | Fallback language; translate form content? | Fallback Dutch; form content not translated |
| D23 | File upload limits | 10 MB/file, max 10 files |
| D24 | Response export (CSV/Sheets)? | In-app summary + detail; CSV later |
