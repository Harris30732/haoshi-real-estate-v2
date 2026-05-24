# CODEMAP — 程式碼地圖（分層記憶 L2）

> 要動程式碼前**先讀這份**，依模組定位，不要全域掃描 `src/`。
> 盤點基準：commit `0acc9a2`（P1 認證與三層權限）+ `67dd404`（遷移腳本精簡）— 2026-05-22。
> **維護紀律**：feature commit 動到本檔描述的事（模組 / hook / API / 紅線 / 風險熱點），**同一個 commit 內**就要更新本檔 —— 否則 1 個 feature 就會讓地圖失真。

## 整體資料流

```
爬蟲（Apify YCUT actors + Playwright + n8n scripts）
        ↓
n8n（findmyhome.zeabur.app）排程 / 解析 / 寫入
        ↓
Supabase Postgres（多租戶 + RLS）
   ├─ stores / profiles / roles / permissions / registration_requests   ← P1 新
   ├─ properties / communities / transcripts
   └─ 社區爬取流程：scrape_requests / scrape_runs                       ← P1 新
        ↕（Supabase Auth）
Next.js 16 全 client-side
   ├─ Auth：Supabase Auth OAuth + 4 態狀態機（anon / pending / active / suspended）
   ├─ transcripts：前端直連 Supabase（RLS 限制讀取）
   └─ properties / communities：前端 → /api/* → n8n webhook
```

## 多租戶與權限模型（P1 schema，2026-05-22 上線）

`supabase/migrations/20260522100002_tenancy.sql` + `..._community_scraping.sql` + `..._seed.sql`

- **stores**：店（id, name, code, region, status）—— 租戶單位
- **profiles**：延伸 auth.users（id, store_id, role_key, full_name, email, phone_ext, status）
  - profile **存在** = 已被店長/Owner 核准；未核准者只有 auth session，無 profile（→ authState = pending）
- **roles**：3 層委派 —— `owner`（系統擁有者）/ `manager`（店長）/ `employee`（員工）
- **permissions**：能力鍵 —— `scrape.submit` / `transcripts.view` / `communities.view` / `store.manage_members` / `store.manage_credentials` / `billing.view`
- **registration_requests**：註冊申請（status：pending / approved / rejected）

## 模組地圖（src/）

| 模組 | 職責 | 進來找什麼 | 本地約束 |
|------|------|-----------|----------|
| `src/app/` | Next.js 路由與頁面 | 新增頁面、改某頁 UI / 邏輯 | `src/app/CLAUDE.md` |
| `src/components/` | React 元件 | 改畫面元件、admin 對話框、圖表、表單 | `src/components/CLAUDE.md` |
| `src/hooks/` | 資料 hook + auth / 權限 store | 改資料抓取、cache、登入、權限判斷 | `src/hooks/CLAUDE.md` |
| `src/lib/` | 核心邏輯 | api client、Supabase client、常數 | `src/lib/CLAUDE.md` |
| `src/types/` | 資料模型 | property / community / transcript / user / scrape 型別 | — |
| `supabase/migrations/` | Postgres schema 變更 | 動 schema / RLS / seed | — |

### src/app/ — 路由

- `page.tsx` — Dashboard（KPI + 價格分布 + 社區比較）
- **`login/`** — Google OAuth 登入（觸發 `supabase.auth.signInWithOAuth`）
- **`register/`** ⭐P1 — 註冊申請（pending 使用者填，送 registration_request）
- **`pending/`** ⭐P1 — 等待店長/Owner 核准的提示頁
- `properties/`、`properties/[id]/`、`properties/compare/`
- `communities/`
- `transcripts/` ← **唯一直連 Supabase**；⚠️ owner_name 機密性需確認 RLS 讀取策略
- `analytics/`
- **`admin/members/`** ⭐P1 — 成員列表 + 權限設定（搭 `member-permission-dialog`）
- **`admin/registrations/`** ⭐P1 — 註冊申請審核（approve / reject）
- **`admin/stores/`** ⭐P1 — 店管理 + grantable 設定
- `admin/users/` — 已精簡，主要功能搬到 `admin/members`

### src/components/

- `ui/` — shadcn 元件（不手改，用 shadcn CLI）
- `layout/` — `sidebar` / `header` / `app-shell` / `auth-guard`（依 authState 路由）
- `properties/` — property-card / table / form / filters / range-filter
- `communities/` — community-form
- `charts/` — price-distribution / area-distribution / community-chart / price-vs-area（Recharts v3）
- **`admin/`** ⭐P1 — `member-permission-dialog.tsx`、`store-grantable-dialog.tsx`
- `providers.tsx`、`confirm-dialog.tsx`

### src/hooks/

- `use-auth.ts` — Zustand store 鏡射 Supabase Auth session；**4 態狀態機**（anon / pending / active / suspended）
  - ⚠️ `onAuthStateChange` callback 內**禁止直接** `await` supabase（lock 死結）→ 用 `setTimeout(…, 0)` 推遲
- **`use-profile.ts`** ⭐P1 — 當前 user 的 profile（含 store_id / role_key）
- **`use-permissions.ts`** ⭐P1 — 權限判斷（`has(perm)`）
- **`use-stores.ts`** ⭐P1 — 店清單 / 切店
- **`use-store-members.ts`** ⭐P1 — 店內成員管理
- **`use-registration-requests.ts`** ⭐P1 — 註冊申請審核 hook
- `use-properties.ts`、`use-communities.ts`、`use-transcripts.ts`（直連 Supabase）
- `use-compare.ts`、`use-filters.ts`、`use-filtered-properties.ts`、`use-theme.ts`

### src/lib/

- `api.ts` — n8n webhook client（properties / communities CRUD）
- `supabase.ts` — Supabase client（`persistSession + autoRefreshToken + detectSessionInUrl`）；**Auth 與 RLS 全靠它**
- `constants.ts` — `APP_NAME='好市房產'` / `ENDPOINTS` / `ROLES` / `PERMISSIONS` / `SCRAPE_REQUEST_STATUS` / `SCRAPE_RUN_STATUS` 等 enum 單一來源
- `utils.ts`、`import-export.ts`
- `auth-config.ts` — ⚠️ 已幾乎清空（舊 Google credential / localStorage key 已不用），不要當作有用設定

### src/types/

- `property.ts`、`community.ts`、`transcript.ts`（機密欄位 owner_name）
- `user.ts` — `Role` / `AccountStatus` / `RegistrationStatus` / `Store` / `Profile` / `Permission` / `RegistrationRequest`
- **`scrape.ts`** ⭐P1 — `ScrapeRequestStatus`、`ScrapeRunStatus`

## API 端點（注意：仍是 n8n webhook，不是 Next.js API route）

`src/app/api/` 不存在。`/api/*` 由部署環境 proxy 到 n8n：
- `GET  /api/all-data` — properties + communities 等彙整
- `POST /api/admin/properties` — body 帶 `action: create|update|delete`
- `POST /api/admin/communities` — 同上
- `POST /api/admin/photos/upload` — multipart

**已移除**：`/api/admin/users`（搬 `admin/members`）、`/api/auth/google`、`/api/auth/verify` —— 改用 Supabase Auth

## 已知風險熱點（改到這些檔請特別小心）

- **`transcripts.owner_name`**：機密欄位；現有 RLS，但**需驗證讀取策略是否限定角色/權限**
- **多租戶隔離**：動 stores / profiles / properties 時務必確認 RLS（一店看不到別店的資料）
- **`supabase.ts`**：`NEXT_PUBLIC_SUPABASE_ANON_KEY` 在 browser，安全完全靠 RLS（RLS 錯 = 資料外洩）
- **`api.ts` n8n webhook 路徑**：需驗證是否帶 Supabase JWT 給 n8n 端做權限檢查（不能再像舊版只送可竄改的 user 名）
- **registration_requests 流程**：註冊 → pending → approve/reject → 建 profile。中間任一步壞掉使用者就卡住
- **migrations**：動 `supabase/migrations/` 要小心 —— RLS policy 改錯 = 資料外洩

## 已淘汰 / 不要碰

- 舊 localStorage auth（`haoshi_access_token` / `haoshi_user_data`）—— 已改 Supabase Auth
- `loginDemo()` demo 後門 —— **已移除**；任何「demo bypass auth」不可再加回
- 舊前端 `index.html` + `js/` + `css/` —— 已廢棄
- 舊角色 enum（`user/manager/admin`）—— 改 `owner/manager/employee`，不要再用舊名
