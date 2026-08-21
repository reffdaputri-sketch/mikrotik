/**
 * Utiliti untuk menghantar mesej WhatsApp melalui wa-agent lokal.
 * URL: http://localhost:3001/send
 */
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getWaGatewayConfig() {
  let gatewayUrl = 'https://server.internetdesa.site/send'
  let token = process.env.WA_GATEWAY_TOKEN || 'purnamawifi_wa_secure_key_8b99d45e7f12a3d0'

  if (process.env.WA_GATEWAY_URL) {
    gatewayUrl = process.env.WA_GATEWAY_URL
  }

  try {
    const { data } = await supabase.from('app_config').select('setting, value').in('setting', ['whatsapp_gateway_url', 'whatsapp_api_key'])
    if (data) {
      const urlSetting = data.find(i => i.setting === 'whatsapp_gateway_url')?.value
      const tokenSetting = data.find(i => i.setting === 'whatsapp_api_key')?.value
      if (urlSetting && urlSetting.trim() !== '') {
        gatewayUrl = urlSetting.endsWith('/send') ? urlSetting : `${urlSetting.replace(/\/$/, '')}/send`
      }
      if (tokenSetting && tokenSetting.trim() !== '') {
        token = tokenSetting
      }
    }
  } catch (err) {
    console.error('[WA-SEND] Gagal mengambil konfigurasi dari database:', err)
  }

  return { gatewayUrl, token }
}

/**
 * Format nomor HP ke format internasional untuk WA.
 * Contoh: 08123 → 628123, 85123 → 6285123
 */
function formatPhone(phone: string): string {
  // Buang semua karakter selain angka
  let num = phone.replace(/\D/g, '')

  if (num.startsWith('0')) {
    if (num.startsWith('01')) {
      // Malaysia mobile: 01xxx → 601xxx
      num = '60' + num.slice(1)
    } else if (num.startsWith('08')) {
      // Indonesia mobile: 08xxx → 628xxx
      num = '62' + num.slice(1)
    } else {
      // Default fallback: 0xxx → 60xxx (assuming Malaysia as default since business uses RM)
      num = '60' + num.slice(1)
    }
  } else if (!num.startsWith('62') && !num.startsWith('60')) {
    // Jika tiada kod negara, kita lalai ke Malaysia 60 jika bermula dengan 1, atau 62 jika bermula dengan 8
    if (num.startsWith('1')) {
      num = '60' + num
    } else if (num.startsWith('8')) {
      num = '62' + num
    } else {
      num = '60' + num
    }
  }

  return num
}

export async function sendWhatsApp(phone: string, message: string): Promise<boolean> {
  try {
    const formattedPhone = formatPhone(phone)
    console.log(`[WA] Menghantar ke: ${formattedPhone} (asli: ${phone})`)

    const { gatewayUrl, token } = await getWaGatewayConfig()
    console.log(`[WA] Menggunakan gateway: ${gatewayUrl}`)

    // Gunakan AbortController untuk timeout 10 detik
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    let response: Response
    try {
      response = await fetch(gatewayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ target: formattedPhone, message }),
        signal: controller.signal
      })
    } finally {
      clearTimeout(timeoutId)
    }

    const responseText = await response.text()

    if (!response.ok) {
      console.error('[WA] Ralat menghantar:', response.status, responseText)
      return false
    }

    console.log('[WA] Berjaya dihantar:', responseText)
    return true
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      console.error('[WA] Timeout! wa-agent tidak merespons dalam 10 saat. Pastikan wa-agent berjalan dan WhatsApp tersambung.')
    } else {
      console.error('[WA] Ralat:', error?.message || error)
    }
    return false
  }
}
