-- LabTrail: Supabase 接続時のテーブル定義（たたき台）
-- src/types/db.ts の型と 1 対 1 で対応しています。

create table labs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  university text not null,
  description text not null default '',
  is_public boolean not null default false,
  tags text[] not null default '{}'
);

create table members (
  id uuid primary key references auth.users (id) on delete cascade,
  lab_id uuid not null references labs (id) on delete cascade,
  grade text not null,               -- 'B4' | 'M1' | 'M2' | 'D1' ... | '教員'
  role text not null default 'member' check (role in ('admin', 'member'))
);

create table themes (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid not null references labs (id) on delete cascade,
  owner_id uuid not null references members (id),
  title text not null,
  summary text not null default '',
  tags text[] not null default '{}',
  visibility text not null default 'private' check (visibility in ('private', 'summary', 'public'))
);

create table entries (
  id uuid primary key default gen_random_uuid(),
  theme_id uuid not null references themes (id) on delete cascade,
  author_id uuid not null references members (id),
  type text not null check (type in ('progress', 'trouble', 'achievement', 'memo')),
  body text not null,
  attachments jsonb not null default '[]',   -- Attachment[]
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create table consult_requests (
  id uuid primary key default gen_random_uuid(),
  theme_id uuid not null references themes (id) on delete cascade,
  entry_id uuid references entries (id) on delete set null,
  from_name text not null,
  from_affiliation text not null,
  from_email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create index on themes using gin (tags);
create index on labs using gin (tags);
create index on entries (theme_id, created_at desc);
create index on entries (author_id, created_at desc);

-- ---------------------------------------------------------------
-- RLS: src/lib/api.ts の isLabVisible / isThemeVisible / isEntryVisible と同じルール
-- ---------------------------------------------------------------
alter table labs enable row level security;
alter table members enable row level security;
alter table themes enable row level security;
alter table entries enable row level security;
alter table consult_requests enable row level security;

create or replace function my_lab_id() returns uuid language sql stable security definer as $$
  select lab_id from members where id = auth.uid()
$$;

create policy "公開研究室 or 自分の研究室" on labs for select
  using (is_public or id = my_lab_id());

create policy "同じ研究室のメンバー" on members for select
  using (lab_id = my_lab_id());

create policy "公開テーマ or 自分の研究室" on themes for select
  using (
    lab_id = my_lab_id()
    or (visibility <> 'private' and exists (select 1 from labs l where l.id = lab_id and l.is_public))
  );

create policy "公開記録 or 自分の研究室" on entries for select
  using (
    exists (
      select 1 from themes t join labs l on l.id = t.lab_id
      where t.id = theme_id
        and (t.lab_id = my_lab_id() or (l.is_public and t.visibility = 'public' and is_public))
    )
  );

create policy "研究室メンバーは記録を追加" on entries for insert
  with check (author_id = auth.uid() and exists (select 1 from themes t where t.id = theme_id and t.lab_id = my_lab_id()));

create policy "研究室メンバーは記録を更新" on entries for update
  using (exists (select 1 from themes t where t.id = theme_id and t.lab_id = my_lab_id()));

create policy "テーマ担当者は公開範囲を更新" on themes for update
  using (owner_id = auth.uid());

create policy "管理者は研究室を更新" on labs for update
  using (id = my_lab_id() and exists (select 1 from members m where m.id = auth.uid() and m.role = 'admin'));

-- 相談は誰でも送れる（スパム対策は Edge Function / captcha で別途）、読めるのはテーマ担当者のみ
create policy "誰でも相談を送信" on consult_requests for insert with check (true);
create policy "担当者のみ相談を閲覧" on consult_requests for select
  using (exists (select 1 from themes t where t.id = theme_id and t.owner_id = auth.uid()));

-- 画像は Storage の "attachments" バケットに {lab_id}/{entry_id}/{file} で保存する想定
