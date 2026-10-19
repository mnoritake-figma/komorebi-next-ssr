-- Run once in a new Supabase project's SQL Editor.
create table public.posts (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 author text not null check (char_length(author) between 1 and 40),
 content text not null check (char_length(btrim(content)) between 1 and 280),
 created_at timestamptz not null default now()
);
create index posts_created_at_idx on public.posts(created_at desc);
create table public.likes (
 post_id uuid not null references public.posts(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 primary key(post_id, user_id)
);
alter table public.posts enable row level security;
alter table public.likes enable row level security;
create policy "Read posts" on public.posts for select to anon, authenticated using (true);
create policy "Create own posts" on public.posts for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Delete own posts" on public.posts for delete to authenticated using ((select auth.uid()) = user_id);
create policy "Read likes" on public.likes for select to anon, authenticated using (true);
create policy "Like as self" on public.likes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Unlike as self" on public.likes for delete to authenticated using ((select auth.uid()) = user_id);
grant select on public.posts, public.likes to anon;
grant select, insert, delete on public.posts, public.likes to authenticated;
