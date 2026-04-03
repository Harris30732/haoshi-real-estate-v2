import { Property } from '@/types/property'

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
