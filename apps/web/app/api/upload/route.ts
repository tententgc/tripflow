import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(req: NextRequest) {
  // Auth check with user session
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `receipts/${user.id}/${Date.now()}.${ext}`

  // Service role client — bypasses RLS for storage
  const admin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const { error } = await admin.storage
    .from('tripflow-media')
    .upload(path, file, { contentType: file.type, upsert: true })

  if (error) {
    console.error('Storage upload error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data } = admin.storage.from('tripflow-media').getPublicUrl(path)
  return NextResponse.json({ url: data.publicUrl })
}
