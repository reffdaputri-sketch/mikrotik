import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getWaAgentConfig() {
  let agentUrl = 'https://server.internetdesa.site'
  let token = process.env.WA_GATEWAY_TOKEN || 'purnamawifi_wa_secure_key_8b99d45e7f12a3d0'

  if (process.env.WA_GATEWAY_URL) {
    agentUrl = process.env.WA_GATEWAY_URL.replace(/\/send$/, '').replace(/\/$/, '')
  }

  try {
    const { data } = await supabase.from('app_config').select('setting, value').in('setting', ['whatsapp_gateway_url', 'whatsapp_api_key'])
    if (data) {
      const urlSetting = data.find(i => i.setting === 'whatsapp_gateway_url')?.value
      const tokenSetting = data.find(i => i.setting === 'whatsapp_api_key')?.value
      if (urlSetting && urlSetting.trim() !== '') {
        agentUrl = urlSetting.replace(/\/send$/, '').replace(/\/$/, '')
      }
      if (tokenSetting && tokenSetting.trim() !== '') {
        token = tokenSetting
      }
    }
  } catch (err) {
    console.error('[WA-PROXY] Gagal mengambil konfigurasi dari database:', err)
  }

  return { agentUrl, token }
}

// Proxy GET status or GET qr
export async function GET(request: Request) {
  try {
    const { agentUrl, token } = await getWaAgentConfig()
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'status' // 'status' atau 'qr'

    const targetUrl = action === 'qr' ? `${agentUrl}/qr` : `${agentUrl}/status`

    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
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
    const { agentUrl, token } = await getWaAgentConfig()
    const res = await fetch(`${agentUrl}/disconnect`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
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
