# src/hooks/ — 資料與狀態層（分層記憶 L3）

> 動此目錄前先讀 repo 根的 `CODEMAP.md`。此檔只列本模組的本地約束。

## 本地約束

- 資料抓取一律用 TanStack Query v5。`staleTime` 規範：
  - properties / communities / users（走 `/api/all-data`）→ 60s
  - transcripts 列表（按社區）→ 120s
  - transcript stats（總筆數 + 社區分布）→ 300s
- auth 狀態用 Zustand（`use-auth.ts`）鏡射 Supabase Auth session；session 由 Supabase 持久化於 localStorage，store 只反映 `onAuthStateChange` 推導的 `authState`（anon/pending/active/suspended）+ `profiles` 查回的 profile
- ⚠️ `onAuthStateChange` callback 內禁止直接 `await` supabase 查詢（supabase-js lock 死結）—— 用 `setTimeout(…, 0)` 推遲
- 不要在 hook 外直接呼叫 `lib/api.ts` 或 `lib/supabase.ts`；所有資料存取統一經過 hook

## context7

TanStack Query v5 的 API 與 v4 差異大 → 改 query 寫法時加 `use context7`。
