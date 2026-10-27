-- =============================================================
-- DRAFT – initial schema for the forms app (Google-Forms-level features).
-- Implements the decisions and defaults in AGENTS.md §7.
-- Do not apply to a shared/production project until the open decisions are confirmed.
-- Storage buckets + policies live in the next migration (…_storage.sql).
-- =============================================================

-- -------------------------------------------------------------
-- ENUMS
-- -------------------------------------------------------------
create type public.user_role as enum ('admin', 'user');
create type public.form_status as enum ('draft', 'published', 'archived');
create type public.question_type as enum (
  'short_answer', 'paragraph',
  'multiple_choice', 'checkboxes', 'dropdown',
  'linear_scale', 'rating',
  'multiple_choice_grid', 'checkbox_grid',
  'date', 'time',
  'file_upload'
);
create type public.section_after_action as enum ('next', 'goto', 'submit');
create type public.submission_status as enum ('draft', 'submitted');

-- -------------------------------------------------------------
-- HELPER: keep updated_at current
-- -------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -------------------------------------------------------------
-- TABLES
-- -------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text not null default '',
  role        public.user_role not null default 'user',
  -- Accounts are created by admins with a first-time password (see AGENTS.md §7.8).
  -- Cleared automatically when the user changes their password.
  must_change_password boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.forms (
  id                      uuid primary key default gen_random_uuid(),
  title                   text not null check (char_length(title) between 1 and 200),
  description             text,
  status                  public.form_status not null default 'draft',
  -- Google-Forms style settings
  is_accepting_responses  boolean not null default true,
  closes_at               timestamptz,
  limit_one_response      boolean not null default true,
  allow_edit_after_submit boolean not null default false,
  shuffle_question_order  boolean not null default false,
  show_progress_bar       boolean not null default true,
  confirmation_message    text,
  created_by              uuid not null references public.profiles (id),
  published_at            timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- Every form has at least one section; questions live in sections.
create table public.form_sections (
  id                 uuid primary key default gen_random_uuid(),
  form_id            uuid not null references public.forms (id) on delete cascade,
  title              text,
  description        text,
  order_index        integer not null default 0,
  -- What happens after this section (unless an answer-based jump overrides it)
  after_action       public.section_after_action not null default 'next',
  go_to_section_id   uuid references public.form_sections (id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (id, form_id)
);

create table public.form_questions (
  id             uuid primary key default gen_random_uuid(),
  form_id        uuid not null,
  section_id     uuid not null,
  title          text not null check (char_length(title) between 1 and 500),
  description    text,
  question_type  public.question_type not null,
  is_required    boolean not null default false,
  -- Choice types: [{ "id": "o1", "label": "…", "goTo": null | "<sectionId>" | "submit" }]
  -- Grid types:   { "rows": [{ "id", "label" }], "columns": [{ "id", "label" }] }
  options        jsonb,
  -- Type-specific settings: scale/rating range, validation rule, hasOtherOption,
  -- shuffleOptions, goToSectionBasedOnAnswer, file limits, date/time flags … (see AGENTS.md §7.5)
  settings       jsonb not null default '{}'::jsonb,
  image_path     text,
  order_index    integer not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- keeps form_id consistent with the section's form
  foreign key (section_id, form_id) references public.form_sections (id, form_id) on delete cascade,
  constraint form_questions_choice_options check (
    question_type not in ('multiple_choice', 'checkboxes', 'dropdown')
    or (options is not null and jsonb_typeof(options) = 'array' and jsonb_array_length(options) > 0)
  ),
  constraint form_questions_grid_options check (
    question_type not in ('multiple_choice_grid', 'checkbox_grid')
    or (options is not null
        and jsonb_typeof(options -> 'rows') = 'array' and jsonb_array_length(options -> 'rows') > 0
        and jsonb_typeof(options -> 'columns') = 'array' and jsonb_array_length(options -> 'columns') > 0)
  )
);

create table public.form_assignments (
  id           uuid primary key default gen_random_uuid(),
  form_id      uuid not null references public.forms (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  assigned_by  uuid not null references public.profiles (id),
  due_at       timestamptz,
  assigned_at  timestamptz not null default now(),
  unique (form_id, user_id)
);

create table public.form_submissions (
  id             uuid primary key default gen_random_uuid(),
  assignment_id  uuid not null references public.form_assignments (id) on delete cascade,
  status         public.submission_status not null default 'draft',
  submitted_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint form_submissions_submitted_at check (
    (status = 'submitted') = (submitted_at is not null)
  )
);

create table public.form_answers (
  id             uuid primary key default gen_random_uuid(),
  submission_id  uuid not null references public.form_submissions (id) on delete cascade,
  -- No cascade on purpose: a question (or form) that already has answers cannot be
  -- hard-deleted. Deactivate the question / archive the form instead.
  question_id    uuid not null references public.form_questions (id),
  value          jsonb not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (submission_id, question_id)
);

-- -------------------------------------------------------------
-- INDEXES (foreign keys + common filters)
-- -------------------------------------------------------------
create index on public.forms (created_by);
create index on public.forms (status);
create index on public.form_sections (form_id, order_index);
create index on public.form_sections (go_to_section_id);
create index on public.form_questions (section_id, order_index);
create index on public.form_questions (form_id);
create index on public.form_assignments (user_id);
create index on public.form_assignments (assigned_by);
create index on public.form_submissions (assignment_id);
create index on public.form_answers (question_id);
-- at most one open draft per assignment
create unique index form_submissions_one_draft on public.form_submissions (assignment_id)
  where status = 'draft';

-- -------------------------------------------------------------
-- updated_at TRIGGERS
-- -------------------------------------------------------------
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger forms_updated_at before update on public.forms
  for each row execute function public.set_updated_at();
create trigger form_sections_updated_at before update on public.form_sections
  for each row execute function public.set_updated_at();
create trigger form_questions_updated_at before update on public.form_questions
  for each row execute function public.set_updated_at();
create trigger form_submissions_updated_at before update on public.form_submissions
  for each row execute function public.set_updated_at();
create trigger form_answers_updated_at before update on public.form_answers
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------
-- ROLE HELPERS
-- -------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
      and not must_change_password  -- admins also replace their first-time password first
  );
$$;

-- Only admins may change roles. Users cannot update profiles.role directly
-- (see the column grants below).
create or replace function public.set_user_role(target_user uuid, new_role public.user_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can change roles' using errcode = '42501';
  end if;
  update public.profiles set role = new_role where id = target_user;
end;
$$;

revoke execute on function public.set_user_role(uuid, public.user_role) from public, anon;
grant execute on function public.set_user_role(uuid, public.user_role) to authenticated;

-- -------------------------------------------------------------
-- AUTO-CREATE PROFILE FOR EVERY NEW AUTH USER
-- Users are created by admins via the admin-create-user Edge Function
-- (public sign-up is disabled). The role is NEVER taken from user metadata:
-- everyone starts as 'user' with must_change_password = true.
-- -------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -------------------------------------------------------------
-- FIRST-LOGIN PASSWORD CHANGE
-- When a user's password changes, the must_change_password flag is cleared.
-- The admin-reset-password Edge Function sets it back to true afterwards.
-- -------------------------------------------------------------
create or replace function public.handle_password_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.encrypted_password is distinct from old.encrypted_password then
    update public.profiles set must_change_password = false where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_password_changed
  after update of encrypted_password on auth.users
  for each row execute function public.handle_password_change();

-- True when the signed-in user has replaced their first-time password.
create or replace function public.has_active_password()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and not must_change_password
  );
$$;

-- -------------------------------------------------------------
-- EVERY NEW FORM GETS A FIRST SECTION
-- -------------------------------------------------------------
create or replace function public.create_default_section()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.form_sections (form_id, order_index) values (new.id, 0);
  return new;
end;
$$;

create trigger forms_default_section
  after insert on public.forms
  for each row execute function public.create_default_section();

-- -------------------------------------------------------------
-- ANSWER SHAPE VALIDATION (basic; detailed rules are validated in the app)
-- -------------------------------------------------------------
create or replace function public.validate_answer_value()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  q_type public.question_type;
  is_valid boolean;
begin
  select question_type into q_type from public.form_questions where id = new.question_id;

  is_valid := case q_type
    when 'short_answer' then jsonb_typeof(new.value) = 'string'
    when 'paragraph' then jsonb_typeof(new.value) = 'string'
    when 'date' then jsonb_typeof(new.value) = 'string'
    when 'time' then jsonb_typeof(new.value) = 'string'
    when 'linear_scale' then jsonb_typeof(new.value) = 'number'
    when 'rating' then jsonb_typeof(new.value) = 'number'
    when 'multiple_choice' then jsonb_typeof(new.value) = 'object' and (new.value ? 'optionId' or new.value ? 'other')
    when 'dropdown' then jsonb_typeof(new.value) = 'object' and new.value ? 'optionId'
    when 'checkboxes' then jsonb_typeof(new.value) = 'object' and (new.value ? 'optionIds' or new.value ? 'other')
    when 'multiple_choice_grid' then jsonb_typeof(new.value) = 'object'
    when 'checkbox_grid' then jsonb_typeof(new.value) = 'object'
    when 'file_upload' then jsonb_typeof(new.value) = 'array'
    else false
  end;

  if not is_valid then
    raise exception 'Answer value does not match question type %', q_type using errcode = '22023';
  end if;
  return new;
end;
$$;

create trigger form_answers_validate_value
  before insert or update on public.form_answers
  for each row execute function public.validate_answer_value();

-- -------------------------------------------------------------
-- SECTION PATH (branching)
-- Walks the sections a submission actually visits, following
-- answer-based jumps first, then the section's after_action.
-- Used by the submit validation so skipped sections are not required.
-- -------------------------------------------------------------
create or replace function public.submission_section_path(p_submission_id uuid)
returns uuid[]
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_form_id  uuid;
  v_current  uuid;
  v_path     uuid[] := '{}';
  v_section  public.form_sections%rowtype;
  v_goto     text;
  v_target   uuid;
begin
  select a.form_id into v_form_id
  from public.form_submissions s
  join public.form_assignments a on a.id = s.assignment_id
  where s.id = p_submission_id;

  select id into v_current
  from public.form_sections
  where form_id = v_form_id
  order by order_index, created_at, id
  limit 1;

  while v_current is not null loop
    exit when v_current = any (v_path);  -- guard against loops
    v_path := v_path || v_current;

    select * into v_section from public.form_sections where id = v_current;

    -- 1. answer-based jump ("go to section based on answer")
    v_goto := null;
    select opt ->> 'goTo' into v_goto
    from public.form_questions q
    join public.form_answers ans
      on ans.question_id = q.id and ans.submission_id = p_submission_id
    cross join lateral jsonb_array_elements(q.options) opt
    where q.section_id = v_current
      and q.is_active
      and q.question_type in ('multiple_choice', 'dropdown')
      and coalesce((q.settings ->> 'goToSectionBasedOnAnswer')::boolean, false)
      and opt ->> 'id' = ans.value ->> 'optionId'
      and opt ->> 'goTo' is not null
    order by q.order_index
    limit 1;

    if v_goto = 'submit' then
      exit;
    elsif v_goto is not null then
      v_target := null;
      select id into v_target from public.form_sections
      where form_id = v_form_id and id::text = v_goto;
      if v_target is not null then
        v_current := v_target;
        continue;
      end if;
    end if;

    -- 2. the section's own "after this section" setting
    if v_section.after_action = 'submit' then
      exit;
    elsif v_section.after_action = 'goto' and v_section.go_to_section_id is not null then
      v_current := v_section.go_to_section_id;
    else
      v_target := null;
      select id into v_target
      from public.form_sections
      where form_id = v_form_id
        and (order_index, created_at, id) > (v_section.order_index, v_section.created_at, v_section.id)
      order by order_index, created_at, id
      limit 1;
      v_current := v_target;
    end if;
  end loop;

  return v_path;
end;
$$;

revoke execute on function public.submission_section_path(uuid) from public, anon, authenticated;

-- -------------------------------------------------------------
-- SUBMISSION RULES
-- -------------------------------------------------------------
-- "Limit to 1 response": only one submission per assignment.
create or replace function public.enforce_submission_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.form_assignments a
    join public.forms f on f.id = a.form_id
    where a.id = new.assignment_id and f.limit_one_response
  ) and exists (
    select 1 from public.form_submissions s where s.assignment_id = new.assignment_id
  ) then
    raise exception 'This form only accepts one response' using errcode = '23505';
  end if;
  return new;
end;
$$;

create trigger form_submissions_enforce_limit
  before insert on public.form_submissions
  for each row execute function public.enforce_submission_limit();

-- draft -> submitted only when every required active question in the
-- visited sections is answered. submitted -> draft clears submitted_at.
create or replace function public.validate_submission_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  missing_count integer;
  visited uuid[];
begin
  if new.status = 'submitted' and old.status = 'draft' then
    visited := public.submission_section_path(new.id);

    select count(*) into missing_count
    from public.form_questions q
    where q.section_id = any (visited)
      and q.is_required
      and q.is_active
      and not exists (
        select 1 from public.form_answers ans
        where ans.submission_id = new.id and ans.question_id = q.id
      );

    if missing_count > 0 then
      raise exception 'Missing % required answer(s)', missing_count using errcode = '23514';
    end if;

    new.submitted_at = now();
  elsif new.status = 'draft' and old.status = 'submitted' then
    new.submitted_at = null;
  end if;
  return new;
end;
$$;

create trigger form_submissions_validate_status
  before update on public.form_submissions
  for each row execute function public.validate_submission_status();

-- -------------------------------------------------------------
-- ROW LEVEL SECURITY
-- -------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.forms             enable row level security;
alter table public.form_sections     enable row level security;
alter table public.form_questions    enable row level security;
alter table public.form_assignments  enable row level security;
alter table public.form_submissions  enable row level security;
alter table public.form_answers      enable row level security;

-- Users may only ever change their own full_name (column-level privilege).
revoke update on public.profiles from anon, authenticated;
grant update (full_name) on public.profiles to authenticated;

-- profiles
create policy "Users read own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "Admins read all profiles" on public.profiles
  for select to authenticated using (public.is_admin());
create policy "Users update own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
create policy "Admins update profiles" on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- forms
create policy "Admins manage forms" on public.forms
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
create policy "Users read assigned published forms" on public.forms
  for select to authenticated using (
    status = 'published'
    and exists (
      select 1 from public.form_assignments a
      where a.form_id = forms.id and a.user_id = (select auth.uid())
    )
  );

-- form_sections
create policy "Admins manage sections" on public.form_sections
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
create policy "Users read sections of assigned published forms" on public.form_sections
  for select to authenticated using (
    exists (
      select 1
      from public.forms f
      join public.form_assignments a on a.form_id = f.id
      where f.id = form_sections.form_id
        and f.status = 'published'
        and a.user_id = (select auth.uid())
    )
  );

-- form_questions
create policy "Admins manage questions" on public.form_questions
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
create policy "Users read questions of assigned published forms" on public.form_questions
  for select to authenticated using (
    is_active
    and exists (
      select 1
      from public.forms f
      join public.form_assignments a on a.form_id = f.id
      where f.id = form_questions.form_id
        and f.status = 'published'
        and a.user_id = (select auth.uid())
    )
  );

-- form_assignments
create policy "Admins manage assignments" on public.form_assignments
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
-- Users with a first-time password see no assignments. Because every other user
-- policy (forms, sections, questions, submissions, answers) goes through
-- form_assignments, this blocks all form data until the password is changed.
create policy "Users read own assignments" on public.form_assignments
  for select to authenticated using (
    user_id = (select auth.uid()) and public.has_active_password()
  );

-- form_submissions
create policy "Admins read submissions" on public.form_submissions
  for select to authenticated using (public.is_admin());
create policy "Users read own submissions" on public.form_submissions
  for select to authenticated using (
    exists (
      select 1 from public.form_assignments a
      where a.id = form_submissions.assignment_id and a.user_id = (select auth.uid())
    )
  );
create policy "Users start own draft submission" on public.form_submissions
  for insert to authenticated with check (
    status = 'draft'
    and exists (
      select 1
      from public.form_assignments a
      join public.forms f on f.id = a.form_id
      where a.id = form_submissions.assignment_id
        and a.user_id = (select auth.uid())
        and f.status = 'published'
        and f.is_accepting_responses
        and (f.closes_at is null or f.closes_at > now())
    )
  );
-- Drafts can be edited/submitted. A submitted response can only be reopened
-- (set back to draft) when the form allows editing after submit.
create policy "Users update own submission" on public.form_submissions
  for update to authenticated
  using (
    exists (
      select 1
      from public.form_assignments a
      join public.forms f on f.id = a.form_id
      where a.id = form_submissions.assignment_id
        and a.user_id = (select auth.uid())
        and f.status = 'published'
        and f.is_accepting_responses
        and (f.closes_at is null or f.closes_at > now())
        and (form_submissions.status = 'draft' or f.allow_edit_after_submit)
    )
  )
  with check (
    exists (
      select 1 from public.form_assignments a
      where a.id = form_submissions.assignment_id and a.user_id = (select auth.uid())
    )
  );

-- form_answers: users can only write answers while their submission is a draft,
-- and only for questions of the same form.
create policy "Admins read answers" on public.form_answers
  for select to authenticated using (public.is_admin());
create policy "Users read own answers" on public.form_answers
  for select to authenticated using (
    exists (
      select 1
      from public.form_submissions s
      join public.form_assignments a on a.id = s.assignment_id
      where s.id = form_answers.submission_id and a.user_id = (select auth.uid())
    )
  );
create policy "Users insert answers in own draft" on public.form_answers
  for insert to authenticated with check (
    exists (
      select 1
      from public.form_submissions s
      join public.form_assignments a on a.id = s.assignment_id
      join public.form_questions q on q.form_id = a.form_id
      where s.id = form_answers.submission_id
        and s.status = 'draft'
        and a.user_id = (select auth.uid())
        and q.id = form_answers.question_id
    )
  );
create policy "Users update answers in own draft" on public.form_answers
  for update to authenticated
  using (
    exists (
      select 1
      from public.form_submissions s
      join public.form_assignments a on a.id = s.assignment_id
      where s.id = form_answers.submission_id
        and s.status = 'draft'
        and a.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.form_submissions s
      join public.form_assignments a on a.id = s.assignment_id
      join public.form_questions q on q.form_id = a.form_id
      where s.id = form_answers.submission_id
        and s.status = 'draft'
        and a.user_id = (select auth.uid())
        and q.id = form_answers.question_id
    )
  );
create policy "Users delete answers in own draft" on public.form_answers
  for delete to authenticated using (
    exists (
      select 1
      from public.form_submissions s
      join public.form_assignments a on a.id = s.assignment_id
      where s.id = form_answers.submission_id
        and s.status = 'draft'
        and a.user_id = (select auth.uid())
    )
  );
