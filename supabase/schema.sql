-- LabTrail: Supabase 接続時のテーブル定義（たたき台）
-- src/types/db.ts の型と 1 対 1 で対応しています。

create table labs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  university text not null,
  description text not null default '',
  is_public boolean not null default true,     -- 研究室の存在は常に公開（将来の非公開化用に列だけ残す）
  tags text[] not null default '{}'
);

create table members (
  id uuid primary key references auth.users (id) on delete cascade,
  lab_id uuid not null references labs (id) on delete cascade,
  grade text not null,               -- 'B4' | 'M1' | 'M2' | 'D1' ... | '教員'
  role text not null default 'member' check (role in ('admin', 'member'))  -- admin = 代表者
);

-- 参加コード（外部に見せないため labs とは別テーブル。代表者だけが読める）
create table lab_join_codes (
  lab_id uuid primary key references labs (id) on delete cascade,
  code text unique not null
);

create table themes (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid not null references labs (id) on delete cascade,
  owner_id uuid not null references members (id),
  title text not null,
  summary text not null default '',
  tags text[] not null default '{}',
  visibility text not null default 'public' check (visibility in ('private', 'summary', 'public'))  -- 現在は常に public
);

create table entries (
  id uuid primary key default gen_random_uuid(),
  theme_id uuid not null references themes (id) on delete cascade,
  author_id uuid not null references members (id),
  type text not null default 'memo' check (type in ('memo', 'trouble')),   -- trouble = 相談に出した記録
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
alter table lab_join_codes enable row level security;

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
        and (t.lab_id = my_lab_id() or (l.is_public and t.visibility <> 'private' and is_public))
    )
  );

create policy "研究室メンバーは記録を追加" on entries for insert
  with check (author_id = auth.uid() and exists (select 1 from themes t where t.id = theme_id and t.lab_id = my_lab_id()));

create policy "研究室メンバーは記録を更新" on entries for update
  using (exists (select 1 from themes t where t.id = theme_id and t.lab_id = my_lab_id()));

create policy "メンバーは自分のテーマを作成" on themes for insert
  with check (owner_id = auth.uid() and lab_id = my_lab_id());

create policy "テーマ担当者はテーマを更新" on themes for update
  using (owner_id = auth.uid());

create policy "代表者は研究室を更新" on labs for update
  using (id = my_lab_id() and exists (select 1 from members m where m.id = auth.uid() and m.role = 'admin'));

create policy "代表者だけが参加コードを読める" on lab_join_codes for select
  using (lab_id = my_lab_id() and exists (select 1 from members m where m.id = auth.uid() and m.role = 'admin'));

-- ---------------------------------------------------------------
-- 研究室の作成・参加は RPC（security definer）で行う
-- ---------------------------------------------------------------
create or replace function create_lab(p_name text, p_university text, p_description text, p_tags text[], p_grade text)
returns table (lab_id uuid, code text) language plpgsql security definer as $$
declare
  v_lab uuid;
  v_code text := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
begin
  if exists (select 1 from members where id = auth.uid()) then
    raise exception 'すでに研究室に所属しています';
  end if;
  insert into labs (slug, name, university, description, tags)
    values ('lab-' || substr(gen_random_uuid()::text, 1, 6), p_name, p_university, p_description, p_tags)
    returning id into v_lab;
  insert into members (id, lab_id, grade, role) values (auth.uid(), v_lab, p_grade, 'admin');
  insert into lab_join_codes (lab_id, code) values (v_lab, v_code);
  return query select v_lab, v_code;
end $$;

-- 参加前の確認用（研究室名などだけを返す）
create or replace function lookup_lab_by_code(p_code text)
returns setof labs language sql stable security definer as $$
  select l.* from labs l join lab_join_codes c on c.lab_id = l.id where c.code = upper(p_code)
$$;

create or replace function join_lab(p_code text, p_grade text)
returns members language plpgsql security definer as $$
declare
  v_lab uuid;
  v_member members;
begin
  select lab_id into v_lab from lab_join_codes where code = upper(p_code);
  if v_lab is null then raise exception '参加コードが正しくありません'; end if;
  insert into members (id, lab_id, grade, role) values (auth.uid(), v_lab, p_grade, 'member') returning * into v_member;
  return v_member;
end $$;

-- 相談は誰でも送れる（スパム対策は Edge Function / captcha で別途）、読めるのはテーマ担当者のみ
create policy "誰でも相談を送信" on consult_requests for insert with check (true);
create policy "担当者のみ相談を閲覧" on consult_requests for select
  using (exists (select 1 from themes t where t.id = theme_id and t.owner_id = auth.uid()));

-- 画像は Storage の "attachments" バケットに {lab_id}/{entry_id}/{file} で保存する想定
