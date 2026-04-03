/**
 * 遷移腳本：Google Sheets → n8n → Supabase
 * 透過 n8n 做中轉，因為本地 DNS 解析不到 Supabase
 */

const N8N_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0NzE0ZDM2ZC0xMWNiLTQ1NWMtYjk3Mi02N2JkOTE5NjE2OGYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiMjczZTJmY2MtZjY1OS00YjU4LThlNTktODRlMTg4NmJlZjBlIiwiaWF0IjoxNzcyNTI4NDgwfQ.zhD6EyDwOQlNEWvP1oOPhlPL6859eNHfEQSJri4HLhw';
const SUPABASE_URL = 'https://pqlftambvajgfbxfqyer.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxbGZ0YW1idmFqZ2ZieGZxeWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMjc1NDksImV4cCI6MjA4MTgwMzU0OX0.fWr5QhmH7kVZ0toNgU1NusaQDvO3zYpS_ljJAcqpyWk';

async function n8nApi(method, path, body) {
  const res = await fetch(`https://findmyhome.zeabur.app/api/v1${path}`, {
    method,
    headers: { 'X-N8N-API-KEY': N8N_KEY, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

async function main() {
  console.log('=== 謄本遷移：Google Sheets → n8n → Supabase ===\n');

  // Create a workflow that: reads Sheet → inserts to Supabase
  console.log('1. 建立遷移 workflow...');

  const migrateCode = `
const items = $input.all();
const SUPABASE_URL = '${SUPABASE_URL}';
const SUPABASE_KEY = '${SUPABASE_KEY}';
const BATCH_SIZE = 200;

function parseNum(val) {
  if (val === null || val === undefined || val === '' || val === '無') return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

const records = items.map(r => r.json).filter(r => r['社區名稱'] && r['PDF網址']).map(r => ({
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
}));

let inserted = 0;
let errors = 0;

for (let i = 0; i < records.length; i += BATCH_SIZE) {
  const batch = records.slice(i, i + BATCH_SIZE);
  try {
    const res = await this.helpers.httpRequest({
      method: 'POST',
      url: SUPABASE_URL + '/rest/v1/transcripts',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(batch),
      returnFullResponse: true,
    });
    inserted += batch.length;
  } catch (e) {
    console.log('Batch ' + i + ' error: ' + e.message);
    errors += batch.length;
  }
}

return [{ json: { total: records.length, inserted, errors } }];
`;

  const wf = await n8nApi('POST', '/workflows', {
    name: 'TEMP-MigrateTranscripts',
    nodes: [
      {
        id: 'wh', name: 'Webhook', type: 'n8n-nodes-base.webhook', typeVersion: 2,
        position: [240, 0], webhookId: 'temp-migrate-002',
        parameters: { path: 'temp/migrate', httpMethod: 'POST', responseMode: 'lastNode', options: {} }
      },
      {
        id: 'gs', name: 'ReadSheet', type: 'n8n-nodes-base.googleSheets', typeVersion: 4.5,
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
        id: 'code', name: 'MigrateToSupabase', type: 'n8n-nodes-base.code', typeVersion: 2,
        position: [720, 0],
        parameters: { jsCode: migrateCode }
      }
    ],
    connections: {
      'Webhook': { main: [[{ node: 'ReadSheet', type: 'main', index: 0 }]] },
      'ReadSheet': { main: [[{ node: 'MigrateToSupabase', type: 'main', index: 0 }]] }
    },
    settings: { executionOrder: 'v1' }
  });

  console.log('   Created:', wf.id);

  // Activate
  await n8nApi('POST', `/workflows/${wf.id}/activate`);
  console.log('   Activated\n');
  await new Promise(r => setTimeout(r, 2000));

  // Trigger - this will take a while (13k records)
  console.log('2. 執行遷移（約 1-2 分鐘）...');
  const startTime = Date.now();

  const result = await fetch('https://findmyhome.zeabur.app/webhook/temp/migrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
    signal: AbortSignal.timeout(300000), // 5 min timeout
  });

  const data = await result.json();
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`   耗時: ${elapsed}s`);
  console.log(`   結果:`, JSON.stringify(data));

  // Cleanup
  console.log('\n3. 清理臨時 workflow...');
  await n8nApi('DELETE', `/workflows/${wf.id}`);
  console.log('   Deleted');

  console.log('\n=== 遷移完成 ===');
  console.log(`✅ 寫入: ${data.inserted || 0} 筆`);
  if (data.errors > 0) console.log(`❌ 失敗: ${data.errors} 筆`);
}

main().catch(console.error);
