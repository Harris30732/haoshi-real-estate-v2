import { Property } from '@/types/property'
import type { Transcript } from '@/types/transcript'
import { exportDoor } from '@/lib/transcript-format'

// ==================== Export ====================

export function exportPropertiesCSV(properties: Property[], filename?: string) {
  const headers = [
    '社區名稱', '總價(萬)', '總坪', '室內坪', '車位坪', '車價(萬)', '單價(萬/坪)',
    '樓層', '地址', '格局', '狀態', '委託形式', '委託人', '備註',
  ]

  const rows = properties.map((p) => [
    p.community_name,
    p.total_price ?? '',
    p.total_ping ?? '',
    p.house_ping ?? '',
    p.parking_ping ?? '',
    p.parking_price ?? '',
    p.unit_price?.toFixed(2) ?? '',
    p.floor_info ?? '',
    p.address ?? '',
    p.layout ?? '',
    p.status ?? '',
    p.contract_type ?? '',
    p.consignor ?? '',
    p.notes ?? '',
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  downloadFile(csvContent, filename || `物件匯出_${formatDate()}.csv`, 'text/csv;charset=utf-8;')
}

export function exportAllDataJSON(data: { properties: Property[]; communities: unknown[]; users: unknown[] }) {
  const json = JSON.stringify(data, null, 2)
  downloadFile(json, `好市房產_備份_${formatDate()}.json`, 'application/json')
}

// ==================== Transcripts → Excel ====================
// 客服匯出：5 欄聯絡資料（社區名稱 / 社區地址 / 社區戶號 / 所有權人 / 所有權人地址）
// 客服情境：用所有權人地址寄信、用所有權人姓名打招呼

export async function exportTranscriptsXlsx(
  transcripts: Transcript[],
  filename?: string,
) {
  if (!transcripts || transcripts.length === 0) {
    throw new Error('沒有資料可以匯出')
  }

  // dynamic import to keep main bundle slim
  const ExcelJS = (await import('exceljs')).default

  const wb = new ExcelJS.Workbook()
  wb.creator = '好市不動產'
  wb.created = new Date()

  const sheetName = (transcripts[0]?.community_name || '謄本').substring(0, 31)

  // ─── Sheet 1: 社區資料（每社區一行）────────────────────────────────
  // 從 transcripts 抽出 unique community 資訊（同社區所有 transcript 的 community_* 欄位相同）
  const communityMap = new Map<string, Transcript>()
  for (const t of transcripts) {
    const key = t.community_id || t.community_name || ''
    if (key && !communityMap.has(key)) communityMap.set(key, t)
  }
  const wsInfo = wb.addWorksheet('社區資料')
  wsInfo.columns = [
    { header: '社區名稱', key: 'name', width: 22 },
    { header: '社區地址', key: 'address', width: 36 },
    { header: '建設公司', key: 'builder', width: 30 },
    { header: '完工日期', key: 'completion_date', width: 12 },
    { header: '建物樓層', key: 'building_floors', width: 16 },
    { header: '總戶數', key: 'total_units', width: 10 },
    { header: '同層戶數', key: 'units_per_floor', width: 12 },
    { header: '坪數規劃', key: 'ping_range', width: 14 },
    { header: '格局規劃', key: 'layout_plan', width: 14 },
    { header: '建物型態', key: 'building_type', width: 10 },
    { header: '主結構', key: 'main_structure', width: 16 },
    { header: '管理方式', key: 'management_type', width: 12 },
    { header: '謄本筆數', key: 'transcript_count', width: 10 },
  ]
  wsInfo.getRow(1).font = { bold: true }
  wsInfo.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' }
  wsInfo.getRow(1).fill = {
    type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' },
  }

  // 統計每社區的 transcripts 數
  const countByCommunity = new Map<string, number>()
  for (const t of transcripts) {
    const key = t.community_id || t.community_name || ''
    countByCommunity.set(key, (countByCommunity.get(key) || 0) + 1)
  }

  for (const [key, c] of communityMap) {
    wsInfo.addRow({
      name: c.community_name || '',
      address: c.community_address || '',
      builder: c.community_builder || '',
      completion_date: c.community_completion_date || '',
      building_floors: c.community_building_floors || '',
      total_units: c.community_total_units ?? '',
      units_per_floor: c.community_units_per_floor || '',
      ping_range: c.community_ping_range || '',
      layout_plan: c.community_layout_plan || '',
      building_type: c.community_building_type || '',
      main_structure: c.community_main_structure || '',
      management_type: c.community_management_type || '',
      transcript_count: countByCommunity.get(key) || 0,
    })
  }
  wsInfo.views = [{ state: 'frozen', ySplit: 1 }]
  wsInfo.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 13 } }

  // ─── Sheet 2: 客服名單（戶級表）──────────────────────────────────────
  const ws = wb.addWorksheet(sheetName)
  ws.columns = [
    { header: '社區名稱', key: 'community_name', width: 22 },
    { header: '社區地址', key: 'community_address', width: 30 },
    { header: '建物地址', key: 'door', width: 32 },
    { header: '所有權人', key: 'owner_name', width: 12 },
    { header: '所有權人地址', key: 'owner_address', width: 40 },
  ]
  ws.getRow(1).font = { bold: true }
  ws.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' }
  ws.getRow(1).fill = {
    type: 'pattern', pattern: 'solid',
    fgColor: { argb: 'FFE3F2FD' },
  }

  for (const t of transcripts) {
    ws.addRow({
      community_name: t.community_name || '',
      community_address: t.community_address || '',
      door: exportDoor(t.ycut_object_key),
      owner_name: t.owner_name || '',
      owner_address: t.owner_address || '',
    })
  }

  ws.views = [{ state: 'frozen', ySplit: 1 }]
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 5 } }

  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const baseName = sheetName === '謄本' ? '謄本資料' : sheetName
  a.download = filename || `${baseName}_客服名單_${formatDate()}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}

// ==================== Import ====================

export async function parseCSVFile(file: File): Promise<Record<string, string>[]> {
  const text = await file.text()
  const lines = text.split('\n').filter((l) => l.trim())
  if (lines.length < 2) return []

  const headers = parseCSVLine(lines[0])
  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line)
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h.trim()] = values[i]?.trim() || '' })
    return row
  })
}

export function mapImportRow(row: Record<string, string>) {
  // Support both Chinese and English column names
  const map: Record<string, string> = {
    '社區名稱': 'community_name', 'community_name': 'community_name',
    '總價': 'total_price', '總價(萬)': 'total_price', 'total_price': 'total_price',
    '總坪': 'total_ping', '總坪數': 'total_ping', 'total_ping': 'total_ping',
    '車位坪': 'parking_ping', '車位坪數': 'parking_ping', 'parking_ping': 'parking_ping',
    '車價': 'parking_price', '車價(萬)': 'parking_price', 'parking_price': 'parking_price',
    '樓層': 'floor_info', 'floor_info': 'floor_info',
    '地址': 'address', 'address': 'address',
    '格局': 'layout', 'layout': 'layout',
    '狀態': 'status', 'status': 'status',
    '委託形式': 'contract_type', 'contract_type': 'contract_type',
    '委託人': 'consignor', 'consignor': 'consignor',
    '備註': 'notes', 'notes': 'notes',
  }

  const mapped: Record<string, unknown> = {}
  Object.entries(row).forEach(([key, value]) => {
    const field = map[key]
    if (field && value) {
      mapped[field] = ['total_price', 'total_ping', 'parking_ping', 'parking_price'].includes(field)
        ? parseFloat(value) || null
        : value
    }
  })
  return mapped
}

// ==================== Helpers ====================

function downloadFile(content: string, filename: string, type: string) {
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function formatDate() {
  return new Date().toISOString().split('T')[0]
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (const char of line) {
    if (char === '"') { inQuotes = !inQuotes; continue }
    if (char === ',' && !inQuotes) { result.push(current); current = ''; continue }
    current += char
  }
  result.push(current)
  return result
}
