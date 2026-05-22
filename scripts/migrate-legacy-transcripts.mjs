#!/usr/bin/env node
/**
 * T14 — 既有 transcripts_legacy（≈13,046 筆）遷移到多租戶新 schema。
 * 寫入 communities + transcripts + community_store_access（舊資料全歸「總部 HQ」店）。
 * 依 ADR-0001 第 9 節。
 *
 * 用法（需 service_role key —— 繞過 RLS 寫入僅 service_role 可寫的表）：
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/migrate-legacy-transcripts.mjs
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/migrate-legacy-transcripts.mjs --commit
 *
 * 不帶旗標 = dry-run（預設安全）：只讀，驗證合成 ycut_object_key 的唯一性、
 *   報告撞鍵與社區拼法重複，不寫入任何資料。
 * --commit：dry-run 全綠後才實際寫入。
 *
 * ⚠️ 合成 key 說明：舊資料無 ycut_object_key，依 ADR §9 步驟 3 用
 *   (land_section + community_address + parking_number) 合成，並加 `legacy:` 前綴
 *   以利日後辨識。若 YCUT 日後重爬同物件會產生「正規」key、形成新 transcript row，
 *   屬已知的遷移取捨（舊資料 source_updated_at 為 NULL → 下次爬取必被當「需更新」）。
 */

import { createClient } from '@supabase/supabase-js'

const COMMIT = process.argv.includes('--commit')
const HQ_CODE = 'HQ'
const BATCH = 500

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('缺少環境變數 SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

/** JS 版 normalize_community_name（與 P0 SQL function 等價）。 */
function normalizeCommunityName(name) {
  const noSpace = (name ?? '').trim().replace(/\s+/g, '')
  return noSpace.replace(/(大樓|大廈|社區|公寓|住宅|NO\.?)$/, '')
}

/** 依 ADR §9 步驟 3 合成 deterministic ycut_object_key。 */
function synthKey(row) {
  const parts = [row.land_section, row.community_address, row.parking_number]
    .map((v) => (v ?? '').trim())
    .join('|')
  return `legacy:${parts}`
}

/** 把舊 DATE 欄位轉為 timestamptz 字串，空值回 null。 */
function toTimestamp(d) {
  if (!d) return null
  const parsed = new Date(d)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

async function fetchAllLegacy() {
  const rows = []
  let from = 0
  for (;;) {
    const { data, error } = await db
      .from('transcripts_legacy')
      .select('*')
      .range(from, from + BATCH - 1)
    if (error) throw new Error(`讀取 transcripts_legacy 失敗：${error.message}`)
    rows.push(...data)
    if (data.length < BATCH) break
    from += BATCH
  }
  return rows
}

async function insertInBatches(table, rows) {
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH)
    const { error } = await db.from(table).insert(chunk)
    if (error) throw new Error(`寫入 ${table} 失敗（batch ${i}）：${error.message}`)
    console.log(`  ${table}: ${Math.min(i + BATCH, rows.length)}/${rows.length}`)
  }
}

async function main() {
  console.log(`=== 遷移 transcripts_legacy（${COMMIT ? 'COMMIT 寫入' : 'DRY-RUN 只讀'}）===\n`)

  // 1. 總部 HQ 店 ----------------------------------------------------------
  const { data: hq, error: hqErr } = await db
    .from('stores')
    .select('id')
    .eq('code', HQ_CODE)
    .maybeSingle()
  if (hqErr) throw new Error(`查 HQ 店失敗：${hqErr.message}`)
  if (!hq) throw new Error('找不到 code=HQ 的總部店（seed 應已建立）')

  // 寫入前先確認 transcripts 表為空，防重複遷移 ------------------------------
  if (COMMIT) {
    const { count, error } = await db
      .from('transcripts')
      .select('id', { count: 'exact', head: true })
    if (error) throw new Error(`檢查 transcripts 失敗：${error.message}`)
    if ((count ?? 0) > 0) {
      throw new Error(`transcripts 已有 ${count} 筆資料 —— 疑似已遷移，中止以防重複寫入`)
    }
  }

  // 2. 讀舊資料 ------------------------------------------------------------
  const legacy = await fetchAllLegacy()
  console.log(`舊資料 transcripts_legacy：${legacy.length} 筆\n`)

  // 3. 整理社區（normalized_name 去重）-------------------------------------
  const communityByNorm = new Map() // normalized_name → { name, address, rawNames:Set }
  for (const row of legacy) {
    const norm = normalizeCommunityName(row.community_name)
    if (!norm) continue
    if (!communityByNorm.has(norm)) {
      communityByNorm.set(norm, {
        name: (row.community_name ?? '').trim(),
        address: row.community_address ?? null,
        rawNames: new Set(),
      })
    }
    const entry = communityByNorm.get(norm)
    // 同名社區的 address 取「非空優先」—— 首筆若為空，由後續有值的 row 補上。
    if (!entry.address && row.community_address) entry.address = row.community_address
    entry.rawNames.add((row.community_name ?? '').trim())
  }
  console.log(`distinct 社區（normalized）：${communityByNorm.size} 個`)

  // 拼法重複：同一 normalized_name 對應多種原始拼法 → 人工 merged_into_id 兜底
  const spellingDupes = [...communityByNorm.entries()].filter(([, v]) => v.rawNames.size > 1)
  if (spellingDupes.length) {
    console.log(`\n⚠️ ${spellingDupes.length} 個社區有多種拼法（遷移後需人工 merged_into_id 合併）：`)
    for (const [norm, v] of spellingDupes.slice(0, 20)) {
      console.log(`   [${norm}] ← ${[...v.rawNames].join(' / ')}`)
    }
    if (spellingDupes.length > 20) console.log(`   …另 ${spellingDupes.length - 20} 個`)
  }

  // 4. 驗證合成 key 唯一性（最大風險點，ADR §9 步驟 3）----------------------
  const keySeen = new Map() // `${norm} ${key}` → count
  for (const row of legacy) {
    const norm = normalizeCommunityName(row.community_name)
    if (!norm) continue
    const composite = `${norm} ${synthKey(row)}`
    keySeen.set(composite, (keySeen.get(composite) ?? 0) + 1)
  }
  const collisions = [...keySeen.entries()].filter(([, c]) => c > 1)
  const noCommunity = legacy.filter((r) => !normalizeCommunityName(r.community_name)).length

  console.log(`\n=== 驗證結果 ===`)
  console.log(`合成 (community, ycut_object_key) 撞鍵：${collisions.length} 組`)
  if (collisions.length) {
    for (const [composite, c] of collisions.slice(0, 20)) {
      console.log(`   撞 ${c} 次：${composite.replace(' ', '  →  ')}`)
    }
    if (collisions.length > 20) console.log(`   …另 ${collisions.length - 20} 組`)
  }
  if (noCommunity) console.log(`社區名為空、無法歸屬：${noCommunity} 筆`)

  if (!COMMIT) {
    console.log(
      `\nDRY-RUN 結束。${collisions.length ? '❌ 有撞鍵，須先人工處理才能 --commit。' : '✅ 無撞鍵，可加 --commit 寫入。'}`,
    )
    return
  }

  if (collisions.length) {
    throw new Error('合成 key 有撞鍵，中止 commit —— 請先人工處理後再執行')
  }

  // 5. 寫入 communities ----------------------------------------------------
  console.log(`\n寫入 communities…`)
  const communityRows = [...communityByNorm.entries()].map(([norm, v]) => ({
    name: v.name,
    normalized_name: norm,
    address: v.address,
  }))
  const { data: insertedCommunities, error: cErr } = await db
    .from('communities')
    .insert(communityRows)
    .select('id, normalized_name')
  if (cErr) throw new Error(`寫入 communities 失敗：${cErr.message}`)
  const communityId = new Map(insertedCommunities.map((c) => [c.normalized_name, c.id]))
  console.log(`  communities：${insertedCommunities.length} 筆`)

  // 6. 寫入 transcripts ----------------------------------------------------
  console.log(`寫入 transcripts…`)
  const transcriptRows = []
  for (const row of legacy) {
    const norm = normalizeCommunityName(row.community_name)
    const cid = communityId.get(norm)
    if (!cid) continue // 社區名為空，略過
    transcriptRows.push({
      community_id: cid,
      ycut_object_key: synthKey(row),
      source_updated_at: toTimestamp(row.extracted_date),
      owner_name: row.owner_name,
      owner_address: row.owner_address,
      pdf_url: row.pdf_url,
      land_section: row.land_section,
      area_ping: row.area_ping,
      total_ping: row.total_ping,
      building_ping: row.building_ping,
      main_area_ping: row.main_area_ping,
      accessory_area_ping: row.accessory_area_ping,
      public_area_ping: row.public_area_ping,
      parking_area_ping: row.parking_area_ping,
      id_prefix: row.id_prefix,
      registration_reason: row.registration_reason,
      registration_date: row.registration_date,
      application_date: row.application_date,
      registration_order: row.registration_order,
      rights_type: row.rights_type,
      mortgage_total: row.mortgage_total,
      public_common: row.public_common,
      public_rights_scope: row.public_rights_scope,
      small_public_area: row.small_public_area,
      small_public_rights: row.small_public_rights,
      parking_number: row.parking_number,
      parking_rights_scope: row.parking_rights_scope,
      extracted_date: row.extracted_date,
    })
  }
  await insertInBatches('transcripts', transcriptRows)

  // 7. 寫入 community_store_access（每個社區 → 總部 HQ）---------------------
  console.log(`寫入 community_store_access…`)
  const now = new Date().toISOString()
  const accessRows = [...communityId.values()].map((cid) => ({
    community_id: cid,
    store_id: hq.id,
    granted_via: 'manual',
    data_snapshot_at: now,
  }))
  await insertInBatches('community_store_access', accessRows)

  console.log(
    `\n✅ 遷移完成：${insertedCommunities.length} 社區 / ${transcriptRows.length} 謄本 / ${accessRows.length} 授權。`,
  )
  console.log('後續：人工檢視上方「多種拼法」社區，必要時以 merged_into_id 合併。')
}

main().catch((e) => {
  console.error(`\n❌ ${e.message}`)
  process.exit(1)
})
