alter table public.profiles
  add column if not exists account_type text;

alter table public.profiles
  drop constraint if exists profiles_account_type_check;

alter table public.profiles
  add constraint profiles_account_type_check
  check (account_type is null or account_type in ('public', 'private'));

alter table public.follows
  add column if not exists status text not null default 'accepted';

alter table public.follows
  drop constraint if exists follows_status_check;

alter table public.follows
  add constraint follows_status_check
  check (status in ('pending', 'accepted'));

create index if not exists follows_following_status_idx
  on public.follows (following_id, status);

create index if not exists follows_follower_status_idx
  on public.follows (follower_id, status);

drop policy if exists "Authenticated users can view follows" on public.follows;
drop policy if exists "Users can follow other users" on public.follows;
drop policy if exists "Users can remove their follows" on public.follows;
drop policy if exists "Users can update their follows" on public.follows;
drop policy if exists "Users can view relevant follows" on public.follows;
drop policy if exists "Users can create follows" on public.follows;
drop policy if exists "Followers or targets can remove follows" on public.follows;
drop policy if exists "Targets can approve follow requests" on public.follows;

create policy "Users can view relevant follows"
on public.follows
for select
to authenticated
using (
  status = 'accepted'
  or follower_id = (select auth.uid())
  or following_id = (select auth.uid())
);

create policy "Users can create follows"
on public.follows
for insert
to authenticated
with check (
  follower_id = (select auth.uid())
  and follower_id <> following_id
  and (
    (
      status = 'accepted'
      and exists (
        select 1
        from public.profiles p
        where p.id = follows.following_id
          and p.account_type = 'public'
      )
    )
    or (
      status = 'pending'
      and exists (
        select 1
        from public.profiles p
        where p.id = follows.following_id
          and p.account_type = 'private'
      )
    )
  )
);

create policy "Followers or targets can remove follows"
on public.follows
for delete
to authenticated
using (
  follower_id = (select auth.uid())
  or (
    following_id = (select auth.uid())
    and status = 'pending'
  )
);

create policy "Targets can approve follow requests"
on public.follows
for update
to authenticated
using (
  following_id = (select auth.uid())
  and status = 'pending'
)
with check (
  following_id = (select auth.uid())
  and status = 'accepted'
);

create or replace function private.prevent_follow_identity_change()
returns trigger
language plpgsql
as $$
begin
  if new.follower_id <> old.follower_id
     or new.following_id <> old.following_id then
    raise exception 'Follow identities cannot be changed';
  end if;

  if old.status = 'accepted' and new.status <> 'accepted' then
    raise exception 'Accepted follows cannot be changed back to pending';
  end if;

  return new;
end;
$$;

drop trigger if exists follows_immutable_identities on public.follows;

create trigger follows_immutable_identities
before update on public.follows
for each row
execute function private.prevent_follow_identity_change();

drop policy if exists "Anyone can read posts" on public.posts;
drop policy if exists "Authenticated users can view posts" on public.posts;
drop policy if exists "Users can view accessible posts" on public.posts;

create policy "Users can view accessible posts"
on public.posts
for select
to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1
    from public.profiles p
    where p.id = posts.user_id
      and p.account_type = 'public'
  )
  or exists (
    select 1
    from public.follows f
    where f.follower_id = (select auth.uid())
      and f.following_id = posts.user_id
      and f.status = 'accepted'
  )
);

drop policy if exists "Authenticated users can view post likes" on public.post_likes;
drop policy if exists "Users can view likes on accessible posts" on public.post_likes;

create policy "Users can view likes on accessible posts"
on public.post_likes
for select
to authenticated
using (
  exists (
    select 1
    from public.posts p
    where p.id = post_likes.post_id
  )
);

drop policy if exists "Users can like posts" on public.post_likes;
drop policy if exists "Users can like accessible posts" on public.post_likes;

create policy "Users can like accessible posts"
on public.post_likes
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.posts p
    where p.id = post_likes.post_id
      and p.allow_reactions = true
  )
);

drop policy if exists "Users can create comments" on public.comments;
drop policy if exists "Users can create comments on accessible posts" on public.comments;

create policy "Users can create comments on accessible posts"
on public.comments
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.posts p
    where p.id = comments.post_id
      and p.allow_comments = true
  )
);

drop policy if exists "Users can send messages" on public.direct_messages;
drop policy if exists "Users can send messages to mutual followers" on public.direct_messages;

create policy "Users can send messages to mutual followers"
on public.direct_messages
for insert
to authenticated
with check (
  sender_id = (select auth.uid())
  and exists (
    select 1
    from public.follows f1
    join public.follows f2
      on f1.follower_id = f2.following_id
     and f1.following_id = f2.follower_id
    where f1.follower_id = (select auth.uid())
      and f1.following_id = direct_messages.receiver_id
      and f1.status = 'accepted'
      and f2.status = 'accepted'
  )
);

create table if not exists public.push_tokens (
  token text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null default 'unknown',
  preferences jsonb not null default
    '{"pushEnabled":true,"directMessages":true,"circleInvites":true,"likes":true,"comments":true,"followRequests":true}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists push_tokens_user_id_idx
  on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

drop policy if exists "Users can view own push tokens" on public.push_tokens;
drop policy if exists "Users can register own push tokens" on public.push_tokens;
drop policy if exists "Users can update own push tokens" on public.push_tokens;
drop policy if exists "Users can delete own push tokens" on public.push_tokens;

create policy "Users can view own push tokens"
on public.push_tokens
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Users can register own push tokens"
on public.push_tokens
for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "Users can update own push tokens"
on public.push_tokens
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Users can delete own push tokens"
on public.push_tokens
for delete
to authenticated
using (user_id = (select auth.uid()));
