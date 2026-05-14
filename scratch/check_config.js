const { createClient } = require('@supabase/supabase-js')
const ws = require('ws')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false },
    realtime: { transport: ws }
  }
)

async function checkConfig() {
  console.log('Checking app_config table...')
  const { data, error } = await supabase.from('app_config').select('*')
  if (error) {
    console.error('Error:', error.message)
    return
  }
  console.log('Raw Data:', JSON.stringify(data, null, 2))
}

checkConfig()
