/**
 * 遷移 v4：Google Sheets → n8n Code (httpRequest) → Supabase REST API
 * n8n 的 Code node 可以用 this.helpers.httpRequest 連到 Supabase
 */

const N8N_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0NzE0ZDM2ZC0xMWNiLTQ1NWMtYjk3Mi02N2JkOTE5NjE2OGYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiMjczZTJmY2MtZjY1OS00YjU4LThlNTktODRlMTg4NmJlZjBlIiwiaWF0IjoxNzcyNTI4NDgwfQ.zhD6EyDwOQlNEWvP1oOPhlPL6859eNHfEQSJri4HLhw';

async function n8nApi(method, path, body) {
  const res = await fetch(`https://findmyhome.zeabur.app/api/v1${path}`, {
    method,
    headers: { 'X-N8N-API-KEY': N8N_KEY, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

async function main() {
  console.log('=== 謄本遷移 v4 ===\n');

  const migrateCode = `
const items = $input.all();
const SB_URL = 'https://pqlftambvajgfbxfqyer.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxbGZ0YW1idmFqZ2ZieGZxeWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMjc1NDksImV4cCI6MjA4MTgwMzU0OX0.fWr5QhmH7kVZ0toNgU1NusaQDvO3zYpS_ljJAcqpyWk';

function pn(v) {
  if (v===null||v===undefined||v===''||v==='無') return null;
  const n=parseFloat(v); return isNaN(n)?null:n;
}

const records = items.filter(r => r.json['社區名稱'] && r.json['PDF網址']).map(r => {
  const j = r.json;
  return {
    community_name: j['社區名稱']||'',
    community_address: j['社區地址']||null,
    owner_name: j['所有人']||null,
    owner_address: j['所有權人地址']||null,
    pdf_url: j['PDF網址']||null,
    land_section: j['地段']||null,
    area_ping: pn(j['坪數']),
    total_ping: pn(j['總坪數']),
    building_ping: pn(j['建坪']),
    main_area_ping: pn(j['主建物(坪)']),
    accessory_area_ping: pn(j['附屬建物(坪)']),
    public_area_ping: pn(j['公設(坪)']),
    parking_area_ping: pn(j['車位(坪)']),
    id_prefix: j['統編開頭']||null,
    registration_reason: j['登記原因']||null,
    registration_date: j['登記時間']||null,
    application_date: j['申請時間']||null,
    registration_order: j['登記次序']||null,
    rights_type: j['權利種類']||null,
    mortgage_total: pn(j['擔保債權總金額']),
    public_common: j['大公設-面積']||null,
    public_rights_scope: j['大公設-權利範圍']||null,
    small_public_area: j['小公設-面積']||null,
    small_public_rights: j['小公設-權利範圍']||null,
    parking_number: j['車位-編號']||null,
    parking_rights_scope: j['車位-權利範圍']||null,
    extracted_date: j['擷取日期']||null,
  };
});

let inserted = 0, errors = 0, firstError = '';
const BATCH = 200;

for (let i = 0; i < records.length; i += BATCH) {
  const batch = records.slice(i, i + BATCH);
  try {
    await this.helpers.httpRequest({
      method: 'POST',
      url: SB_URL + '/rest/v1/transcripts',
      headers: {
        'apikey': SB_KEY,
        'Authorization': 'Bearer ' + SB_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: batch,
      json: true,
    });
    inserted += batch.length;
  } catch (e) {
    if (!firstError) firstError = e.message.substring(0, 200);
    errors += batch.length;
  }
}

return [{ json: { total: records.length, inserted, errors, firstError } }];
`;

  console.log('1. 建立 workflow...');
  const wf = await n8nApi('POST', '/workflows', {
    name: 'TEMP-MigrateV4',
    nodes: [
      {
        id: 'wh', name: 'Webhook', type: 'n8n-nodes-base.webhook', typeVersion: 2,
        position: [240, 0], webhookId: 'temp-migrate-v4',
        parameters: { path: 'temp/migrate-v4', httpMethod: 'POST', responseMode: 'lastNode', options: {} }
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
        id: 'code', name: 'Migrate', type: 'n8n-nodes-base.code', typeVersion: 2,
        position: [720, 0],
        parameters: { jsCode: migrateCode }
      }
    ],
    connections: {
      'Webhook': { main: [[{ node: 'ReadSheet', type: 'main', index: 0 }]] },
      'ReadSheet': { main: [[{ node: 'Migrate', type: 'main', index: 0 }]] }
    },
    settings: { executionOrder: 'v1' }
  });

  console.log('   Created:', wf.id);
  await n8nApi('POST', `/workflows/${wf.id}/activate`);
  await new Promise(r => setTimeout(r, 2000));

  console.log('\n2. 執行遷移...');
  const start = Date.now();

  const res = await fetch('https://findmyhome.zeabur.app/webhook/temp/migrate-v4', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
    signal: AbortSignal.timeout(600000),
  });

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  let data;
  try { data = await res.json(); } catch { data = { raw: await res.text() }; }

  console.log(`   耗時: ${elapsed}s | HTTP: ${res.status}`);
  console.log('   結果:', JSON.stringify(data));

  // Cleanup
  await n8nApi('DELETE', `/workflows/${wf.id}`);
  console.log('\n=== 完成 ===');
}

main().catch(console.error);
