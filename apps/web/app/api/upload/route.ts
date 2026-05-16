import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserLight } from '@/lib/auth'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const maxDuration = 60

async function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function ensureBucket(admin: any) {
  const { data } = await admin.storage.getBucket('tripflow-media')
  if (!data) {
    await admin.storage.createBucket('tripflow-media', {
      public: true,
      fileSizeLimit: 50 * 1024 * 1024,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'],
    })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUserLight()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'ไฟล์ใหญ่เกิน 50MB' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const folder = ext === 'pdf' ? 'documents' : 'images'
    const path = `${folder}/${user.id}/${Date.now()}.${ext}`

    const admin = await getAdminClient()
    await ensureBucket(admin)

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const contentType = file.type || (ext === 'pdf' ? 'application/pdf' : 'image/jpeg')

    const { error } = await admin.storage
      .from('tripflow-media')
      .upload(path, buffer, { contentType, upsert: true })

    if (error) {
      console.error('Storage upload error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data } = admin.storage.from('tripflow-media').getPublicUrl(path)
    return NextResponse.json({ url: data.publicUrl })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
