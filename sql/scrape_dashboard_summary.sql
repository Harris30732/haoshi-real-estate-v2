-- 爬取任務總覽聚合 RPC：一次回一包 JSON 給 /transcripts 頁的 owner-only 總覽卡片列。
-- 供 useScrapeDashboardSummary() 呼叫。SECURITY INVOKER：聚合結果依呼叫者 RLS 自動範圍化。
-- 已於 2026-07-05 apply 至線上（Supabase project sglxyvexpdmdwfsuypvi）；此檔為版控留存。
create or replace function public.scrape_dashboard_summary()
returns json
language sql
stable
security invoker
set search_path to ''
as $function$
  with tw_today as (select (now() at time zone 'Asia/Taipei')::date as d)
  select json_build_object(
    'communities', json_build_object(
      'total',           (select count(*) from public.communities where merged_into_id is null),
      'with_data',       (select count(distinct community_id) from public.scrape_runs where status = 'passed'),
      'attempted',       (select count(distinct community_id) from public.scrape_runs),
      'never_attempted', (select count(*) from public.communities c
                          where c.merged_into_id is null
                            and not exists (select 1 from public.scrape_runs r where r.community_id = c.id))
    ),
    'runs', json_build_object(
      'passed',      (select count(*) from public.scrape_runs where status = 'passed'),
      'failed',      (select count(*) from public.scrape_runs where status = 'failed'),
      'incomplete',  (select count(*) from public.scrape_runs where status = 'incomplete'),
      'in_progress', (select count(*) from public.scrape_runs where status in ('scanning','scraping')),
      'pending',     (select count(*) from public.scrape_runs where status = 'pending')
    ),
    'requests', json_build_object(
      'waiting',   (select count(*) from public.scrape_requests where status = 'waiting'),
      'fulfilled', (select count(*) from public.scrape_requests where status = 'fulfilled'),
      'failed',    (select count(*) from public.scrape_requests where status = 'failed'),
      'deduped',   (select count(*) from public.scrape_requests where status = 'deduped'),
      'queued',    (select count(*) from public.scrape_requests where status = 'queued')
    ),
    'today', json_build_object(
      'attempted',         (select count(*) from public.scrape_runs, tw_today
                            where (updated_at at time zone 'Asia/Taipei')::date = tw_today.d),
      'passed',            (select count(*) from public.scrape_runs, tw_today
                            where status = 'passed' and (finished_at at time zone 'Asia/Taipei')::date = tw_today.d),
      'failed',            (select count(*) from public.scrape_runs, tw_today
                            where status = 'failed' and (updated_at at time zone 'Asia/Taipei')::date = tw_today.d),
      'transcripts_added', (select count(*) from public.transcripts, tw_today
                            where (created_at at time zone 'Asia/Taipei')::date = tw_today.d)
    ),
    'fail_breakdown_14d', coalesce((
      select json_agg(x order by x.n desc) from (
        select case
                 when fail_reason like '環境類%' then '環境/網路'
                 when fail_reason like '查無社區%' then '查無社區'
                 when fail_reason like '帳號無此社區%' then '帳號無權限'
                 when fail_reason like 'reconciler%' then '殭屍回收'
                 else '其他'
               end as kind, count(*) as n
        from public.scrape_runs
        where status = 'failed' and updated_at > now() - interval '14 days'
        group by 1
      ) x
    ), '[]'::json),
    'transcripts_total', (select count(*) from public.transcripts),
    'generated_at', now()
  )
$function$;
