/**
 * Writes canonical `final_prescription` into two metadata JSON files in Storage
 * (tanu / divyanshi corrected AI Rx). Requires a Supabase **service role** key.
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

const FINAL_PRESCRIPTION_BY_FILE = {
  'session_1776239716153_metadata.json': {
    right: { sph: -0.5, cyl: -0.5, axis: 170, add: 0 },
    left: { sph: -0.5, cyl: -0.25, axis: 170, add: 0 },
  },
  'session_1776238444193_metadata.json': {
    right: { sph: 0, cyl: -1.25, axis: 160, add: 0 },
    left: { sph: 0, cyl: -2, axis: 15, add: 0 },
  },
};

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

for (const [path, final_prescription] of Object.entries(FINAL_PRESCRIPTION_BY_FILE)) {
  const doc = await loadJson(path);
  doc.final_prescription = final_prescription;
  await uploadJson(path, doc);
  console.log('Set final_prescription in', path);
}

console.log('Done.');
