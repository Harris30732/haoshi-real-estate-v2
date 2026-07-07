# src/components/ — 元件層（分層記憶 L3）

> 動此目錄前先讀 repo 根的 `CODEMAP.md`。此檔只列本模組的本地約束。

## 本地約束

- `ui/` 是 shadcn 產出的元件 —— **不要手改**；要新增用 shadcn CLI（`components.json` 已設定）
- 元件依領域分資料夾（`properties/` `communities/` `charts/` `layout/` `admin/`）；新元件放對應資料夾
- 元件保持 presentational：資料從 props 進來，抓資料 / cache 的邏輯留在 `src/hooks/`
- 圖表一律用 Recharts v3
- 遵守 coding-style：immutable（不 mutate props / state）、單檔 200-400 行、函式 < 50 行

## context7

shadcn ui v4 / TanStack Table v8 改版頻繁 → 動表格或新增 ui 元件時加 `use context7`。
