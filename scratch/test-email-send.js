const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testSignup() {
  const email = `test.user.${Date.now()}@example.com`;
  console.log(`Testing signup with email: ${email}`);
  const { data, error } = await supabase.auth.signUp({
    email,
    password: 'password123',
    options: {
      data: { full_name: 'Test User' }
    }
  });
  if (error) {
    console.error('Signup Error:', error);
  } else {
    console.log('Signup Data:', JSON.stringify(data, null, 2));
  }
}

testSignup();
