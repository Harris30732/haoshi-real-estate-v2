@AGENTS.md

# Realty / 永慶房地產系統 — 專案根記憶（分層記憶 L1）

> 分層記憶架構的 L1。最精簡層，每次進入此 repo 自動載入。
> 細節不寫這裡 → 程式碼地圖見 `CODEMAP.md`；業務知識見 `D:\Knowledge\projects\realty\`。
> 架構說明見 `D:\Knowledge\LAYERED-MEMORY-ARCHITECTURE.md`。

## 這是什麼專案

**好市房產**（永慶體系）爬蟲 + 物件管理儀表板。抓謄本資料，給仲介 / 業務員做物件管理與數據分析。
Phase 5 完成 → **P1 多租戶 + 三層權限階段**（2026-05-22 上線：stores / owner-manager-employee / 註冊審核 / RLS）。

## 任務目標（不跑偏的錨點）

- **長期目標**：給永慶仲介 / 業務員一套好用的物件管理 + 數據分析內部工具。
- **下一里程碑**：🟡 待碰碰確認 —— 候選見 `D:\Knowledge\projects\realty\CLAUDE.md` 的 TODO（修個資紅線、移除 demo 後門、admin/users 接資料）。
- 巡檢與所有優化建議**只能服務此目標** —— 與目標無關的不做。
- 執行狀態（現在做到哪）見 `PROJECT-STATUS.md`（若無則待建）。

## 技術棧一句話

Next.js 16 App Router + React 19 + Tailwind v4，全 client-side。
**Auth = Supabase Auth + RLS**；多租戶（stores / profiles）+ 三層權限（owner / manager / employee）。
資料：`transcripts` 直連 Supabase；`properties / communities` CRUD 走 n8n webhook（findmyhome.zeabur.app）。

## 紅線（絕對不可違反）

- 🔴 屋主姓名 / 確切門牌 / 議價空間 / 聯絡方式 = 機密，不寫進任何檔案、commit、測試 fixture
- 🔴 任何「demo 後門 / bypass auth」一律不可重新引入 —— P1 已清除舊 `loginDemo()`
- 🔴 爬蟲頻率：YCUT 每帳號 10 PDF / 天為硬上限，不可超過
- 🔴 不要把房仲業務邏輯套到 storeops（門市）或 erp-bridge（ERP）— domain 完全不同

## 找東西去哪（分層導航）

- 要改程式碼、定位模組 → **先讀 `CODEMAP.md`**，依模組進入，不要全域掃描 `src/`
- 進入某模組後 → 讀該 `src/<模組>/CLAUDE.md` 看本地約束
- 架構決策、踩坑紀錄、安全風險清單 → `D:\Knowledge\projects\realty\notes\architecture-notes-20260507.md`
- 業務脈絡、合規、客戶 TODO → `D:\Knowledge\projects\realty\CLAUDE.md`

## context7 觸發

動到 Next.js 16 / React 19 / Tailwind v4 / TanStack Query|Table / shadcn ui / Supabase SDK / Apify SDK
→ prompt 結尾加 `use context7`。

## 維護紀律

模型大改版，或每 3-6 個月，重新核對此檔與 `CODEMAP.md` 是否仍正確（模型變強後可移除過時約束）。
