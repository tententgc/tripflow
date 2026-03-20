import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Allow larger uploads (PDFs up to 10MB)
export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'ไฟล์ใหญ่เกิน 10MB' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing SUPABASE env vars:', { url: !!supabaseUrl, key: !!supabaseKey })
      return NextResponse.json({ error: 'Storage not configured' }, { status: 500 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const folder = ext === 'pdf' ? 'documents' : 'activities'
    const path = `${folder}/${Date.now()}.${ext}`

    // Use supabase-js directly with service role key (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const contentType = file.type || (ext === 'pdf' ? 'application/pdf' : 'image/jpeg')

    const { error } = await supabase.storage
      .from('tripflow-media')
      .upload(path, buffer, { contentType, upsert: true })

    if (error) {
      console.error('Storage upload error:', error.message, error)

      // If mime type not supported or bucket issue, update bucket config and retry
      if (error.message?.includes('mime') || error.message?.includes('not supported') || error.message?.includes('not found') || error.message?.includes('Bucket')) {
        console.log('Updating bucket config to allow PDF...')
        // Try update existing bucket first
        await supabase.storage.updateBucket('tripflow-media', {
          public: true,
          fileSizeLimit: 10 * 1024 * 1024,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'],
        }).catch(() => {
          // If update fails, try create
          return supabase.storage.createBucket('tripflow-media', {
            public: true,
            fileSizeLimit: 10 * 1024 * 1024,
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'],
          })
        })

        // Retry upload
        const { error: retryError } = await supabase.storage
          .from('tripflow-media')
          .upload(path, buffer, { contentType, upsert: true })
        if (retryError) {
          console.error('Retry upload error:', retryError)
          return NextResponse.json({ error: retryError.message }, { status: 500 })
        }
      } else {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    const { data } = supabase.storage.from('tripflow-media').getPublicUrl(path)
    return NextResponse.json({ url: data.publicUrl })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
