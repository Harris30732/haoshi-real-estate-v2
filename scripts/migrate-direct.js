/**
 * 遷移：Google Sheets (via n8n) → 本地 → Supabase REST API
 */
const SB_URL = 'https://sglxyvexpdmdwfsuypvi.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnbHh5dmV4cGRtZHdmc3V5cHZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMDAzMDEsImV4cCI6MjA5MDc3NjMwMX0.vb70rnvY0QaYneGc1S-gt_gDt0NnKQ-BzxdU5XfxjBg';
const N8N_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0NzE0ZDM2ZC0xMWNiLTQ1NWMtYjk3Mi02N2JkOTE5NjE2OGYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiMjczZTJmY2MtZjY1OS00YjU4LThlNTktODRlMTg4NmJlZjBlIiwiaWF0IjoxNzcyNTI4NDgwfQ.zhD6EyDwOQlNEWvP1oOPhlPL6859eNHfEQSJri4HLhw';

function pn(v) {
  if (v === null || v === undefined || v === '' || v === '無') return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

async function main() {
  console.log('=== 謄本遷移：Sheet → Supabase ===\n');

  // Step 1: Read from Google Sheets via n8n temp workflow
  console.log('1. 讀取 Google Sheets...');
  const wfRes = await fetch('https://findmyhome.zeabur.app/api/v1/workflows', {
    method: 'POST',
    headers: { 'X-N8N-API-KEY': N8N_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'TEMP-Read',
      nodes: [
        { id: 'wh', name: 'Webhook', type: 'n8n-nodes-base.webhook', typeVersion: 2, position: [240,0], webhookId: 'tmp-rd-final',
          parameters: { path: 'temp/read-final', httpMethod: 'POST', responseMode: 'lastNode', options: {} } },
        { id: 'gs', name: 'Read', type: 'n8n-nodes-base.googleSheets', typeVersion: 4.5, position: [480,0],
          parameters: { operation: 'read', documentId: { __rl: true, mode: 'id', value: '19o_rIJxWPsy_PHcgTSj4zLbTPRbrAr3Ehj7JwyDDhP8' },
            sheetName: { __rl: true, mode: 'name', value: '謄本資料' }, options: {} },
          credentials: { googleSheetsOAuth2Api: { id: 'kIePnQxc1pepXzbc', name: 'Google Sheets account' } } },
        { id: 'c', name: 'Pack', type: 'n8n-nodes-base.code', typeVersion: 2, position: [720,0],
          parameters: { jsCode: 'return [{ json: { rows: $input.all().map(r=>r.json) } }];' } }
      ],
      connections: { 'Webhook': { main: [[{ node: 'Read', type: 'main', index: 0 }]] }, 'Read': { main: [[{ node: 'Pack', type: 'main', index: 0 }]] } },
      settings: { executionOrder: 'v1' }
    })
  });
  const wf = await wfRes.json();
  await fetch(`https://findmyhome.zeabur.app/api/v1/workflows/${wf.id}/activate`, { method: 'POST', headers: { 'X-N8N-API-KEY': N8N_KEY } });
  await new Promise(r => setTimeout(r, 2000));

  const readRes = await fetch('https://findmyhome.zeabur.app/webhook/temp/read-final', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  const { rows } = await readRes.json();
  await fetch(`https://findmyhome.zeabur.app/api/v1/workflows/${wf.id}`, { method: 'DELETE', headers: { 'X-N8N-API-KEY': N8N_KEY } });
  console.log(`   ${rows.length} 筆\n`);

  // Step 2: Transform
  const records = rows.filter(r => r['社區名稱'] && r['PDF網址']).map(r => ({
    community_name: r['社區名稱'] || '',
    community_address: r['社區地址'] || null,
    owner_name: r['所有人'] || null,
    owner_address: r['所有權人地址'] || null,
    pdf_url: r['PDF網址'] || null,
    land_section: r['地段'] || null,
    area_ping: pn(r['坪數']),
    total_ping: pn(r['總坪數']),
    building_ping: pn(r['建坪']),
    main_area_ping: pn(r['主建物(坪)']),
    accessory_area_ping: pn(r['附屬建物(坪)']),
    public_area_ping: pn(r['公設(坪)']),
    parking_area_ping: pn(r['車位(坪)']),
    id_prefix: r['統編開頭'] || null,
    registration_reason: r['登記原因'] || null,
    registration_date: r['登記時間'] || null,
    application_date: r['申請時間'] || null,
    registration_order: r['登記次序'] || null,
    rights_type: r['權利種類'] || null,
    mortgage_total: pn(r['擔保債權總金額']),
    public_common: r['大公設-面積'] || null,
    public_rights_scope: r['大公設-權利範圍'] || null,
    small_public_area: r['小公設-面積'] || null,
    small_public_rights: r['小公設-權利範圍'] || null,
    parking_number: r['車位-編號'] || null,
    parking_rights_scope: r['車位-權利範圍'] || null,
    extracted_date: r['擷取日期'] || null,
  }));
  console.log(`2. 有效記錄: ${records.length}\n`);

  // Step 3: Batch insert to Supabase
  console.log('3. 寫入 Supabase...');
  const BATCH = 200;
  let ok = 0, fail = 0, firstErr = '';

  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH);
    const res = await fetch(`${SB_URL}/rest/v1/transcripts`, {
      method: 'POST',
      headers: {
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(batch),
    });
    if (res.ok) {
      ok += batch.length;
    } else {
      const err = await res.text();
      if (!firstErr) firstErr = err.substring(0, 200);
      fail += batch.length;
    }
    process.stdout.write(`   ${ok + fail}/${records.length} (ok:${ok} fail:${fail})\r`);
  }

  console.log(`\n\n=== 完成 ===`);
  console.log(`✅ 成功: ${ok}`);
  if (fail > 0) { console.log(`❌ 失敗: ${fail}`); console.log(`   原因: ${firstErr}`); }
}

main().catch(console.error);
