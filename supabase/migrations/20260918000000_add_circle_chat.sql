create table if not exists public.circle_messages (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(btrim(content)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists circle_messages_circle_created_idx on public.circle_messages(circle_id, created_at);
alter table public.circle_messages enable row level security;
grant select, insert, delete on public.circle_messages to authenticated;

drop policy if exists "Members can view circle messages" on public.circle_messages;
create policy "Members can view circle messages" on public.circle_messages
for select to authenticated
using (private.is_circle_member(circle_id, auth.uid()));

drop policy if exists "Members can send circle messages" on public.circle_messages;
create policy "Members can send circle messages" on public.circle_messages
for insert to authenticated
with check (
  sender_id = auth.uid()
  and private.is_circle_member(circle_id, auth.uid())
  and exists (
    select 1 from public.circles c
    where c.id = circle_messages.circle_id and c.chat_enabled = true
  )
);

drop policy if exists "Users can delete their own circle messages" on public.circle_messages;
create policy "Users can delete their own circle messages" on public.circle_messages
for delete to authenticated
using (sender_id = auth.uid());

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'circle_messages'
  ) then
    alter publication supabase_realtime add table public.circle_messages;
  end if;
end
$$;
