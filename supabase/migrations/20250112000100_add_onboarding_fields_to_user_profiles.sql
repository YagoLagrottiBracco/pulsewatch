alter table public.user_profiles
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists onboarding_completed_at timestamptz null;

comment on column public.user_profiles.onboarding_completed is 'Indica se o usuário concluiu o onboarding guiado.';
comment on column public.user_profiles.onboarding_completed_at is 'Data/hora em que o onboarding foi concluído.';
