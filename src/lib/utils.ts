import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 台灣時間（UTC+8）格式化。全站報表/紀錄時間一律顯示台灣時間，
 * 不依賴瀏覽器時區（顯式 timeZone: 'Asia/Taipei'）。
 * null/空值回傳 '—'；無效日期回傳原字串。
 */
export function formatTaiwanTime(iso: string | null | undefined): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (isNaN(d.getTime())) return String(iso)
  return d.toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}
