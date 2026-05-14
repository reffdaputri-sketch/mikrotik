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

async function checkQueue() {
  console.log('Checking mikrotik_command_queue table...')
  try {
    const { data, error } = await supabase
      .from('mikrotik_command_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (error) {
      console.error('Error fetching queue:', error.message)
      return
    }
    
    if (!data || data.length === 0) {
      console.log('No commands found in queue!')
    } else {
      console.log('Recent commands:')
      data.forEach(c => {
        console.log(`ID: ${c.id}, Command: ${c.command}, Status: ${c.status}, Created: ${c.created_at}`)
      })
    }
  } catch (err) {
    console.error('Catch error:', err.message)
  }
}

checkQueue()
