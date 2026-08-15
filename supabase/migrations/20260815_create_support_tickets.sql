create table if not exists public.support_tickets (
  ticket_number text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'OPEN' check (status in ('OPEN','IN_PROGRESS','WAITING','RESOLVED','CLOSED')),
  priority text not null default 'NORMAL' check (priority in ('LOW','NORMAL','HIGH','URGENT')),
  category text not null check (category in ('APP_ISSUE','LOGIN_ACCESS','JOB_SEARCH','MATCHING_SCORING','RESUME_DOCUMENTS','APPLICATION_TRACKING','GOOGLE_DRIVE','OTHER')),
  subject text not null check (char_length(subject) between 5 and 140),
  description text not null check (char_length(description) between 20 and 5000),
  page_url text,
  device_info text,
  user_email text not null,
  drive_file_id text,
  drive_file_url text,
  archive_sync_status text not null default 'PENDING' check (archive_sync_status in ('PENDING','COMPLETE','FAILED'))
);

create index if not exists support_tickets_created_at_idx on public.support_tickets (created_at desc);
create index if not exists support_tickets_status_idx on public.support_tickets (status);

alter table public.support_tickets enable row level security;

-- RoleBright accesses this private table only from authenticated server-side code
-- with the Supabase service-role key. No anonymous or browser-side policy is granted.
