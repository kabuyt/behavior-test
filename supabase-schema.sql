-- ====================================================================
-- 行動選択テスト用スキーマ
-- Supabase SQL Editor で実行してください
-- プロジェクト: ajmdpkwqyeyzemeoojwd (trainee-manager と共用)
-- ====================================================================

-- 応募者情報＋回答を1レコードで保存
create table if not exists behavior_test_results (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,               -- 応募会社名（求人企業）
  candidate_name text not null,             -- 応募者氏名
  candidate_number text,                    -- 候補者番号（任意）
  job_type text default '特定技能',         -- 求人区分
  q1 smallint check (q1 between 1 and 4),
  q2 smallint check (q2 between 1 and 4),
  q3 smallint check (q3 between 1 and 4),
  q4 smallint check (q4 between 1 and 4),
  q5 smallint check (q5 between 1 and 4),
  q6 smallint check (q6 between 1 and 4),
  total_score smallint,                     -- 0-18点（内部採点）
  grade text,                               -- A/B/C/D
  duration_seconds int,                     -- 回答に要した秒数
  user_agent text,
  submitted_at timestamptz default now(),
  notes text
);

create index if not exists idx_bt_submitted on behavior_test_results (submitted_at desc);
create index if not exists idx_bt_company on behavior_test_results (company_name);

-- ====================================================================
-- スコアリング（管理者側の集計用）
-- 各設問の最良選択=3点 / 次善=2点 / 不十分=1点 / NG=0点
-- ====================================================================
create or replace function calc_behavior_score(
  q1 smallint, q2 smallint, q3 smallint,
  q4 smallint, q5 smallint, q6 smallint
) returns smallint
language sql immutable as $$
  select
    coalesce(case q1 when 1 then 1 when 2 then 0 when 3 then 2 when 4 then 3 end, 0) +
    coalesce(case q2 when 1 then 1 when 2 then 3 when 3 then 0 when 4 then 0 end, 0) +
    coalesce(case q3 when 1 then 3 when 2 then 2 when 3 then 1 when 4 then 0 end, 0) +
    coalesce(case q4 when 1 then 1 when 2 then 0 when 3 then 3 when 4 then 0 end, 0) +
    coalesce(case q5 when 1 then 0 when 2 then 2 when 3 then 3 when 4 then 2 end, 0) +
    coalesce(case q6 when 1 then 1 when 2 then 1 when 3 then 3 when 4 then 0 end, 0)
$$;

create or replace function calc_behavior_grade(score smallint)
returns text language sql immutable as $$
  select case
    when score >= 15 then 'A'
    when score >= 11 then 'B'
    when score >= 7  then 'C'
    else 'D'
  end;
$$;

-- 提出時に自動採点するトリガー
create or replace function trg_behavior_score() returns trigger
language plpgsql as $$
begin
  new.total_score := calc_behavior_score(new.q1, new.q2, new.q3, new.q4, new.q5, new.q6);
  new.grade := calc_behavior_grade(new.total_score);
  return new;
end;
$$;

drop trigger if exists behavior_score_trigger on behavior_test_results;
create trigger behavior_score_trigger
  before insert or update on behavior_test_results
  for each row execute function trg_behavior_score();

-- ====================================================================
-- Row Level Security: anon で insert のみ許可、select は管理者のみ
-- ====================================================================
alter table behavior_test_results enable row level security;

-- anon または authenticated どちらでも insert/select 可
-- （trainee-manager でログイン中だと authenticated ロールになるため public で統一）
drop policy if exists "anon can insert" on behavior_test_results;
drop policy if exists "public can insert" on behavior_test_results;
create policy "public can insert"
  on behavior_test_results for insert
  to public with check (true);

drop policy if exists "anon can read" on behavior_test_results;
drop policy if exists "public can read" on behavior_test_results;
create policy "public can read"
  on behavior_test_results for select
  to public using (true);

-- ====================================================================
-- 集計用ビュー：設問ごとの選択肢分布
-- ====================================================================
create or replace view v_behavior_question_stats as
select
  q_num,
  choice,
  count(*) as n
from (
  select 1 as q_num, q1 as choice from behavior_test_results where q1 is not null
  union all select 2, q2 from behavior_test_results where q2 is not null
  union all select 3, q3 from behavior_test_results where q3 is not null
  union all select 4, q4 from behavior_test_results where q4 is not null
  union all select 5, q5 from behavior_test_results where q5 is not null
  union all select 6, q6 from behavior_test_results where q6 is not null
) t
group by q_num, choice
order by q_num, choice;
