const https = require('https');

function req(label, hostname, path, method, body) {
  return new Promise(resolve => {
    const opts = { hostname, path, method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));
    const r = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        const preview = d.slice(0, 100).replace(/\n/g, ' ');
        console.log(`[${label}] HTTP ${res.statusCode}: ${preview}`);
        resolve({ status: res.statusCode, body: d });
      });
    });
    r.on('error', e => { console.log(`[${label}] ERR: ${e.message}`); resolve(null); });
    r.setTimeout(20000, () => { console.log(`[${label}] TIMEOUT`); r.destroy(); resolve(null); });
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

(async () => {
  console.log('=== 1. Azure App Service (direct API) ===');
  await req('health-direct', 'recai-api.azurewebsites.net', '/health', 'GET');
  const loginResult = await req('login-admin', 'recai-api.azurewebsites.net', '/api/auth/login', 'POST', { username: 'admin', password: 'Admin@2026#' });
  await req('login-recruiter', 'recai-api.azurewebsites.net', '/api/auth/login', 'POST', { username: 'recruiter1', password: 'RecAI@2026#' });
  await req('login-wrong', 'recai-api.azurewebsites.net', '/api/auth/login', 'POST', { username: 'admin', password: 'wrongpassword' });

  // Test protected endpoint without token (expect 401)
  await req('candidates-no-auth', 'recai-api.azurewebsites.net', '/api/candidates', 'GET');

  // Test protected endpoint with token
  if (loginResult && loginResult.status === 200) {
    const parsed = JSON.parse(loginResult.body);
    const token = parsed.token;
    console.log(`  -> role=${parsed.role}, workspaceId=${parsed.workspaceId}`);

    // With auth, no workspaceId (should 400 or 200 empty)
    const opts1 = { hostname: 'recai-api.azurewebsites.net', path: '/api/candidates', method: 'GET', headers: { 'Authorization': `Bearer ${token}` } };
    await new Promise(resolve => {
      const r = https.request(opts1, res => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>{ console.log(`[candidates-with-auth-no-ws] HTTP ${res.statusCode}: ${d.slice(0,100)}`); resolve(); }); });
      r.on('error', e => { console.log(`[candidates-with-auth-no-ws] ERR: ${e.message}`); resolve(); }); r.end();
    });

    // With auth + valid empty GUID (should return empty array)
    const opts2 = { hostname: 'recai-api.azurewebsites.net', path: '/api/candidates?workspaceId=00000000-0000-0000-0000-000000000001', method: 'GET', headers: { 'Authorization': `Bearer ${token}` } };
    await new Promise(resolve => {
      const r = https.request(opts2, res => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>{ console.log(`[candidates-with-ws] HTTP ${res.statusCode}: ${d.slice(0,100)}`); resolve(); }); });
      r.on('error', e => { console.log(`[candidates-with-ws] ERR: ${e.message}`); resolve(); }); r.end();
    });

    // Test /api/job-descriptions (another protected endpoint)
    const opts3 = { hostname: 'recai-api.azurewebsites.net', path: '/api/job-descriptions?workspaceId=00000000-0000-0000-0000-000000000001', method: 'GET', headers: { 'Authorization': `Bearer ${token}` } };
    await new Promise(resolve => {
      const r = https.request(opts3, res => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>{ console.log(`[job-descriptions-with-auth] HTTP ${res.statusCode}: ${d.slice(0,100)}`); resolve(); }); });
      r.on('error', e => { console.log(`[job-descriptions-with-auth] ERR: ${e.message}`); resolve(); }); r.end();
    });
  }

  console.log('\n=== 2. Azure SWA proxy ===');
  await req('swa-health', 'calm-pebble-072f5e100.6.azurestaticapps.net', '/api/health', 'GET');
  await req('swa-login', 'calm-pebble-072f5e100.6.azurestaticapps.net', '/api/auth/login', 'POST', { username: 'admin', password: 'Admin@2026#' });

  console.log('\n=== DONE ===');
})();
