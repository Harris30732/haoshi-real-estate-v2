// 把 actor 寫進 transcripts.ycut_object_key 的內部識別解成「人類可讀的完整建物門牌」
//
// ycut_object_key 兩種形態（actor 端 composeObjectKey 產出）：
//   - 大樓：「<floor>::<door>」例如「12樓::1201號」
//   - 透天：「<road>::<floor>::<door>」例如「民權路四段716~722::1樓::716號」
//
// 合成規則（完整建物地址 = 路名 + 門牌號 + 樓層）：
//   1. 拆出 parts → road / floor / door
//   2. 判斷 door 是否已含路名（開頭是中文字 = 已含路名）：
//      - 已含路名：door 本身就是建物完整門牌，例「永信路299號」(屬於跨路段的鄰路門牌)
//      - 未含路名：要拼 normalizeRoad(road) — 從路段去掉「~XXX」「XXX-XX」尾巴
//   3. 接上樓層
//
// 範例：
//   民權路四段716~722::1樓::716號     → 民權路四段716號1樓
//   永興路~307::1樓::永信路299號      → 永信路299號1樓  (door 自帶路名，不拼 road)
//   永興路~307::1樓::297號            → 永興路297號1樓  (door 只有號，拼 road)
//   12樓::1201號                       → 1201號12樓     (大樓無 road context；社區地址另外加)

function normalizeRoad(raw: string): string {
  // 去掉路段範圍尾巴：「民權路四段716~722」→「民權路四段」
  // 邏輯：剝掉尾端「數字/破折號/波浪號 [+ 號]」
  if (!raw) return ''
  return raw
    .replace(/[\s　]+$/g, '')
    .replace(/[\d０-９\-\-~～－]+號?\s*$/u, '')
    .trim()
}

// 判定 door 是否已含路名（中文字開頭）
function doorHasRoad(door: string): boolean {
  if (!door) return false
  // 開頭是中文字（U+4E00–U+9FFF 加 Ext A/B 範圍簡化版）→ 視為已含路名
  return /^[一-鿿]/.test(door)
}

/**
 * 從 ycut_object_key 解出「完整建物地址（含樓層）」— 給匯出與 UI 顯示用
 * @param ycutObjectKey
 * @returns 完整地址字串；無法解析時回 ''
 */
export function fullBuildingAddress(ycutObjectKey: string | null | undefined): string {
  if (!ycutObjectKey) return ''
  const parts = ycutObjectKey.split('::')

  if (parts.length === 2) {
    // 大樓：floor::door — 沒 road context，建議外層另外加社區地址
    const [floor, door] = parts
    return `${door}${floor}`
  }
  if (parts.length === 3) {
    const [road, floor, door] = parts
    // pos<N> placeholder：實機未抓到真實門牌（v0.3.4 之前透天 fallback）→ 用「第 N 戶」標示
    const posMatch = door.match(/^pos(\d+)$/)
    if (posMatch) {
      return `${normalizeRoad(road)} 第 ${posMatch[1]} 戶 ${floor}`
    }
    const hasRoad = doorHasRoad(door)
    const roadPrefix = hasRoad ? '' : normalizeRoad(road)
    return `${roadPrefix}${door}${floor}`
  }
  return ycutObjectKey
}

/**
 * 給 UI table 用的「戶號」顯示 — 完整地址（含路名 + 號 + 樓層）
 * 為避免欄太寬，pos<N> placeholder 改成「第 N 戶」（極少數沒抓到真實門牌時）
 */
export function formatDoor(ycutObjectKey: string | null | undefined): string {
  if (!ycutObjectKey) return '—'
  const parts = ycutObjectKey.split('::')
  // 透天 placeholder fallback：road::floor::pos<N>
  if (parts.length === 3) {
    const door = parts[2]
    const m = door.match(/^pos(\d+)$/)
    if (m) return `${parts[1]} 第 ${m[1]} 戶`
  }
  return fullBuildingAddress(ycutObjectKey)
}

/**
 * 給 Excel 匯出用的「戶號」(社區戶號 column) — 完整地址 + 帶 pos<N> 機械字串保留可辨識
 */
export function exportDoor(ycutObjectKey: string | null | undefined): string {
  if (!ycutObjectKey) return ''
  return fullBuildingAddress(ycutObjectKey) || ycutObjectKey
}

// 標記是個人(X先生/X小姐)、公司、遮罩、未知 — 用於顯示時提示
export function ownerKind(owner: string | null | undefined): 'person' | 'company' | 'masked' | 'unknown' {
  if (!owner) return 'unknown'
  if (/先生|小姐/.test(owner)) return 'person'
  if (/公司|股份有限|有限公司/.test(owner)) return 'company'
  if (/\*\*|OO|ＯＯ/.test(owner)) return 'masked'
  return 'unknown'
}

// ---- 內部 helpers 開放給測試 ----
export const _internal = { normalizeRoad, doorHasRoad }
