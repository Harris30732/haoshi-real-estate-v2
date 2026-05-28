// 戶號顯示與匯出 helpers 的純單元測試（不依賴瀏覽器 / supabase）
// 跑法：`npx tsx src/lib/transcript-format.test.ts`（或直接 node + ts-node）
// 失敗時 process.exit(1)，0 errors = PASS。

import { fullBuildingAddress, formatDoor, exportDoor, _internal } from './transcript-format'

let passed = 0
let failed = 0
const failures: string[] = []

function eq(name: string, actual: unknown, expected: unknown) {
  if (actual === expected) { passed++; return }
  failed++
  failures.push(`${name}\n    expected: ${JSON.stringify(expected)}\n    actual:   ${JSON.stringify(actual)}`)
}

// === normalizeRoad ===
eq('normalizeRoad: 路段範圍尾巴',
  _internal.normalizeRoad('民權路四段716~722'),
  '民權路四段',
)
eq('normalizeRoad: 路段帶單一號',
  _internal.normalizeRoad('永興路~307'),
  '永興路',
)
eq('normalizeRoad: 完整路名不動',
  _internal.normalizeRoad('中埔一街'),
  '中埔一街',
)
eq('normalizeRoad: 含「2段」「二段」不剝',
  _internal.normalizeRoad('南竹路2段'),
  '南竹路2段',
)
eq('normalizeRoad: 帶子段號剝掉',
  _internal.normalizeRoad('南竹路二段321-18'),
  '南竹路二段',
)

// === doorHasRoad ===
eq('doorHasRoad: 中文開頭 (永信路299號)', _internal.doorHasRoad('永信路299號'), true)
eq('doorHasRoad: 數字開頭 (297號)', _internal.doorHasRoad('297號'), false)
eq('doorHasRoad: 純數字 (1201)', _internal.doorHasRoad('1201'), false)
eq('doorHasRoad: 空字串', _internal.doorHasRoad(''), false)

// === fullBuildingAddress ===
// 透天 + 純門牌（拼路名）
eq('透天 716號 (拼路段)',
  fullBuildingAddress('民權路四段716~722::1樓::716號'),
  '民權路四段716號1樓',
)
// 透天 + 跨路段門牌（不拼）
eq('透天 永信路299號 (不拼路段)',
  fullBuildingAddress('永興路~307::1樓::永信路299號'),
  '永信路299號1樓',
)
// 透天 + 同路段門牌（拼）
eq('透天 297號 (拼永興路)',
  fullBuildingAddress('永興路~307::1樓::297號'),
  '永興路297號1樓',
)
// 大樓 floor::door
eq('大樓 12樓::1201號',
  fullBuildingAddress('12樓::1201號'),
  '1201號12樓',
)
// 巷弄門牌（單巷）
eq('透天 帶巷',
  fullBuildingAddress('南竹路二段::1樓::321-18號'),
  '南竹路二段321-18號1樓',
)
// 台灣完整門牌：路段 + 巷 + 弄 + 號（YCUT 大社區常見）
eq('透天 完整巷弄門牌',
  fullBuildingAddress('民權路四段::1樓::1156巷6弄18-1號'),
  '民權路四段1156巷6弄18-1號1樓',
)
// 之X 變體（YCUT 有時用 之1 代替 -1）
eq('透天 之X 變體',
  fullBuildingAddress('民權路四段::1樓::716之1號'),
  '民權路四段716之1號1樓',
)
// 巷弄之
eq('透天 巷弄 + 之X',
  fullBuildingAddress('中山北路::1樓::5巷3弄8之2號'),
  '中山北路5巷3弄8之2號1樓',
)
// 跨路段 + 巷弄
eq('跨路段門牌帶巷',
  fullBuildingAddress('永興路~307::1樓::永信路123巷45號'),
  '永信路123巷45號1樓',
)
// 跨路段 + 之X
eq('跨路段帶之X',
  fullBuildingAddress('永興路~307::1樓::永信路299之1號'),
  '永信路299之1號1樓',
)
// 大樓 + 之X 樓層（電梯大樓同層分戶）
eq('大樓 樓層含之X',
  fullBuildingAddress('5樓之2::1201號'),
  '1201號5樓之2',
)
// 全形連字號 -（YCUT 偶見）— 應保留原文
eq('全形連字號',
  fullBuildingAddress('民權路四段::1樓::716－1號'),
  '民權路四段716－1號1樓',
)
// 空輸入
eq('空 key → 空字串',
  fullBuildingAddress(null),
  '',
)

// === formatDoor (UI 顯示) ===
eq('formatDoor: 透天 pos placeholder fallback',
  formatDoor('民權路四段716~722::1樓::pos1'),
  '1樓 第 1 戶',
)
eq('formatDoor: 透天 真實門牌',
  formatDoor('民權路四段716~722::1樓::716號'),
  '民權路四段716號1樓',
)
eq('formatDoor: 跨路段門牌',
  formatDoor('永興路~307::1樓::永信路299號'),
  '永信路299號1樓',
)
eq('formatDoor: null/empty',
  formatDoor(null),
  '—',
)

// === exportDoor (Excel 匯出) ===
eq('exportDoor: 透天',
  exportDoor('民權路四段716~722::1樓::716號'),
  '民權路四段716號1樓',
)
eq('exportDoor: 跨路段',
  exportDoor('永興路~307::1樓::永信路299號'),
  '永信路299號1樓',
)
eq('exportDoor: 同路段',
  exportDoor('永興路~307::1樓::297號'),
  '永興路297號1樓',
)
eq('exportDoor: pos placeholder → 「第 N 戶」標示',
  exportDoor('民權路四段716~722::1樓::pos1'),
  '民權路四段 第 1 戶 1樓',
)
eq('exportDoor: null/empty',
  exportDoor(undefined),
  '',
)

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) {
  console.log('\nFailures:')
  failures.forEach((f) => console.log(' - ' + f))
  process.exit(1)
}
