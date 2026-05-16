import { createAdminClient } from '@/lib/supabase/server'

/**
 * Utiliti untuk menghantar mesej WhatsApp melalui gateway.
 * Bergantung pada konfigurasi `whatsapp_gateway_url` dan `whatsapp_api_key` di `app_config`.
 */
export async function sendWhatsApp(phone: string, message: string): Promise<boolean> {
  try {
    const supabase = await createAdminClient()
    const { data } = await supabase.from('app_config').select('*').in('setting', ['whatsapp_gateway_url', 'whatsapp_api_key'])
    
    const config = (data || []).reduce((acc: any, item: any) => {
      acc[item.setting] = item.value
      return acc
    }, {})

    const url = config.whatsapp_gateway_url
    const token = config.whatsapp_api_key

    if (!url) {
      console.warn('WhatsApp Gateway URL tidak dikonfigurasi.')
      return false
    }

    // Default payload for Fonnte as an example, adjust according to your gateway
    const isFonnte = url.includes('fonnte.com')
    
    let fetchOptions: RequestInit = {}

    if (isFonnte) {
      const formData = new FormData()
      formData.append('target', phone)
      formData.append('message', message)

      fetchOptions = {
        method: 'POST',
        headers: {
          'Authorization': token
        },
        body: formData
      }
    } else {
      // Generic JSON payload (e.g. for WooWa or custom APIs)
      fetchOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'apikey': token || ''
        },
        body: JSON.stringify({
          phone: phone,
          number: phone,
          target: phone,
          message: message,
          text: message
        })
      }
    }

    const response = await fetch(url, fetchOptions)
    
    if (!response.ok) {
      console.error('Ralat menghantar WhatsApp:', await response.text())
      return false
    }

    return true
  } catch (error) {
    console.error('Ralat WhatsApp Utility:', error)
    return false
  }
}
