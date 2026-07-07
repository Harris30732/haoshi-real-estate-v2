/* eslint-disable @typescript-eslint/no-require-imports */
// 回歸測試：exportTranscriptsXlsx 的工作表名稱淨化（safeSheetName）
// 背景：ExcelJS 對含 * ? : \ / [ ] 或頭尾單引號的工作表名直接 throw，
// 而社區名可能含「/」（實例：中悅一品/中悅世界中心）→ 客戶匯出客服名單失敗。
// 執行：npm run test:export（或 node scripts/test-export-sheetname.js）
const fs = require('fs')
const path = require('path')
const ExcelJS = require('exceljs')

const SRC = path.join(__dirname, '..', 'src', 'lib', 'import-export.ts')
const src = fs.readFileSync(SRC, 'utf8')

let pass = 0
let fail = 0
function check(label, cond, extra = '') {
  if (cond) { pass++; console.log(`[PASS] ${label}`) }
  else { fail++; console.log(`[FAIL] ${label} ${extra}`) }
}

// 從實際源碼抽出 safeSheetName 本體執行（測出貨的碼，不是複製品）
const m = src.match(/function safeSheetName\(name: string\): string \{([\s\S]*?)\n\}/)
check('源碼含 safeSheetName 定義', !!m)
if (!m) process.exit(1)
const safeSheetName = new Function('name', m[1])

check(
  '呼叫點已套用',
  src.includes("const sheetName = safeSheetName(transcripts[0]?.community_name || '謄本')"),
)

// DB 實際存在的含「/」社區名
const realNames = [
  ['中悅一品/中悅世界中心', '中悅一品-中悅世界中心'],
  ['玖都森學園/玖都銀座', '玖都森學園-玖都銀座'],
  ['HLA悦/御花園5288', 'HLA悦-御花園5288'],
  ['宜誠有境/宜誠旅時光', '宜誠有境-宜誠旅時光'],
]
for (const [input, expected] of realNames) {
  const out = safeSheetName(input)
  check(`淨化 ${input} → ${out}`, out === expected, `expected ${expected}`)
}

// 非法字元、截斷、fallback、單引號頭尾
for (const ch of ['*', '?', ':', '\\', '[', ']', '/']) {
  check(`非法字元 ${ch} 被移除`, !safeSheetName(`測${ch}試`).includes(ch))
}
check('31 字截斷', safeSheetName('a'.repeat(40)).length === 31)
check("fallback '謄本' 不受影響", safeSheetName('謄本') === '謄本')
check('頭尾單引號被移除', safeSheetName("'某社區'") === '某社區')
check('只有頭單引號', safeSheetName("'某社區") === '某社區')
check('全單引號 → 退回謄本', safeSheetName("'''") === '謄本')
check('空字串 → 退回謄本', safeSheetName('') === '謄本')

// ExcelJS 端對端：原始名 throw（bug 前提）、淨化名可完整匯出
async function main() {
  const throwCases = [...realNames.map(([i]) => i), "'頭引號社區", "尾引號社區'"]
  for (const input of throwCases) {
    const wb = new ExcelJS.Workbook()
    let threwRaw = false
    try { wb.addWorksheet(input.substring(0, 31)) } catch { threwRaw = true }
    check(`原始名仍會 throw（bug 前提成立）: ${input}`, threwRaw)

    const wb2 = new ExcelJS.Workbook()
    wb2.addWorksheet('社區資料')
    const ws = wb2.addWorksheet(safeSheetName(input))
    ws.columns = [
      { header: '社區名稱', key: 'a', width: 22 },
      { header: '所有權人地址', key: 'b', width: 40 },
    ]
    ws.addRow({ a: input, b: '桃園市桃園區經國里10鄰經國路** *' })
    const buf = await wb2.xlsx.writeBuffer()
    check(`淨化後完整雙 sheet 匯出 OK: ${input}`, (buf.byteLength || buf.length) > 4000)
  }
  console.log(`\n結果: ${pass} pass / ${fail} fail`)
  process.exit(fail ? 1 : 0)
}
main().catch((e) => { console.error('UNEXPECTED', e); process.exit(1) })
