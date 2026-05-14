import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://emhujwzikaltoahwtduc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtaHVqd3ppa2FsdG9haHd0ZHVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY4NjkxMCwiZXhwIjoyMDk0MjYyOTEwfQ.Qgyww19p-pQjX68plsDmYN48x32HRzbsB9uk9BAqOpw'
)

async function checkPlans() {
  const { data, error } = await supabase
    .from('plans')
    .select('*')
  
  if (error) {
    console.error('Error fetching plans:', error)
    return
  }
  
  console.log('--- ISI TABEL PLANS ---')
  if (data.length === 0) {
    console.log('Tabel plans KOSONG MELOMPONG!')
  } else {
    data.forEach(p => {
      console.log(`- Nama: ${p.name_plan}, Tipe: ${p.type}, Enabled: ${p.enabled}, Public: ${p.is_public}`)
    })
  }
  console.log('-----------------------')
}

checkPlans()
