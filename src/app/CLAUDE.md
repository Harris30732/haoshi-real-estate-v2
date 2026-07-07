# src/app/ — 路由層（分層記憶 L3）

> 動此目錄前先讀 repo 根的 `CODEMAP.md`。此檔只列本模組的本地約束。

## 本地約束

- 全部 `'use client'` —— 無 server component、無 API route、無 SSR / ISR
- 新增頁面：建 `app/<route>/page.tsx`；資料一律透過 `src/hooks/` 的 TanStack Query hook 取得，**不要在頁面內直接 fetch**
- 路由結構即導覽；sidebar 連結維護在 `src/components/layout/sidebar.tsx`
- **`auth-guard`** 依 `authState` 路由：anon → `/login`；pending → `/pending` 或 `/register`；suspended → 提示；active → 進站
- `transcripts/page.tsx` 是唯一直連 Supabase 的頁；⚠️ owner_name 機密 —— 必須靠 RLS 限定讀取策略（不能單靠前端 gating）
- `admin/members` / `admin/registrations` / `admin/stores` 已上線（取代舊 `admin/users` placeholder）

## context7

Next.js 16 / React 19 的 layout、routing、server actions 寫法與舊版差異大 → 動路由 / layout 時加 `use context7`。
