import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import AdminLayout from '@/components/AdminLayout'

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <AdminLayout user={{ fullname: session.fullname, user_type: session.user_type }}>
      {children}
    </AdminLayout>
  )
}
