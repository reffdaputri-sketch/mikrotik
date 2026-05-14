import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan password wajib diisi' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    console.log('Attempting login for:', username)

    // Cari admin user di database
    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', username.toLowerCase())
      .eq('status', 'Active')
      .single()

    if (error || !adminUser) {
      console.log('User not found or error:', error?.message)
      return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 })
    }

    console.log('User found, verifying password...')

    // Verifikasi password
    const isValid = await bcrypt.compare(password, adminUser.password_hash)
    
    console.log('Password valid:', isValid)

    if (!isValid) {
      return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 })
    }

    // Update last_login
    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', adminUser.id)

    // Set session cookie
    const cookieStore = await cookies()
    const sessionData = {
      id: adminUser.id,
      username: adminUser.username,
      fullname: adminUser.fullname,
      user_type: adminUser.user_type,
      expires: Date.now() + 86400000 * 7, // 7 hari
    }

    cookieStore.set('nuxbill_session', Buffer.from(JSON.stringify(sessionData)).toString('base64'), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 86400 * 7,
      path: '/',
      sameSite: 'lax',
    })

    return NextResponse.json({
      success: true,
      user: { id: adminUser.id, username: adminUser.username, user_type: adminUser.user_type }
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
