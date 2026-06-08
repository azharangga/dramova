# Dramova Supabase Auth Setup

Jalankan SQL ini manual di Supabase SQL Editor. Jangan jalankan dari aplikasi.

## Auth Settings

- Disable email confirmation: Authentication -> Providers -> Email -> Confirm email: off.
- Login method: email + password only.
- Storage bucket name: `avatars`.

## Tables

```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 60),
  email text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_activity (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.watch_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  content_type text not null,
  platform text not null,
  content_id text not null,
  episode integer not null default 1,
  title text,
  cover_url text,
  position_seconds integer not null default 0,
  duration_seconds integer not null default 0,
  completed boolean not null default false,
  opened_at timestamptz not null default now(),
  last_watched_at timestamptz not null default now(),
  unique (user_id, content_type, platform, content_id, episode)
);
```

## Indexes

```sql
create index if not exists profiles_email_idx on public.profiles(email);
create index if not exists user_activity_user_created_idx on public.user_activity(user_id, created_at desc);
create index if not exists user_activity_type_idx on public.user_activity(activity_type);
create index if not exists watch_history_user_last_idx on public.watch_history(user_id, last_watched_at desc);
create index if not exists watch_history_user_content_idx on public.watch_history(user_id, content_type, platform, content_id);
```

## Updated At Trigger

```sql
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();
```

## Create Profile On Signup

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    name = excluded.name,
    email = excluded.email,
    avatar_url = excluded.avatar_url,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
```

## RLS

```sql
alter table public.profiles enable row level security;
alter table public.user_activity enable row level security;
alter table public.watch_history enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "activity_select_own" on public.user_activity;
create policy "activity_select_own"
on public.user_activity for select
using (auth.uid() = user_id);

drop policy if exists "activity_insert_own" on public.user_activity;
create policy "activity_insert_own"
on public.user_activity for insert
with check (auth.uid() = user_id);

drop policy if exists "watch_select_own" on public.watch_history;
create policy "watch_select_own"
on public.watch_history for select
using (auth.uid() = user_id);

drop policy if exists "watch_insert_own" on public.watch_history;
create policy "watch_insert_own"
on public.watch_history for insert
with check (auth.uid() = user_id);

drop policy if exists "watch_update_own" on public.watch_history;
create policy "watch_update_own"
on public.watch_history for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

## Storage

Buat bucket `avatars` di Supabase Storage. Jika ingin public avatar URL:

```sql
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "avatar_public_read" on storage.objects;
create policy "avatar_public_read"
on storage.objects for select
using (bucket_id = 'avatars');

drop policy if exists "avatar_upload_own_folder" on storage.objects;
create policy "avatar_upload_own_folder"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "avatar_update_own_folder" on storage.objects;
create policy "avatar_update_own_folder"
on storage.objects for update
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "avatar_delete_own_folder" on storage.objects;
create policy "avatar_delete_own_folder"
on storage.objects for delete
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```
