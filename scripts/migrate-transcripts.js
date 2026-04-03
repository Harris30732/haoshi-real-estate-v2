/**
 * 遷移腳本：Google Sheets 謄本資料 → Supabase transcripts 表
 *
 * 使用方式：
 *   node scripts/migrate-transcripts.js
 *
 * 流程：
 *   1. 透過 n8n 讀取 Google Sheets 的謄本資料
 *   2. 批次寫入 Supabase transcripts 表
 */

const SUPABASE_URL = 'https://pqlftambvajgfbxfqyer.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxbGZ0YW1idmFqZ2ZieGZxeWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMjc1NDksImV4cCI6MjA4MTgwMzU0OX0.fWr5QhmH7kVZ0toNgU1NusaQDvO3zYpS_ljJAcqpyWk';
const N8N_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0NzE0ZDM2ZC0xMWNiLTQ1NWMtYjk3Mi02N2JkOTE5NjE2OGYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiMjczZTJmY2MtZjY1OS00YjU4LThlNTktODRlMTg4NmJlZjBlIiwiaWF0IjoxNzcyNTI4NDgwfQ.zhD6EyDwOQlNEWvP1oOPhlPL6859eNHfEQSJri4HLhw';

async function main() {
  console.log('=== 謄本資料遷移：Google Sheets → Supabase ===\n');

  // Step 1: Read transcript data from Google Sheets via n8n
  console.log('1. 從 n8n 讀取 Google Sheets 資料...');

  // Create temp n8n workflow to read the sheet
  const createRes = await fetch(`https://findmyhome.zeabur.app/api/v1/workflows`, {
    method: 'POST',
    headers: { 'X-N8N-API-KEY': N8N_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'TEMP-ReadTranscriptForMigration',
      nodes: [
        {
          id: 'wh', name: 'Webhook', type: 'n8n-nodes-base.webhook', typeVersion: 2,
          position: [240, 0], webhookId: 'temp-migrate-001',
          parameters: { path: 'temp/migrate-read', httpMethod: 'POST', responseMode: 'lastNode', options: {} }
        },
        {
          id: 'gs', name: 'Read', type: 'n8n-nodes-base.googleSheets', typeVersion: 4.5,
          position: [480, 0],
          parameters: {
            operation: 'read',
            documentId: { __rl: true, mode: 'id', value: '19o_rIJxWPsy_PHcgTSj4zLbTPRbrAr3Ehj7JwyDDhP8' },
            sheetName: { __rl: true, mode: 'name', value: '謄本資料' },
            options: {}
          },
          credentials: { googleSheetsOAuth2Api: { id: 'kIePnQxc1pepXzbc', name: 'Google Sheets account' } }
        },
        {
          id: 'code', name: 'Format', type: 'n8n-nodes-base.code', typeVersion: 2,
          position: [720, 0],
          parameters: {
            jsCode: `const rows = $input.all();
return [{ json: { total: rows.length, rows: rows.map(r => r.json) } }];`
          }
        }
      ],
      connections: {
        'Webhook': { main: [[{ node: 'Read', type: 'main', index: 0 }]] },
        'Read': { main: [[{ node: 'Format', type: 'main', index: 0 }]] }
      },
      settings: { executionOrder: 'v1' }
    })
  });

  const wf = await createRes.json();
  const wfId = wf.id;
  console.log('   臨時 workflow:', wfId);

  // Activate
  await fetch(`https://findmyhome.zeabur.app/api/v1/workflows/${wfId}/activate`, {
    method: 'POST',
    headers: { 'X-N8N-API-KEY': N8N_KEY }
  });
  await new Promise(r => setTimeout(r, 2000));

  // Trigger and get data
  console.log('   觸發讀取...');
  const readRes = await fetch('https://findmyhome.zeabur.app/webhook/temp/migrate-read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}'
  });
  const sheetData = await readRes.json();

  // Delete temp workflow
  await fetch(`https://findmyhome.zeabur.app/api/v1/workflows/${wfId}`, {
    method: 'DELETE',
    headers: { 'X-N8N-API-KEY': N8N_KEY }
  });

  const rows = sheetData.rows || [];
  console.log(`   讀取到 ${rows.length} 筆\n`);

  if (rows.length === 0) {
    console.log('❌ 沒有資料，中止');
    return;
  }

  // Step 2: Transform to Supabase format
  console.log('2. 轉換格式...');
  const records = rows.map(r => ({
    community_name: r['社區名稱'] || '',
    community_address: r['社區地址'] || null,
    owner_name: r['所有人'] || null,
    owner_address: r['所有權人地址'] || null,
    pdf_url: r['PDF網址'] || null,
    land_section: r['地段'] || null,
    area_ping: parseNum(r['坪數']),
    total_ping: parseNum(r['總坪數']),
    building_ping: parseNum(r['建坪']),
    main_area_ping: parseNum(r['主建物(坪)']),
    accessory_area_ping: parseNum(r['附屬建物(坪)']),
    public_area_ping: parseNum(r['公設(坪)']),
    parking_area_ping: parseNum(r['車位(坪)']),
    id_prefix: r['統編開頭'] || null,
    registration_reason: r['登記原因'] || null,
    registration_date: r['登記時間'] || null,
    application_date: r['申請時間'] || null,
    registration_order: r['登記次序'] || null,
    rights_type: r['權利種類'] || null,
    mortgage_total: parseNum(r['擔保債權總金額']),
    public_common: r['大公設-面積'] || null,
    public_rights_scope: r['大公設-權利範圍'] || null,
    small_public_area: r['小公設-面積'] || null,
    small_public_rights: r['小公設-權利範圍'] || null,
    parking_number: r['車位-編號'] || null,
    parking_rights_scope: r['車位-權利範圍'] || null,
    extracted_date: r['擷取日期'] || null,
  })).filter(r => r.community_name && r.pdf_url);

  console.log(`   有效記錄: ${records.length} 筆\n`);

  // Step 3: Batch insert to Supabase
  console.log('3. 寫入 Supabase...');
  const BATCH_SIZE = 100;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/transcripts`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(batch)
    });

    if (res.ok) {
      inserted += batch.length;
    } else {
      const err = await res.text();
      console.log(`   ❌ Batch ${i}-${i + batch.length} failed: ${err.substring(0, 100)}`);
      errors += batch.length;
    }

    process.stdout.write(`   ${inserted}/${records.length} (${Math.round(inserted/records.length*100)}%)\r`);
  }

  console.log(`\n\n=== 完成 ===`);
  console.log(`✅ 成功: ${inserted} 筆`);
  if (errors > 0) console.log(`❌ 失敗: ${errors} 筆`);
}

function parseNum(val) {
  if (val === null || val === undefined || val === '' || val === '無') return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

main().catch(console.error);
