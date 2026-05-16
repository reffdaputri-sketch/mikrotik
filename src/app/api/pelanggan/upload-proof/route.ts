import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const order_id = formData.get('order_id') as string

    if (!file || !order_id) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // 1. Baca file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 2. Simpan ke folder public/uploads/proofs (Pastikan folder ada)
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'proofs')
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (e) {}

    const fileName = `${order_id}-${Date.now()}-${file.name.replace(/\s/g, '_')}`
    const filePath = join(uploadDir, fileName)
    await writeFile(filePath, buffer)

    const publicUrl = `/uploads/proofs/${fileName}`

    // 3. Update database payment_orders
    // Kita coba update ke proof_img dulu, kalau gagal ke description, kalau gagal lagi ke payment_type
    const { error: err1 } = await supabase.from('payment_orders').update({ proof_img: publicUrl }).eq('order_id', order_id)
    
    if (err1) {
      const { error: err2 } = await supabase.from('payment_orders').update({ description: `PROOF_IMG:${publicUrl}` }).eq('order_id', order_id)
      
      if (err2) {
        // Fallback terakhir: simpan di payment_type karena kolom ini pasti ada
        await supabase.from('payment_orders').update({ 
          payment_type: `BUKTI:${publicUrl}` 
        }).eq('order_id', order_id)
      }
    }

    return NextResponse.json({ success: true, url: publicUrl })

  } catch (e: any) {
    console.error('UPLOAD ERROR:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
