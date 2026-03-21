import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const w = console.warn; console.warn = () => {}
  const { data: { session } } = await supabase.auth.getSession()
  console.warn = w
  const user = session?.user

  if (!user) {
    redirect('/login')
  }

  return <>{children}</>
}
