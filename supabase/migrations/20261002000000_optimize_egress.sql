create index if not exists posts_created_at_id_idx
on public.posts (created_at desc, id desc);

create index if not exists posts_circle_created_at_id_idx
on public.posts (circle_id, created_at desc, id desc);

create index if not exists posts_user_created_at_id_idx
on public.posts (user_id, created_at desc, id desc);

create index if not exists comments_post_created_at_idx
on public.comments (post_id, created_at asc);

create index if not exists circle_messages_circle_created_at_id_idx
on public.circle_messages (circle_id, created_at desc, id desc);

create index if not exists comments_user_id_idx
on public.comments (user_id);

create or replace view public.post_like_counts
with (security_invoker = true)
as
select
  post_id,
  count(*)::integer as like_count
from public.post_likes
group by post_id;

grant select on public.post_like_counts to authenticated;

update storage.buckets
set file_size_limit = 4194304
where id = 'posts';

update storage.buckets
set file_size_limit = 1048576
where id = 'profile-pictures';
