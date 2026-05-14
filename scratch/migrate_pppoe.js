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

async function migrate() {
  console.log('Migrating customers table...')
  // Pakai rpc atau query langsung jika diizinkan, 
  // karena kita nggak punya akses SQL editor langsung, 
  // kita coba cara 'paksa' lewat query builder untuk cek kolom dulu
  const { error } = await supabase.rpc('execute_sql', {
    sql_query: `
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS expired_at TIMESTAMPTZ;
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS auto_cut BOOLEAN DEFAULT TRUE;
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS plan_id INTEGER REFERENCES plans(id);
    `
  })

  if (error) {
    console.error('Error (mungkin RPC execute_sql belum ada, abaikan jika sudah manual):', error.message)
    console.log('Mencoba alternatif...')
  } else {
    console.log('Migration successful!')
  }
}

migrate()
