// Diagnostic script to start the Express API server, hit a test endpoint, and report results.
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import fetch from 'node-fetch';
import process from 'node:process';
import path from 'node:path';

const projectRoot = path.resolve(process.cwd());
const serverScript = path.join(projectRoot, 'api_express', 'index.js');

console.log('Spawning Express server for diagnostics...');
const server = spawn('node', [serverScript], {
  cwd: projectRoot,
  env: { ...process.env },
});

let serverRunning = false;
let serverExited = false;
let exitCode = null;

server.stdout.on('data', (chunk) => {
  const text = chunk.toString();
  process.stdout.write(`[server] ${text}`);
  if (text.includes('Sahay API running on port')) {
    serverRunning = true;
  }
});

server.stderr.on('data', (chunk) => {
  const text = chunk.toString();
  process.stderr.write(`[server-err] ${text}`);
});

server.on('exit', (code, signal) => {
  serverExited = true;
  exitCode = code;
  console.log(`[server] exited with code ${code} signal ${signal}`);
});

async function run() {
  // Wait up to 10 seconds for server to report ready
  const start = Date.now();
  while (!serverRunning && !serverExited && Date.now() - start < 10_000) {
    await delay(200);
  }

  if (!serverRunning) {
    console.error('Server did not report ready state within 10 seconds.');
    cleanup();
    return;
  }

  console.log('Server reported ready. Sending POST /api/mitra/test request...');

  try {
    const response = await fetch('http://localhost:4001/api/mitra/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Diagnostics ping' }),
    });
    const text = await response.text();
    console.log('Client received response status:', response.status);
    console.log('Client response body:', text);
  } catch (error) {
    console.error('Client request failed:', error);
  }

  // allow server output to flush
  await delay(2000);
  cleanup();
}

function cleanup() {
  if (!server.killed) {
    server.kill();
  }
  setTimeout(() => process.exit(exitCode ?? 0), 500);
}

run();
