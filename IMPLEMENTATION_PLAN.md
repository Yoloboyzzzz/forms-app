# Implementation plan

Plan for building the forms app with an AI coding agent (Claude Code CLI). It is written to be handed to the agent as-is.

## How to use this plan (instructions for the agent)

1. **Read `AGENTS.md` first, completely.** Every step below follows its rules (styles only in components, `testID`s, i18n nl + en, services/state layering, RLS, no secrets, typed code).
2. Work through the steps **in order**. Do one step at a time.
3. **After every step, make a local git commit** with the given Conventional Commit message (adjust the wording if needed). If a step turns out to be bigger than one logical change, split it into several commits. **Never push. Never open a PR.**
4. Before each commit: `npx tsc --noEmit`, the unit tests for what you touched (`npx jest <path>`), and the relevant Cypress specs when a screen changed.
5. Steps marked **🧑 Henry** need Henry (accounts, dashboard settings, real devices). Stop and ask him, explain exactly what to do, and continue with the next step that does not depend on it.
6. At every **🏁 Milestone**, stop and give Henry a short summary: what works, how to try it, what is left, any assumption you made.
7. If something in this plan conflicts with `AGENTS.md`, `AGENTS.md` wins. If something is unclear, ask Henry instead of guessing.
8. Tick the checkboxes in this file as you finish steps, in the same commit.

Priority labels: **P1** = needed for the PWA deadline. **P2** = after the PWA deadline (native phase), unless there is time left before 04.11.

## Timeline

| Dates | Phase | Goal |
| --- | --- | --- |
| 27.10 – 28.10 | 0–1 | Setup, Supabase, foundations |
| 28.10 – 30.10 | 2–3 | Auth (login, first-login change, forgot password), admin user management |
| 30.10 – 02.11 | 4–6 | Form builder (core types), assignments, filling in, responses (basic) |
| 02.11 – 04.11 | 7 | PWA polish, full E2E run, deploy, **hand in PWA (deadline 04.11.2026)** |
| 05.11 – 30.11 | 8 | Google Forms parity: remaining question types, uploads, response summary |
| 01.12 – 20.12 | 9 | Native app: EAS builds, native features, platform testing |
| 21.12 – 31.12 | 10 | Release 1.0.0, docs, buffer. **Final deadline 31.12.2026** |

The PWA scope is tight (8 days). The **P1** set is the smallest version that fully works end to end: admins create accounts and forms with the core question types, assign them, and users fill them in and submit. Everything else is P2.

---

## Phase 0 – Project setup (P1)

- [ ] **0.1 Git.** `git init` if needed. Create `.gitignore` (node_modules, .expo, dist, web-build, coverage, .env*, !.env.example, cypress.env.json, cypress/videos, cypress/screenshots, ios/, android/). Commit the starter as-is first.
  `chore: initialise repository with course starter`
- [ ] **0.2 Add AGENTS.md and this plan** to the repo (if they are not in it yet).
  `docs: add agent guidelines and implementation plan`
- [ ] **0.3 Fix starter issues.** Rename `public/icons/sw,js` to `public/sw.js` and fix `waitUntill` → `waitUntil`. Remove the `console.log` in `app/(app)/details/[id].tsx`. Fix the `README.md` title.
  `fix: correct service worker file name and typo`
- [ ] **0.4 Dependencies.** With `npx expo install`: `@supabase/supabase-js`, `@react-native-async-storage/async-storage`, `expo-secure-store`, `expo-localization`, `expo-splash-screen`, `@react-native-community/netinfo`, `react-native-url-polyfill` (only if the current Supabase Expo guide still needs it). With npm: `i18next`, `react-i18next`, `aes-js` (for the encrypted session store; check the current Supabase docs). Dev: `jest`, `jest-expo`, `@testing-library/react-native`, `@types/jest`.
  `chore: add supabase, i18n and test dependencies`
- [ ] **0.5 Jest.** `jest.config.js` with the `jest-expo` preset, `@/` alias, coverage from `src/**`, thresholds from AGENTS.md §8.2 (80% overall; 90% for `src/utils`, `src/services`, `src/state`). Add scripts `test`, `test:watch`, `test:coverage`, `typecheck`. One sample test to prove the setup.
  `test: configure jest with coverage thresholds`
- [ ] **0.6 Cypress.** Add `cy.getByTestId` to `cypress/support/commands.ts` (+ type declaration), `cypress.env.example.json` (adminEmail, adminPassword, userEmail, userPassword, user2Email, user2Password). Make Cypress able to import `src/constants/testIds.ts`.
  `test: add cypress getByTestId command and env example`
- [ ] **0.7 Env config.** `.env.example`, `src/config/env.ts` (AGENTS.md §6) + unit test for the missing-variable error.
  `feat: add validated environment config`
- [ ] **0.8 Theme tokens.** `src/theme/` with colors (light + dark), spacing, typography, radii, and a `useTheme()` hook based on `useColorScheme()`. Unit tests.
  `feat: add theme tokens with light and dark mode`
- [ ] **0.9 i18n.** `src/i18n/` with `i18next` + `react-i18next`, `locales/nl.json` + `locales/en.json`, device language detection, fallback `nl`, and a unit test that fails when a key is missing in either file. Init it in `app/_layout.tsx`.
  `feat: add i18n with dutch and english`
- [ ] **0.10 Constants.** `src/constants/testIds.ts` (static ids + helpers for dynamic ids) and `src/constants/routes.ts`.
  `feat: add test id and route constants`
- [ ] **0.11 🧑 Henry – Supabase project.** Create the project (EU), put URL + publishable key in `.env`, turn off sign-ups, keep email/password only, minimum password length 8, set the *Reset Password* email template to include `{{ .Token }}` (nl + en text). Also create a second project (or use the same one for now) for E2E tests (AGENTS.md D14).
- [ ] **0.12 Apply database.** Apply `supabase/migrations/*` (CLI `npx supabase db push`, or the SQL editor), deploy both Edge Functions, create the first admin by hand (AGENTS.md §7.1), generate `src/types/supabase.ts`.
  `chore: generate supabase types`
- [ ] **0.13 Seed + test accounts.** `supabase/seed.sql` with demo forms (no real personal data). Create the E2E test accounts (admin, user, user2) with `must_change_password = false`, fill `cypress.env.json` locally.
  `chore: add seed data`

**Done when:** `npm run web` starts, `npm test` and `npx tsc --noEmit` pass, Supabase has the schema, types are generated.

## Phase 1 – Foundations (P1)

- [ ] **1.1 Types.** `src/types/enums.ts`, `models.ts` (discriminated unions for question options/settings/answer values, AGENTS.md §7.5), keep `database.ts` as aliases of the generated types. Replace the starter `Item`/`User` types where needed (keep files that are still referenced until they are no longer used).
  `feat: add domain types for forms`
- [ ] **1.2 Mappers + parsers.** `src/services/mappers/` for every table: row → model, model → insert/update payload, safe `jsonb` parsers (no `any`, no unexplained `as`). 100% unit-tested, including invalid JSON.
  `feat: add row mappers and jsonb parsers`
- [ ] **1.3 Supabase client.** `src/services/supabase/client.ts` + `authStorage.ts` (web: default; native: encrypted large secure store), `src/services/errors.ts` (`ServiceError` with i18n key + code). Tests for the error mapping.
  `feat: add supabase client and service errors`
- [ ] **1.4 Primitives upgrade.** Move every primitive to theme tokens, forward `testID`, `accessibilityLabel`, `accessibilityRole`; fill the empty style objects; touch targets ≥ 44/48; `minHeight` instead of `height`. Add missing stories and a unit test per primitive. Split this into a few commits (e.g. text/layout, inputs, feedback).
  `refactor: move primitives to theme tokens and add a11y props`
- [ ] **1.5 New primitives** needed later: `Button` (replaces/extends `StyledButton`: variants, loading, disabled), `TextArea`, `Select`/`Dropdown`, `Switch`, `ProgressBar`, `ConfirmDialog`, `OfflineBanner`. Story + test each.
  `feat: add button, textarea, select, switch and dialog primitives`

**Done when:** Storybook shows all primitives in light and dark mode; coverage thresholds pass.

## Phase 2 – Authentication (P1)

- [ ] **2.1 authService + profileService** (signIn, signOut, changePassword, requestPasswordReset, resetPasswordWithCode, getSession, onAuthStateChange, getMyProfile, updateMyName). Unit tests with a mocked client.
  `feat: add auth and profile services`
- [ ] **2.2 useAuthStore** rewritten for Supabase: session, profile (with `mustChangePassword`, role), loading/error, `resetAll()`. Plus `useSettingsStore` (language, persisted). Tests.
  `feat: connect auth store to supabase`
- [ ] **2.3 Bootstrap.** `app/_layout.tsx`: i18n, keep the splash screen until the session + profile are loaded, subscribe to auth changes.
  `feat: restore session on app start`
- [ ] **2.4 Guards.** `(app)/_layout.tsx`: no session → `/login`; `mustChangePassword` → `/change-password`; role redirect in `(app)/index.tsx`; admin guard in `(app)/admin/_layout.tsx`.
  `feat: add auth, password and role guards`
- [ ] **2.5 Login screen** with `LoginForm` component (move the styles out of the page), translated, new testIDs; update `cypress/e2e/login.cy.ts` (no hardcoded credentials).
  `feat: build login screen`
- [ ] **2.6 Change password** screen + `ChangePasswordForm` (forced mode: only "save" and "log out").
  `feat: force password change on first login`
- [ ] **2.7 Forgot password** screen + `ForgotPasswordForm` (email step, code + new password step, neutral message, resend).
  `feat: add forgot password with email code`
- [ ] **2.8 Profile** screen: name, language switcher, change password, logout. Tab layout for user and admin areas.
  `feat: add profile screen and tab layouts`
- [ ] **2.9 E2E auth.** Cypress specs: login valid/invalid, logout, role redirect, forced password change (using an account created in Phase 3; mark as pending until then), forgot-password screen states, language switch.
  `test: add auth e2e tests`

**Done when:** an admin and a user can log in, they land on their own area, logout works, and the forced change works for a fresh account.

## Phase 3 – Admin user management (P1)

- [ ] **3.1 adminUserService**: listUsers, createUser / resetPassword (`supabase.functions.invoke`), setUserRole (RPC). Map function error codes to i18n keys. Tests.
  `feat: add admin user service`
- [ ] **3.2 useUsersStore** (admin user list). Tests.
  `feat: add users store`
- [ ] **3.3 Users list** (`admin/users/index.tsx`) with `UserListItem` (role badge, reset password action with `ConfirmDialog` and a generated temporary password to copy), role change.
  `feat: add admin users list`
- [ ] **3.4 Create user** (`admin/users/new.tsx`) with `CreateUserForm` (name, email, role, generated or typed first-time password, copy button).
  `feat: let admins create accounts`
- [ ] **3.5 E2E**: create user → log in as that user → forced change → can log in with the new password; admin reset → forced change again. Enable the pending test from 2.9.
  `test: add admin user management e2e tests`

🏁 **Milestone A (≈ 30.10): accounts work end to end.** Show Henry.

## Phase 4 – Form builder, core (P1)

Core question types for the PWA: `short_answer`, `paragraph`, `multiple_choice`, `checkboxes`, `dropdown`, `linear_scale`, `date`. The rest is Phase 8.

- [ ] **4.1 Services**: `formService` (list, get with sections + questions, create, update title/description/settings, publish, archive, duplicate), `sectionService`, `questionService` (add, update, reorder, duplicate, deactivate/delete when no answers). Tests.
  `feat: add form, section and question services`
- [ ] **4.2 useFormsStore** (admin list) and **useFormEditorStore** (the form being edited, across editor/settings/preview pages; debounced save; dirty/saving/saved state). Tests.
  `feat: add form stores`
- [ ] **4.3 Admin forms list** (`admin/forms/index.tsx`): `FormCard`, `FormStatusBadge`, filter by status, create button, empty state.
  `feat: add admin forms list`
- [ ] **4.4 New form** (`admin/forms/new.tsx`): title + description, creates a draft and opens the editor.
  `feat: create new forms`
- [ ] **4.5 Editor shell** (`admin/forms/[formId]/edit.tsx`): form header, list of sections and questions, add question, `QuestionTypePicker` (modal), reorder (up/down buttons; drag is optional), duplicate, delete/deactivate with confirm, required toggle.
  `feat: add form editor shell`
- [ ] **4.6 QuestionEditor per core type**, one commit per type or small group: text types (+ validation rules), choice types (`OptionListEditor` with "Other" option and shuffle), `ScaleEditor`, date settings. Pure validation helpers in `src/utils/validation.ts` with full unit tests.
  `feat: add editors for text questions` / `feat: add editors for choice questions` / …
- [ ] **4.7 Sections and branching**: add/rename/delete sections, "after section" action, "go to section based on answer" per option. Pure `getNextSection()` / `getSectionPath()` in `src/utils/branching.ts`, mirroring the SQL function, with full unit tests (including loops and deleted sections).
  `feat: add sections and branching`
- [ ] **4.8 Settings page** (`settings.tsx`): accepting responses, close date, limit to 1 response, edit after submit, shuffle question order, progress bar, confirmation message.
  `feat: add form settings`
- [ ] **4.9 Preview** (`preview.tsx`): renders the fill-in components (Phase 6) without saving. Wire it up after 6.3 if needed.
  `feat: add form preview`
- [ ] **4.10 Publish / archive / duplicate** actions with confirmations and feedback.
  `feat: publish, archive and duplicate forms`
- [ ] **4.11 E2E**: create a form with each core type, sections + branching, settings, publish, archive, duplicate.
  `test: add form builder e2e tests`

## Phase 5 – Assignments (P1)

- [ ] **5.1 assignmentService** (assign many users, unassign, list per form, list mine with form + submission status). Tests.
  `feat: add assignment service`
- [ ] **5.2 Assign page** (`admin/forms/[formId]/assign.tsx`): `AssignUserList` with search, select, optional due date, unassign with confirm.
  `feat: let admins assign forms to users`
- [ ] **5.3 useAssignmentsStore** (user's assigned forms) + **My forms** page (`user/forms/index.tsx`): to do / submitted tabs, `AssignmentCard` with due date and status, pull-to-refresh, empty state.
  `feat: show assigned forms to users`
- [ ] **5.4 E2E**: user only sees assigned published forms; unassigned form by URL shows a not-found state; user2 sees nothing of user1.
  `test: add assignment e2e tests`

🏁 **Milestone B (≈ 01.11): admins can build and assign forms.** Show Henry.

## Phase 6 – Filling in (P1)

- [ ] **6.1 submissionService**: get-or-create draft, save one answer (upsert), delete answer, submit, reopen, get my submission with answers. Map DB errors (missing required, limit one response, closed form) to i18n keys. Tests.
  `feat: add submission service`
- [ ] **6.2 useFillStore**: current assignment, form, draft answers, current section, path history (back button), debounced autosave (~1 s), saving/saved/offline state. Tests (fake timers).
  `feat: add fill-in store with autosave`
- [ ] **6.3 Question renderers** for the core types (`QuestionRenderer` + one component per type), each with validation messages, a11y labels, testIDs, stories and tests.
  `feat: add question renderers for core types`
- [ ] **6.4 Fill page** (`user/forms/[assignmentId].tsx`): section by section, `ProgressHeader`, next/back following branching, validation before next, submit with confirm, `OfflineBanner` (NetInfo) disables submit offline.
  `feat: fill in forms section by section`
- [ ] **6.5 Confirmation page** (`done.tsx`) with the form's confirmation message; "edit response" when allowed; "submit another" never (limit one) unless the setting is off.
  `feat: add submission confirmation`
- [ ] **6.6 E2E**: fill every core type, draft survives reload, branching skips a section, required/validation errors, submit, cannot submit twice, edit after submit when allowed, closed form blocked.
  `test: add fill-in e2e tests`

## Phase 7 – Responses (basic) and PWA delivery (P1)

- [ ] **7.1 Responses page** (`admin/forms/[formId]/responses.tsx`): list of submissions (user, status, date) + `SubmissionDetail` page. A simple per-question summary (counts for choice questions) if time allows; charts are Phase 8.
  `feat: let admins view responses`
- [ ] **7.2 PWA**: web manifest (name, short name, icons, theme colour, start URL, display standalone), register `public/sw.js`, check "Add to Home Screen" works.
  `feat: add pwa manifest and service worker`
- [ ] **7.3 Polish pass**: every screen has loading/empty/error states; all strings translated (nl + en); dark mode check; a11y labels; no styles in pages (grep `StyleSheet` in `app/`); no `console.log`.
  `chore: polish pass for pwa release`
- [ ] **7.4 Full test run**: `npm run typecheck`, `npm run test:coverage` (thresholds pass), full Cypress run against `npx expo export -p web` served locally. Fix what fails, one commit per fix.
  `test: full test run for pwa`
- [ ] **7.5 🧑 Henry – real phone check**: open the PWA on a phone (hotspot / tunnel on campus), install it on the home screen, run the main flow.
- [ ] **7.6 Deploy** the `dist/` build (EAS Hosting, Vercel or Netlify; ask Henry which). Set the env vars there. `CHANGELOG.md` entry `0.1.0`, version `0.1.0` in `app.json`, local tag `v0.1.0`.
  `chore: release pwa 0.1.0`

🏁 **Milestone C – PWA deliverable (deadline 04.11.2026, 23:59).** Give Henry: the URL, the test accounts to share with the lecturer, and the list of what is P2.

## Phase 8 – Google Forms parity (P2, November)

- [ ] **8.1** `rating` and `time` question types (editor + renderer + tests).
- [ ] **8.2** `multiple_choice_grid` and `checkbox_grid` (`GridEditor`, `ChoiceGridQuestion`, require each row, one per column).
- [ ] **8.3** Question images (`form-media` bucket) and `storageService` (signed URLs).
- [ ] **8.4** `file_upload` question type (`form-uploads` bucket): web file input now, native picker in Phase 9; type/size/count limits; admin download via signed URL.
- [ ] **8.5** Response summary with charts per question type (counts, percentages, scale averages), filters.
- [ ] **8.6** Shuffle question order / option order, "Other" option everywhere it applies, all validation rule kinds.
- [ ] **8.7** Dark mode and a11y review on every screen; VoiceOver/TalkBack run of the main flow (🧑 Henry for devices).
- [ ] **8.8** SQL/RLS tests in `supabase/tests/` for every policy and trigger (admin, assigned user, unrelated user, first-time-password user).
- [ ] **8.9** E2E for all new types. Release `0.2.0` (PWA redeploy).

Each item is its own set of small commits (`feat:` + `test:`).

## Phase 9 – Native app (P2, December)

- [ ] **9.1 🧑 Henry – accounts**: Expo account, EAS login, Apple developer account (for iOS device builds) if available.
- [ ] **9.2 EAS setup**: `eas build:configure`, `expo-dev-client`, app name/slug/scheme/bundle ids in `app.json`, icons + splash, EAS environment variables per profile.
  `chore: configure eas builds`
- [ ] **9.3 Development builds** for Android and iOS; run the app on real devices with `npx expo start --dev-client`.
- [ ] **9.4 Native session storage**: verify the encrypted session store on both platforms (log in, kill the app, reopen, still logged in).
- [ ] **9.5 Native inputs**: date/time pickers (`@react-native-community/datetimepicker` via `npx expo install`), file upload with `expo-document-picker` / `expo-image-picker` (permissions asked at the moment of use, with an explanation).
- [ ] **9.6 Android back button** while filling in (confirm before leaving, keep the draft); keyboard handling (`KeyboardAvoidingView`), safe areas.
- [ ] **9.7 Due-date reminders (D8)**: push notifications with `expo-notifications` (permission asked when relevant, deep link to the assignment). Ask Henry before starting, since it needs a server-side sender (scheduled Edge Function).
- [ ] **9.8 Platform testing**: iPhone, iPad (UCLL library), two Android devices including an older one; performance check on lists; VoiceOver/TalkBack.
- [ ] **9.9 Preview builds** (`eas build --profile preview`) for Android (.apk) and iOS (ad hoc), shared with testers / the lecturer.

## Phase 10 – Release 1.0.0 (P2, by 31.12.2026)

- [ ] **10.1** Full test run (typecheck, unit + coverage, Cypress, SQL tests, manual device run).
- [ ] **10.2** Custom SMTP configured in Supabase (🧑 Henry), production project checked: RLS on everywhere, sign-ups off, no test accounts left.
- [ ] **10.3** `README.md` (install, env, run, test, build), `CHANGELOG.md` `1.0.0`, ADRs in `docs/adr/` for the main decisions.
- [ ] **10.4** Production builds for Android and iOS; version `1.0.0`; local tag `v1.0.0`.

🏁 **Milestone D – final app (deadline 31.12.2026).** Remind Henry of the pitch + video (09.01.2027).
