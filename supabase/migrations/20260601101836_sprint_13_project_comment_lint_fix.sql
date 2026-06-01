create or replace function public.create_project_comment(
  p_project_id uuid,
  p_body text,
  p_visibility text default 'partner_visible'
)
returns public.project_comments
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_comment public.project_comments%rowtype;
  v_visibility public.project_comment_visibility;
  v_author_type public.project_comment_actor_type := 'staff'::public.project_comment_actor_type;
begin
  if p_visibility not in ('partner_visible', 'internal_only') then
    raise exception 'Project comment visibility is not supported.';
  end if;

  v_visibility := p_visibility::public.project_comment_visibility;

  if length(trim(coalesce(p_body, ''))) = 0 then
    raise exception 'Project comment body is required.';
  end if;

  if v_visibility = 'internal_only' then
    if not app_private.user_can_access_project(v_actor_user_id, p_project_id, 'project_comments.create') then
      raise exception 'Project comment permission denied.';
    end if;

    if not app_private.user_can_access_project(v_actor_user_id, p_project_id, 'project_comments.internal.read') then
      raise exception 'Internal project comment permission denied.';
    end if;
    v_author_type := 'staff'::public.project_comment_actor_type;
  else
    if not app_private.user_can_access_partner_project(v_actor_user_id, p_project_id, 'project_comments.create') then
      raise exception 'Project comment permission denied.';
    end if;

    if exists (
      select 1
      from public.partner_project_sources pps
      where pps.project_id = p_project_id
        and app_private.partner_user_is_active(v_actor_user_id, pps.partner_id)
      union all
      select 1
      from public.partner_project_assignments ppa
      where ppa.project_id = p_project_id
        and ppa.status = 'active'
        and app_private.partner_user_is_active(v_actor_user_id, ppa.partner_id)
    ) then
      v_author_type := 'partner'::public.project_comment_actor_type;
    elsif app_private.user_can_access_project(v_actor_user_id, p_project_id, 'guest_messages.couple_review') then
      v_author_type := 'couple'::public.project_comment_actor_type;
    else
      v_author_type := 'staff'::public.project_comment_actor_type;
    end if;
  end if;

  insert into public.project_comments (
    project_id,
    body,
    visibility,
    author_user_id,
    author_type,
    created_by,
    updated_by
  )
  values (
    p_project_id,
    trim(p_body),
    v_visibility,
    v_actor_user_id,
    v_author_type,
    v_actor_user_id,
    v_actor_user_id
  )
  returning * into v_comment;

  return v_comment;
end;
$$;

revoke all on function public.create_project_comment(uuid, text, text) from public;
grant execute on function public.create_project_comment(uuid, text, text) to authenticated, service_role;
