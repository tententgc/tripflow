import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `activities/${Date.now()}.${ext}`

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
