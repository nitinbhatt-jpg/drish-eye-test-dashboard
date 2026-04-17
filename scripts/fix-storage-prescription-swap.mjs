/**
 * Rewrites `final_prescription` inside two known metadata JSON files in Storage
 * (corrects swapped AI Rx). Requires a Supabase **service role** key (bypasses RLS).
 *
 * Usage (from repo root):
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/fix-storage-prescription-swap.mjs
 *
 * Env: VITE_SUPABASE_URL (or SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadDotEnv() {
  try {
    const raw = readFileSync(join(__dirname, '..', '.env'), 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  } catch {
    /* no .env */
  }
}

loadDotEnv();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Set VITE_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const BUCKET = 'Eye_Test_logs';
const PAIRS = [
  ['session_1776239716153_metadata.json', 'session_1776238444193_metadata.json'],
];

const supabase = createClient(url, serviceKey);

async function loadJson(path) {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error) throw error;
  return JSON.parse(await data.text());
}

async function uploadJson(path, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    upsert: true,
    contentType: 'application/json',
  });
  if (error) throw error;
}

for (const [a, b] of PAIRS) {
  const [ja, jb] = await Promise.all([loadJson(a), loadJson(b)]);
  const fpA = ja.final_prescription;
  const fpB = jb.final_prescription;
  ja.final_prescription = fpB;
  jb.final_prescription = fpA;
  await Promise.all([uploadJson(a, ja), uploadJson(b, jb)]);
  console.log('Swapped final_prescription in', a, '<->', b);
}

console.log('Done.');
