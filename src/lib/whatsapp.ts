/**
 * Utiliti untuk menghantar mesej WhatsApp melalui wa-agent lokal.
 * URL: http://localhost:3001/send
 */
const WA_GATEWAY_URL = 'https://wa.baharimedika.com/send'

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

    // Gunakan AbortController untuk timeout 10 detik
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const token = process.env.WA_GATEWAY_TOKEN || 'purnamawifi_wa_secure_key_8b99d45e7f12a3d0'

    let response: Response
    try {
      response = await fetch(WA_GATEWAY_URL, {
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
