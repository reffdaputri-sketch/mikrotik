const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const ws = require('ws')
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false },
    realtime: { transport: ws }
  }
)

async function checkColumns() {
  // Coba ambil satu data buat liat kolomnya apa saja
  const { data, error } = await supabase.from('customers').select('*').limit(1)
  
  if (error) {
    console.error('❌ Error fetching customers:', error.message)
    return
  }
  
  if (data && data.length >= 0) {
    console.log('✅ Columns found in customers table:')
    console.log(Object.keys(data[0] || {}))
  }
}

checkColumns()
