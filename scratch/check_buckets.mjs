import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkBuckets() {
  const { data, error } = await supabase.storage.listBuckets()
  if (error) {
    console.error('Error fetching buckets:', error)
    return
  }
  console.log('--- Daftar Bucket di Supabase Anda ---')
  if (data.length === 0) {
    console.log('Waduh, belum ada bucket sama sekali!')
  } else {
    data.forEach(b => console.log(`- ${b.name} (${b.public ? 'Public' : 'Private'})`))
  }
  console.log('--------------------------------------')
}

checkBuckets()
