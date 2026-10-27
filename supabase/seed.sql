-- Dev/test seed data. No real personal data.
-- Run after the first admin exists (AGENTS.md §7.1). Safe to run twice.
-- Test accounts (admin, user, user2) are created in the Supabase dashboard; they are not part of this file.

do $$
declare
  v_admin   uuid;
  v_form    uuid;
  v_sec1    uuid;
  v_sec2    uuid;
  v_opt_yes uuid := gen_random_uuid();
  v_opt_no  uuid := gen_random_uuid();
begin
  select id into v_admin from public.profiles where role = 'admin' order by created_at limit 1;
  if v_admin is null then
    raise notice 'No admin yet: skipping seed.';
    return;
  end if;

  if exists (select 1 from public.forms where title = 'Demo: customer feedback') then
    return;
  end if;

  insert into public.forms (title, description, status, confirmation_message, created_by)
  values (
    'Demo: customer feedback',
    'Seed form with branching: answering "No" skips the second section.',
    'draft',
    'Thanks for your feedback!',
    v_admin
  )
  returning id into v_form;

  -- the form trigger already created the first section
  select id into v_sec1 from public.form_sections where form_id = v_form order by order_index limit 1;
  update public.form_sections set title = 'About you' where id = v_sec1;

  insert into public.form_sections (form_id, title, order_index)
  values (v_form, 'Your experience', 1)
  returning id into v_sec2;

  insert into public.form_questions (form_id, section_id, title, question_type, is_required, options, settings, order_index)
  values
    (v_form, v_sec1, 'What is your name?', 'short_answer', true, null, '{}'::jsonb, 0),
    (
      v_form, v_sec1, 'Did you use the product?', 'multiple_choice', true,
      jsonb_build_array(
        jsonb_build_object('id', v_opt_yes, 'label', 'Yes', 'goTo', null),
        jsonb_build_object('id', v_opt_no, 'label', 'No', 'goTo', 'submit')
      ),
      '{"goToSectionBasedOnAnswer": true}'::jsonb, 1
    ),
    (
      v_form, v_sec2, 'Which features did you use?', 'checkboxes', false,
      jsonb_build_array(
        jsonb_build_object('id', gen_random_uuid(), 'label', 'Reports'),
        jsonb_build_object('id', gen_random_uuid(), 'label', 'Dashboards'),
        jsonb_build_object('id', gen_random_uuid(), 'label', 'Exports')
      ),
      '{}'::jsonb, 0
    ),
    (
      v_form, v_sec2, 'How satisfied are you?', 'linear_scale', true, null,
      '{"min": 1, "max": 5, "minLabel": "Not at all", "maxLabel": "Very"}'::jsonb, 1
    ),
    (v_form, v_sec2, 'Any comments?', 'paragraph', false, null, '{}'::jsonb, 2);

  update public.forms set status = 'published', published_at = now() where id = v_form;
end;
$$;
