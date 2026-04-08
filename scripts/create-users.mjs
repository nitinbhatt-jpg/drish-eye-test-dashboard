const SUPABASE_URL = 'https://bnwmmxidqrtixoarvnlm.supabase.co';
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJud21teGlkcXJ0aXhvYXJ2bmxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMjY1OTYsImV4cCI6MjA4OTkwMjU5Nn0.L7MO31JRWBuYY4jHe3vDUKsRvWYXyWbIZzrKB8RNXCo';
const DEFAULT_PASSWORD = 'Lenskart@123';

const EMAILS = [
  'abhishek.abhishek3@fos.lenskart.in',
  'shruti.shruti3@fos.lenskart.in',
  'shariq.rehan@fos.lenskart.in',
  'manisha.manisha1@fos.lenskart.in',
  'raman.ganguly@fos.lenskart.in',
  'debannita.pal@fos.lenskart.in',
  'pratik.sarkar@fos.lenskart.in',
  'rimi.das@fos.lenskart.in',
  'yogesh.kumar3@fos.lenskart.in',
  'priya.das@fos.lenskart.in',
];

async function trySignIn(email) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: DEFAULT_PASSWORD }),
  });
  return res.ok;
}

async function signUp(email) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: DEFAULT_PASSWORD }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.msg || JSON.stringify(body));
  return body;
}

async function processEmail(email) {
  const exists = await trySignIn(email);
  if (exists) {
    console.log(`  ✓ ${email} — already exists`);
    return;
  }

  try {
    await signUp(email);
    console.log(`  ✓ ${email} — created`);
  } catch (err) {
    console.log(`  ✗ ${email} — ${err.message}`);
  }
}

console.log('Creating client accounts...\n');

for (const email of EMAILS) {
  await processEmail(email);
}

console.log('\nDone.');
