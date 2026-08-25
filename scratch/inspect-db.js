const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envPath = '/Users/syedmustafaahmed/Documents/CODE/symar/.env.local';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
    env[key] = val;
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'];
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const res = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`);
  const schema = await res.json();
  
  console.log("Payments columns:");
  console.log(schema.definitions.payments ? Object.keys(schema.definitions.payments.properties) : "None");
  console.log("Razorpay Events columns:");
  console.log(schema.definitions.razorpay_events ? Object.keys(schema.definitions.razorpay_events.properties) : "None");
}

main().catch(console.error);
