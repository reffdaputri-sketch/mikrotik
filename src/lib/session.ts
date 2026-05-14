import { cookies } from 'next/headers'

export interface AdminSession {
  id: number
  username: string
  fullname: string
  user_type: string
  expires: number
}

export async function getSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies()
    const raw = cookieStore.get('nuxbill_session')?.value
    if (!raw) return null
    const session: AdminSession = JSON.parse(Buffer.from(raw, 'base64').toString())
    if (Date.now() > session.expires) return null
    return session
  } catch {
    return null
  }
}
