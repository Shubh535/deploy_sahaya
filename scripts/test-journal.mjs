// Test built Next.js API route handlers without HTTP
// Usage: node scripts/test-journal.mjs

import { resolve } from 'node:path';
import { config as dotenvConfig } from 'dotenv';

// Load environment (.env.local) so GEMINI_API_KEY is available
dotenvConfig({ path: resolve(process.cwd(), '.env.local') });

process.env.DEV_BYPASS_AUTH = process.env.DEV_BYPASS_AUTH || '1';
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

function makeMockRequest(body, options = {}) {
  const { url = 'http://localhost/mock', headers = {} } = options;
  const headersMap = new Map([
    ['x-dev-auth', 'allow'],
    ['content-type', 'application/json']
  ]);
  for (const [key, value] of Object.entries(headers)) {
    headersMap.set(String(key).toLowerCase(), value);
  }
  return {
    headers: {
      get: (k) => headersMap.get(String(k).toLowerCase()) || null,
    },
    async json() {
      return body;
    },
    // URL not used by these handlers
    url
  };
}

async function run() {
  // Quick diagnostics: list available models for this key
  try {
    const lmRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const lmJson = await lmRes.json();
    console.log('ListModels status:', lmRes.status);
    if (lmJson?.models) {
      console.log('First 5 models:', lmJson.models.slice(0, 5).map(m => m.name));
    } else {
      console.log('ListModels response:', lmJson);
    }
  } catch (e) {
    console.log('ListModels failed:', e);
  }

  // Sanity check: call generateContent on a known-available model
  try {
    const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const testRes = await fetch(testUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'Say hello in one word.' }] }] }),
    });
    const testJson = await testRes.json();
    console.log('Direct 2.5 generateContent status:', testRes.status);
    if (!testRes.ok) console.log('Direct 2.5 error:', JSON.stringify(testJson));
  } catch (e) {
    console.log('Direct 2.5 generateContent failed:', e);
  }

  const base = '../.next/server/app/api/journal';
  const reflectMod = await import(`${base}/reflection-prompts/route.js`);
  const insightsMod = await import(`${base}/insights/route.js`);
  const analyzeMod = await import(`${base}/analyze/route.js`);
  const unifiedMod = await import('../.next/server/app/api/unified/route.js');

  function extractPOST(mod) {
    if (!mod) return null;
    // Direct export
    if (typeof mod.POST === 'function') return mod.POST;
    // Next 15 App Route compiled shape exposes routeModule with userland
    if (mod.routeModule && mod.routeModule.userland && typeof mod.routeModule.userland.POST === 'function') {
      return mod.routeModule.userland.POST;
    }
    // Some builds may expose userland directly
    if (mod.userland && typeof mod.userland.POST === 'function') return mod.userland.POST;
    // Default export with POST
    if (mod.default) {
      if (typeof mod.default.POST === 'function') return mod.default.POST;
      if (mod.default.routeModule && mod.default.routeModule.userland && typeof mod.default.routeModule.userland.POST === 'function') {
        return mod.default.routeModule.userland.POST;
      }
      if (mod.default.userland && typeof mod.default.userland.POST === 'function') return mod.default.userland.POST;
    }
    return null;
  }

  console.log('--- Testing reflection-prompts ---');
  // Debug module shape when extracting POST
  // eslint-disable-next-line no-console
  console.log('reflectMod keys:', Object.keys(reflectMod));
  if (reflectMod.default) {
    // eslint-disable-next-line no-console
    console.log('reflectMod.default keys:', Object.keys(reflectMod.default));
  }
  if (reflectMod.routeModule) {
    // eslint-disable-next-line no-console
    console.log('routeModule keys:', Object.keys(reflectMod.routeModule));
    if (reflectMod.routeModule.userland) {
      // eslint-disable-next-line no-console
      console.log('userland keys:', Object.keys(reflectMod.routeModule.userland));
    }
  }
  const reflectPOST = extractPOST(reflectMod);
  if (!reflectPOST) {
    throw new TypeError('Could not locate POST handler for reflection-prompts');
  }
  const req1 = makeMockRequest({ type: 'daily' });
  const res1 = await reflectPOST(req1);
  const src1 = res1.headers.get('x-ai-source');
  const txt1 = await res1.text();
  console.log('status:', res1.status, 'source:', src1);
  console.log('body:', txt1);

  console.log('\n--- Testing insights ---');
  const insightsPOST = extractPOST(insightsMod);
  if (!insightsPOST) {
    throw new TypeError('Could not locate POST handler for insights');
  }
  const req2 = makeMockRequest({ type: 'daily', responses: ['I am grateful for my family.'], emotionalState: { before: 5, emotions: ['calm'] } });
  const res2 = await insightsPOST(req2);
  const src2 = res2.headers.get('x-ai-source');
  const txt2 = await res2.text();
  console.log('status:', res2.status, 'source:', src2);
  console.log('body:', txt2);

  console.log('\n--- Testing analyze ---');
  const analyzePOST = extractPOST(analyzeMod);
  if (!analyzePOST) {
    throw new TypeError('Could not locate POST handler for analyze');
  }
  const analyzeReq = makeMockRequest({ entry: 'Today was a mix of stress and hope.' });
  const analyzeRes = await analyzePOST(analyzeReq);
  const analyzeBody = await analyzeRes.text();
  console.log('status:', analyzeRes.status, 'body:', analyzeBody);

  console.log('\n--- Testing practice simulate ---');
  const unifiedPOST = extractPOST(unifiedMod);
  if (!unifiedPOST) {
    throw new TypeError('Could not locate POST handler for unified route');
  }
  const practiceReq = makeMockRequest(
    { scenario: 'assertive', userInput: 'I need some space this weekend.', history: [] },
    { url: 'http://localhost/mock?action=practice-simulate' }
  );
  const practiceRes = await unifiedPOST(practiceReq);
  const practiceBody = await practiceRes.text();
  console.log('status:', practiceRes.status, 'body:', practiceBody);
}

run().catch((e) => {
  console.error('Test failed:', e);
  process.exit(1);
});
