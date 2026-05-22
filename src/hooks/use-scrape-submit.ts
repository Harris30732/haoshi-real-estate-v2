'use client'

import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ScrapeRequest } from '@/types/scrape'

/**
 * 送出單一社區的謄本爬取下單（呼叫 P0 `submit_scrape_request` RPC）。
 *
 * RPC 內含並發決策樹（命中新鮮資料 dedup / 掛載既有 run / 建新 run）與
 * `scrape.submit` 權限檢查 —— 安全邊界在 DB 端，前端只負責呼叫。
 * 批次下單由頁面逐行呼叫本 mutation（RPC 單社區，迴圈與結果彙整在頁面）；
 * 因此這裡不掛 onSuccess/onError toast，避免批次時逐筆彈窗洗版。
 */
export function useScrapeSubmit() {
  return useMutation({
    mutationFn: async (communityName: string): Promise<ScrapeRequest> => {
      const { data, error } = await supabase.rpc('submit_scrape_request', {
        p_community_name: communityName,
      })
      if (error) throw error
      return data as ScrapeRequest
    },
  })
}
