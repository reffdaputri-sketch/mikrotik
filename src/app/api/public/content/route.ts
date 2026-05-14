import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createAdminClient()
  
  // Ambil Banners yang aktif
  const { data: banners } = await supabase
    .from('banners')
    .select('id, title, image_url, link_url')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  // Ambil News yang aktif
  const { data: news } = await supabase
    .from('news')
    .select('id, title, content, image_url, created_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return NextResponse.json({ 
    banners: banners || [],
    news: news || []
  })
}
