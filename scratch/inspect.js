const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = envLocal.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = envLocal.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

if (!urlMatch || !keyMatch) {
  console.error("Missing credentials in .env.local");
  process.exit(1);
}

const supabaseUrl = urlMatch[1].trim();
const supabaseKey = keyMatch[1].trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  const tables = [
    'profiles', 'themes', 'stores', 'store_settings', 'categories', 'collections',
    'products', 'product_images', 'subscriptions', 'creative_orders', 'notifications',
    'activity_logs', 'analytics_daily', 'orders', 'order_items', 'storefront_events',
    'payments', 'razorpay_events'
  ];

  console.log("=== INSPECTING TABLES ===");
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`[x] ${table}: ${error.message} (${error.code})`);
    } else {
      console.log(`[ok] ${table} exists (Rows found: ${data.length})`);
    }
  }
}

inspect().catch(console.error);
