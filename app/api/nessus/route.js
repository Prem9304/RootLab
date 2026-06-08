import { NextResponse } from 'next/server';
import https from 'https';
import { URL } from 'url';

/**
 * Wraps Node's native https.request in a Promise.
 * Uses rejectUnauthorized:false to handle Nessus's self-signed cert.
 * We use this instead of fetch/undici because undici throws an
 * AssertionError (ERR_ASSERTION) on Nessus's non-standard TLS teardown.
 */
function nessusRequest(endpoint, method, headers, bodyStr) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(endpoint);

    const options = {
      hostname: parsed.hostname,
      port: parsed.port || 8834,
      path: parsed.pathname + parsed.search,
      method: method || 'GET',
      headers,
      rejectUnauthorized: false, // Nessus uses a self-signed cert
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, raw }));
    });

    req.on('error', reject);

    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

export async function POST(request) {
  try {
    const { url, accessKey, secretKey, endpoint, method, body } = await request.json();

    if (!url || !accessKey || !secretKey || !endpoint) {
      return NextResponse.json(
        { error: 'Missing required Nessus authentication or endpoint data' },
        { status: 400 }
      );
    }

    const nessusEndpoint = `${url.replace(/\/$/, '')}${endpoint}`;

    const headers = {
      'X-ApiKeys': `accessKey=${accessKey}; secretKey=${secretKey};`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    let bodyStr = null;
    if (body && (method === 'POST' || method === 'PUT')) {
      bodyStr = JSON.stringify(body);
      headers['Content-Length'] = Buffer.byteLength(bodyStr).toString();
    }

    const { status, raw } = await nessusRequest(nessusEndpoint, method, headers, bodyStr);

    let data = {};
    
    // Safely attempt to parse the response, handling empty bodies (like 412s)
    if (raw && raw.trim() !== '') {
      try { 
        data = JSON.parse(raw); 
      } catch { 
        data = { rawText: raw }; 
      }
    }

    // If Nessus returns an error status, surface the EXACT error message to the frontend
    if (status >= 400) {
      const errorMessage = data.error || data.message || (raw && raw.trim() !== '' ? raw : `Nessus API rejected request with HTTP ${status}`);
      return NextResponse.json(
        { error: errorMessage, details: data },
        { status }
      );
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('Error proxying to Nessus API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}