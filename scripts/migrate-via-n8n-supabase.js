/**
 * 遷移：Google Sheets → n8n Supabase Node → Supabase
 * 使用 n8n 內建的 Supabase credential
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
  console.log('=== 謄本遷移 v3：使用 n8n Supabase Node ===\n');

  // Transform code: map Sheet columns to Supabase columns
  const transformCode = `
const items = $input.all();
function pn(v) {
  if (v===null||v===undefined||v===''||v==='無') return null;
  const n=parseFloat(v); return isNaN(n)?null:n;
}
return items.filter(r => r.json['社區名稱'] && r.json['PDF網址']).map(r => {
  const j = r.json;
  return { json: {
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
  }};
});`;

  console.log('1. 建立遷移 workflow...');
  const wf = await n8nApi('POST', '/workflows', {
    name: 'TEMP-MigrateV3',
    nodes: [
      {
        id: 'wh', name: 'Webhook', type: 'n8n-nodes-base.webhook', typeVersion: 2,
        position: [240, 0], webhookId: 'temp-migrate-v3',
        parameters: { path: 'temp/migrate-v3', httpMethod: 'POST', responseMode: 'lastNode', options: {} }
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
        id: 'code', name: 'Transform', type: 'n8n-nodes-base.code', typeVersion: 2,
        position: [720, 0],
        parameters: { jsCode: transformCode }
      },
      {
        id: 'sb', name: 'Supabase', type: 'n8n-nodes-base.supabase', typeVersion: 1,
        position: [960, 0],
        parameters: {
          operation: 'upsert',
          tableId: 'transcripts',
          conflictFields: 'community_name,pdf_url',
          autoMapInputData: true,
        },
        credentials: { supabaseApi: { id: 'MYs7zqrskqeO03T1', name: 'Supabase account-房屋系統' } }
      }
    ],
    connections: {
      'Webhook': { main: [[{ node: 'ReadSheet', type: 'main', index: 0 }]] },
      'ReadSheet': { main: [[{ node: 'Transform', type: 'main', index: 0 }]] },
      'Transform': { main: [[{ node: 'Supabase', type: 'main', index: 0 }]] }
    },
    settings: { executionOrder: 'v1' }
  });

  console.log('   Created:', wf.id);
  await n8nApi('POST', `/workflows/${wf.id}/activate`);
  console.log('   Activated\n');
  await new Promise(r => setTimeout(r, 2000));

  // Trigger
  console.log('2. 執行遷移（13,046 筆，約 2-5 分鐘）...');
  const start = Date.now();

  const result = await fetch('https://findmyhome.zeabur.app/webhook/temp/migrate-v3', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
    signal: AbortSignal.timeout(600000),
  });

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  const status = result.status;
  let body = '';
  try { body = await result.text(); } catch {}

  console.log(`   耗時: ${elapsed}s`);
  console.log(`   HTTP: ${status}`);
  console.log(`   結果: ${body.substring(0, 300)}`);

  // Cleanup
  console.log('\n3. 清理...');
  await n8nApi('DELETE', `/workflows/${wf.id}`);
  console.log('   Done');

  console.log('\n=== 遷移完成 ===');
}

main().catch(console.error);
