import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://emhujwzikaltoahwtduc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtaHVqd3ppa2FsdG9haHd0ZHVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY4NjkxMCwiZXhwIjoyMDk0MjYyOTEwfQ.Qgyww19p-pQjX68plsDmYN48x32HRzbsB9uk9BAqOpw'
)

async function checkBuckets() {
  const { data, error } = await supabase.storage.listBuckets()
  if (error) {
    console.error('Error fetching buckets:', error)
    return
  }
  console.log('--- DAFTAR BUCKET ANDA ---')
  if (data.length === 0) {
    console.log('KOSONG! Belum ada bucket sama sekali.')
  } else {
    data.forEach(b => console.log(`- ${b.name} (${b.public ? 'Public' : 'Private'})`))
  }
}

checkBuckets()
