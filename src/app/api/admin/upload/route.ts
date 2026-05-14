import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validasi file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    const supabase = await createAdminClient()
    
    // Generate nama file unik biar gak bentrok
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
    
    // Konversi File ke Buffer untuk diupload
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload ke bucket 'uploads'
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Supabase upload error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Ambil URL publik
    const { data: publicUrlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(data.path)

    return NextResponse.json({ url: publicUrlData.publicUrl })
    
  } catch (err: any) {
    console.error('Upload handler error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
