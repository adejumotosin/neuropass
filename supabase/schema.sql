-- NeuroPass V1 production database blueprint
-- Run in a dedicated Supabase/PostgreSQL project, then enable Auth and Storage.
-- This file intentionally contains no exam question bank. Content must be licensed before import.

create extension if not exists pgcrypto;

create type public.app_role as enum ('student','learning_coach','senior_coach','admin');
create type public.exam_type as enum ('JAMB','WAEC');
create type public.guarantee_status as enum ('active','warning','at_risk','paused','crisis_protected','fulfilled','voided','extension_eligible','refund_eligible','held');
create type public.touchpoint_status as enum ('scheduled','open','completed','escalated','cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'student',
  full_name text not null,
  age int check (age between 10 and 100),
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.student_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  exam_type public.exam_type not null default 'JAMB',
  exam_date date,
  baseline_score int check (baseline_score between 0 and 400),
  track_id text not null,
  track_start date,
  consistency_risk boolean not null default false,
  accountability_partner_contact text,
  accountability_opt_in boolean not null default false,
  school_day_overrides jsonb not null default '{}'::jsonb,
  preferred_times jsonb not null default '[]'::jsonb
);

create table public.accommodation_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  dyslexic_font boolean not null default false,
  font_size numeric not null default 16,
  line_height numeric not null default 1.55,
  letter_spacing numeric not null default 0,
  background text not null default 'standard',
  read_aloud boolean not null default true,
  karaoke boolean not null default false,
  chunked_reading boolean not null default true,
  syllable_assist boolean not null default false,
  voice_input boolean not null default false,
  visible_timer boolean not null default true,
  notifications boolean not null default true,
  low_energy_default boolean not null default false,
  reduce_motion boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.track_definitions (
  id text primary key,
  name text not null unique,
  days int not null,
  daily_hours numeric not null,
  guaranteed_minimum int not null check (guaranteed_minimum <= 395),
  realistic_target int not null check (realistic_target <= 400),
  probability_400 numeric not null check (probability_400 between 0 and 100),
  rest_days int not null,
  rest_days_source text not null default 'documented',
  active boolean not null default true,
  version int not null default 1
);

insert into public.track_definitions values
('spark','Spark',30,1.5,180,220,0,2,'documented',true,1),
('build','Build',45,2,220,260,0,4,'interpolated_config',true,1),
('rise','Rise',60,2.5,260,300,2,5,'documented',true,1),
('advance','Advance',75,3,300,330,8,7,'interpolated_config',true,1),
('elite','Elite',90,3.5,330,360,18,8,'documented',true,1),
('master','Master',120,4,360,380,35,12,'interpolated_config',true,1),
('legend','Legend',150,4.5,380,395,60,15,'interpolated_config',true,1),
('perfect','Perfect',180,5,395,400,85,18,'documented',true,1)
on conflict do nothing;

create table public.subjects (
  id text primary key,
  name text not null,
  exam_types public.exam_type[] not null default array['JAMB'::public.exam_type,'WAEC'::public.exam_type]
);

create table public.student_subjects (
  student_id uuid references public.profiles(id) on delete cascade,
  subject_id text references public.subjects(id) on delete cascade,
  primary key(student_id,subject_id)
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  subject_id text not null references public.subjects(id) on delete cascade,
  name text not null,
  power_topic boolean not null default false,
  frequency_last_10 int,
  claim_status text not null default 'modeled_estimate',
  unique(subject_id,name)
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  title text not null,
  complexity text not null check (complexity in ('simple','moderate','complex')),
  expected_minutes int not null check (expected_minutes between 1 and 20),
  see_it jsonb not null default '{}'::jsonb,
  hear_it_text text,
  recorded_audio_path text,
  recall_prompts jsonb not null default '[]'::jsonb,
  alternate_analogy text,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  exam_type public.exam_type not null,
  exam_year int,
  subject_id text not null references public.subjects(id),
  topic_id uuid references public.topics(id),
  stem text not null,
  options jsonb not null,
  correct_answer_index int not null,
  explanation text not null,
  audio_explanation_path text,
  source_reference text not null,
  license_metadata jsonb not null,
  rights_confirmed boolean not null default false,
  is_demo boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid references public.lessons(id),
  session_kind text not null,
  planned_minutes int not null,
  actual_minutes int not null default 0,
  mode text not null default 'standard',
  scheduled_for timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  compliance_credit numeric not null default 0,
  offline_created boolean not null default false
);

create table public.session_events (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.study_sessions(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  client_event_id text unique
);

create table public.emotional_checkins (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid references public.study_sessions(id) on delete set null,
  state text not null check (state in ('tired','stressed','okay','good','focused')),
  response_mode text not null,
  created_at timestamptz not null default now()
);

create table public.answers (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.questions(id),
  session_id uuid references public.study_sessions(id) on delete set null,
  chosen_answer_index int,
  correct boolean not null,
  response_ms int,
  changed_from_index int,
  flagged boolean not null default false,
  answered_at timestamptz not null default now(),
  client_event_id text unique
);

create table public.spaced_repetition_queue (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  taught_at date not null,
  cycle int not null,
  due_date date not null,
  completed_at timestamptz,
  unique(student_id,topic_id,cycle)
);

create table public.mistake_bank (
  student_id uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  wrong_count int not null default 0,
  consecutive_correct int not null default 0,
  next_due date,
  mastered boolean not null default false,
  last_answer_at timestamptz,
  primary key(student_id,question_id)
);

create table public.compliance_snapshots (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  rolling_average numeric not null,
  weekly_average numeric,
  consecutive_weeks_below_70 int not null default 0,
  guarantee_status public.guarantee_status not null,
  reason jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.score_projection_versions (
  version text primary key,
  parameters jsonb not null,
  description text not null,
  active boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.score_projections (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  model_version text not null references public.score_projection_versions(version),
  projected_score int not null check(projected_score between 0 and 400),
  guaranteed_minimum int not null check(guaranteed_minimum between 0 and 395),
  limiting_factor text,
  inputs jsonb not null,
  calculated_at timestamptz not null default now()
);

create table public.mock_exams (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  phase int not null,
  simulation_mode text not null default 'normal',
  started_at timestamptz,
  completed_at timestamptz,
  score int check(score between 0 and 400),
  total_time_seconds int,
  first_10_accuracy numeric,
  last_10_accuracy numeric,
  flagged_count int not null default 0,
  returned_to_count int not null default 0,
  changed_answer_count int not null default 0,
  changes_helped_count int not null default 0,
  subject_order jsonb not null default '[]'::jsonb
);

create table public.mock_item_telemetry (
  id bigint generated always as identity primary key,
  mock_id uuid not null references public.mock_exams(id) on delete cascade,
  question_id uuid not null references public.questions(id),
  item_order int not null,
  time_ms int,
  first_answer_index int,
  final_answer_index int,
  correct boolean,
  flagged boolean not null default false,
  returned_to boolean not null default false
);

create table public.coach_assignments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  active boolean not null default true,
  assigned_at timestamptz not null default now()
);

create table public.risk_signals (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  rule_id text not null,
  severity text not null,
  title text not null,
  trigger_evidence jsonb not null,
  recommended_response text not null,
  active boolean not null default true,
  escalated boolean not null default false,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.touchpoints (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  coach_id uuid references public.profiles(id),
  risk_signal_id uuid references public.risk_signals(id) on delete set null,
  moment text not null,
  status public.touchpoint_status not null default 'scheduled',
  channel text not null default 'text',
  scheduled_for timestamptz,
  completed_at timestamptz,
  notes text,
  escalated_to uuid references public.profiles(id)
);

create table public.coach_messages (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  client_event_id text unique,
  sent_at timestamptz not null default now()
);

create table public.guarantee_cases (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  status public.guarantee_status not null,
  exam_sitting text,
  actual_score int,
  guaranteed_minimum int,
  final_compliance numeric,
  extension_used boolean not null default false,
  eligibility_reason jsonb not null,
  evidence jsonb not null default '{}'::jsonb,
  assigned_senior_coach uuid references public.profiles(id),
  decision_notes text,
  opened_at timestamptz not null default now(),
  decided_at timestamptz
);

create table public.post_exam_outcomes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  exam_type public.exam_type not null,
  exam_date date not null,
  actual_score int not null check(actual_score between 0 and 400),
  predicted_score int not null,
  guaranteed_minimum int not null,
  prediction_error int generated always as (actual_score - predicted_score) stored,
  track_id text not null,
  final_compliance numeric not null,
  model_version text not null,
  subject_snapshot jsonb not null default '{}'::jsonb,
  topic_snapshot jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now()
);

create table public.predictive_rules (
  id text primary key,
  label text not null,
  threshold_config jsonb not null,
  response_text text not null,
  enabled boolean not null default true,
  version int not null default 1
);

create table public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  uploaded_by uuid not null references public.profiles(id),
  file_name text not null,
  rights_confirmed boolean not null,
  status text not null,
  imported_count int not null default 0,
  rejected_count int not null default 0,
  errors jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.app_config (
  key text primary key,
  value jsonb not null,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

create table public.launch_readiness (
  key text primary key,
  label text not null,
  category text not null,
  completed boolean not null default false,
  evidence text,
  completed_by uuid references public.profiles(id),
  completed_at timestamptz
);

insert into public.launch_readiness(key,label,category,completed) values
('legal_review','Nigerian consumer protection lawyer review of guarantee language','manual_precondition',false),
('coaches_staffed','Learning coaches recruited, trained and available on launch day','manual_precondition',false),
('offline_mode','Offline core study functionality and reconnect sync','build_check',false),
('dyslexia_first_ui','Dyslexia-first UI and audio support','build_check',false),
('rolling_compliance','Rolling compliance state machine','build_check',false),
('cfa_excluded','CFA excluded from V1 except waitlist','build_check',false),
('post_exam_architecture','Post-exam validation architecture present from day 1','build_check',false)
on conflict do nothing;

create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  module text not null,
  email text not null,
  created_at timestamptz not null default now(),
  unique(module,email)
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Role helper avoids repeating auth logic in every policy.
create or replace function public.current_role() returns public.app_role language sql stable security definer set search_path=public as $$
  select role from public.profiles where id=auth.uid();
$$;

alter table public.profiles enable row level security;
alter table public.student_profiles enable row level security;
alter table public.accommodation_settings enable row level security;
alter table public.student_subjects enable row level security;
alter table public.study_sessions enable row level security;
alter table public.session_events enable row level security;
alter table public.emotional_checkins enable row level security;
alter table public.answers enable row level security;
alter table public.spaced_repetition_queue enable row level security;
alter table public.mistake_bank enable row level security;
alter table public.compliance_snapshots enable row level security;
alter table public.score_projections enable row level security;
alter table public.mock_exams enable row level security;
alter table public.mock_item_telemetry enable row level security;
alter table public.coach_assignments enable row level security;
alter table public.risk_signals enable row level security;
alter table public.touchpoints enable row level security;
alter table public.coach_messages enable row level security;
alter table public.guarantee_cases enable row level security;
alter table public.post_exam_outcomes enable row level security;
alter table public.import_jobs enable row level security;
alter table public.app_config enable row level security;
alter table public.launch_readiness enable row level security;
alter table public.audit_logs enable row level security;

-- Students can see and edit their own private profile/settings.
create policy profiles_self_select on public.profiles for select using (id=auth.uid() or public.current_role() in ('admin','senior_coach'));
create policy profiles_self_update on public.profiles for update using (id=auth.uid()) with check (id=auth.uid());
create policy student_profile_self on public.student_profiles for all using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy settings_self on public.accommodation_settings for all using (user_id=auth.uid()) with check (user_id=auth.uid());

-- Reusable ownership pattern for student-generated records.
create policy sessions_own on public.study_sessions for all using (student_id=auth.uid()) with check (student_id=auth.uid());
create policy events_own on public.session_events for all using (student_id=auth.uid()) with check (student_id=auth.uid());
create policy checkins_own on public.emotional_checkins for all using (student_id=auth.uid()) with check (student_id=auth.uid());
create policy answers_own on public.answers for all using (student_id=auth.uid()) with check (student_id=auth.uid());
create policy sr_own on public.spaced_repetition_queue for all using (student_id=auth.uid()) with check (student_id=auth.uid());
create policy mistakes_own on public.mistake_bank for all using (student_id=auth.uid()) with check (student_id=auth.uid());
create policy compliance_own on public.compliance_snapshots for select using (student_id=auth.uid());
create policy projections_own on public.score_projections for select using (student_id=auth.uid());
create policy mocks_own on public.mock_exams for all using (student_id=auth.uid()) with check (student_id=auth.uid());
create policy outcomes_own on public.post_exam_outcomes for all using (student_id=auth.uid()) with check (student_id=auth.uid());

-- Assigned coaches may read only assigned students and support records. Senior coaches see escalations. Admins see all operational data.
create policy coach_assignments_visible on public.coach_assignments for select using (student_id=auth.uid() or coach_id=auth.uid() or public.current_role() in ('senior_coach','admin'));
create policy risk_visibility on public.risk_signals for select using (
  student_id=auth.uid() or public.current_role()='admin' or public.current_role()='senior_coach' or exists(select 1 from public.coach_assignments ca where ca.student_id=risk_signals.student_id and ca.coach_id=auth.uid() and ca.active)
);
create policy touchpoint_visibility on public.touchpoints for select using (
  student_id=auth.uid() or coach_id=auth.uid() or public.current_role() in ('senior_coach','admin')
);
create policy messages_visibility on public.coach_messages for select using (
  student_id=auth.uid() or sender_id=auth.uid() or public.current_role() in ('senior_coach','admin') or exists(select 1 from public.coach_assignments ca where ca.student_id=coach_messages.student_id and ca.coach_id=auth.uid() and ca.active)
);
create policy messages_insert on public.coach_messages for insert with check (
  sender_id=auth.uid() and (student_id=auth.uid() or exists(select 1 from public.coach_assignments ca where ca.student_id=coach_messages.student_id and ca.coach_id=auth.uid() and ca.active) or public.current_role() in ('senior_coach','admin'))
);
create policy guarantee_student_read on public.guarantee_cases for select using (student_id=auth.uid() or public.current_role() in ('senior_coach','admin'));

-- Admin-only configuration and imports.
create policy imports_admin on public.import_jobs for all using (public.current_role()='admin') with check (public.current_role()='admin');
create policy config_admin on public.app_config for all using (public.current_role()='admin') with check (public.current_role()='admin');
create policy readiness_admin on public.launch_readiness for all using (public.current_role()='admin') with check (public.current_role()='admin');
create policy audit_admin on public.audit_logs for select using (public.current_role()='admin');

-- Content tables are intentionally left for authenticated read + admin write policies to be added once storage/source ownership is finalized.
-- Before public launch, perform a security review of all RLS policies and guarantee-related data flows.
