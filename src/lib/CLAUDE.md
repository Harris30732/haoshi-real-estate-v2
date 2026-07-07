# src/lib/ — 核心邏輯層（分層記憶 L3）

> 動此目錄前先讀 repo 根的 `CODEMAP.md`。此檔只列本模組的本地約束。

## 本地約束

- `api.ts` — n8n webhook client（properties / communities CRUD）。⚠️ **需帶 Supabase JWT 給 n8n 做權限檢查**（舊版送可竄改的 user 名已淘汰，n8n 端要驗 token）
- `supabase.ts` — Supabase client（`persistSession + autoRefreshToken + detectSessionInUrl`）。**Auth + RLS 全靠它**；RLS policy 寫錯 = 資料外洩
- `constants.ts` — `APP_NAME` / `ENDPOINTS` / `ROLES (owner/manager/employee)` / `PERMISSIONS` / `SCRAPE_*_STATUS` 的**單一來源**；新端點、新角色、新權限鍵一律加在這
- `auth-config.ts` — 已幾乎清空（舊 Google credential / localStorage key 已不用），不要當作有用設定
- 不硬編碼 secret；`NEXT_PUBLIC_*` 會進 bundle，敏感值不可用此前綴
- 純函式優先、immutable，函式 < 50 行

## context7

Supabase JS SDK 演進快 → 改 `supabase.ts` 時加 `use context7`。
