-- RLSポリシーを anon → public に変更（authenticatedユーザーも投稿可能にする）
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
