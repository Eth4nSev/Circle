create or replace function public.claim_push_token(
  p_token text,
  p_platform text,
  p_preferences jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_token is null or length(trim(p_token)) = 0 then
    raise exception 'Push token is required';
  end if;

  insert into public.push_tokens (
    token,
    user_id,
    platform,
    preferences,
    updated_at
  )
  values (
    p_token,
    auth.uid(),
    coalesce(nullif(trim(p_platform), ''), 'unknown'),
    coalesce(p_preferences, '{}'::jsonb),
    now()
  )
  on conflict (token) do update
  set
    user_id = excluded.user_id,
    platform = excluded.platform,
    preferences = excluded.preferences,
    updated_at = excluded.updated_at;
end;
$$;

revoke all on function public.claim_push_token(text, text, jsonb) from public;
grant execute on function public.claim_push_token(text, text, jsonb) to authenticated;
