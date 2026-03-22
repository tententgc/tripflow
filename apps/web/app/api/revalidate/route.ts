import { NextRequest, NextResponse } from 'next/server'
import { invalidateCache } from '@/lib/cache'
import { revalidatePath } from 'next/cache'

/**
 * POST /api/revalidate
 * Called by admin app after editing tour data to clear web app cache.
 * Body: { tourId: string }
 * Auth: requires SUPABASE_SERVICE_ROLE_KEY as bearer token
 */
export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization')
    const expectedKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!auth || !expectedKey || auth !== `Bearer ${expectedKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tourId } = await req.json() as { tourId?: string }

    // 1. Clear in-memory API cache
    if (tourId) {
      invalidateCache(`tour:${tourId}`)
      invalidateCache(`splits:${tourId}`)
      invalidateCache(`fund:${tourId}`)
      invalidateCache(`checklist:${tourId}`)
      invalidateCache(`phrases:${tourId}`)
      invalidateCache(`emergency:${tourId}`)
      invalidateCache(`chat-tour:${tourId}`)
    } else {
      invalidateCache('tour:')
      invalidateCache('splits:')
      invalidateCache('fund:')
      invalidateCache('checklist:')
      invalidateCache('phrases:')
      invalidateCache('emergency:')
      invalidateCache('chat-tour:')
    }

    // 2. Revalidate Next.js server component pages (home page, tour pages)
    revalidatePath('/home')
    if (tourId) {
      revalidatePath(`/tour/${tourId}`)
    }

    return NextResponse.json({ ok: true, tourId: tourId ?? 'all' })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
