import { NextResponse } from 'next/server'

const WA_AGENT_URL = 'https://wa.baharimedika.com'
const WA_TOKEN = process.env.WA_GATEWAY_TOKEN || 'purnamawifi_wa_secure_key_8b99d45e7f12a3d0'

// Proxy GET status or GET qr
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'status' // 'status' atau 'qr'

    const targetUrl = action === 'qr' ? `${WA_AGENT_URL}/qr` : `${WA_AGENT_URL}/status`

    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${WA_TOKEN}`
      },
      // Penting: Elak caching pada status/QR
      cache: 'no-store'
    })

    if (!res.ok) {
      const errText = await res.text()
      return NextResponse.json({ error: `Ejen ralat: ${res.status}`, details: errText }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('[WA-PROXY-GET] Error:', err.message)
    return NextResponse.json({ error: 'Tidak dapat berhubung dengan WA Agent. Pastikan ejen sedang berjalan.' }, { status: 503 })
  }
}

// Proxy POST disconnect
export async function POST(request: Request) {
  try {
    const res = await fetch(`${WA_AGENT_URL}/disconnect`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WA_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })

    if (!res.ok) {
      const errText = await res.text()
      return NextResponse.json({ error: `Ejen ralat: ${res.status}`, details: errText }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('[WA-PROXY-POST] Error:', err.message)
    return NextResponse.json({ error: 'Gagal menghantar permintaan ke WA Agent' }, { status: 503 })
  }
}
