import { NextRequest, NextResponse } from 'next/server'
import { invalidateCache } from '@/lib/cache'

/**
 * POST /api/revalidate
 * Called by admin app after editing tour data to clear web app cache.
 * Body: { tourId: string }
 * Auth: requires SUPABASE_SERVICE_ROLE_KEY as bearer token
 */
export async function POST(req: NextRequest) {
  try {
    // Simple auth — admin sends service role key as bearer token
    const auth = req.headers.get('authorization')
    const expectedKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!auth || !expectedKey || auth !== `Bearer ${expectedKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tourId } = await req.json() as { tourId?: string }

    if (tourId) {
      // Invalidate specific tour caches
      invalidateCache(`tour:${tourId}`)
      invalidateCache(`splits:${tourId}`)
      invalidateCache(`fund:${tourId}`)
      invalidateCache(`checklist:${tourId}`)
      invalidateCache(`phrases:${tourId}`)
      invalidateCache(`emergency:${tourId}`)
      invalidateCache(`chat-tour:${tourId}`)
    } else {
      // Invalidate all tour caches
      invalidateCache('tour:')
      invalidateCache('splits:')
      invalidateCache('fund:')
      invalidateCache('checklist:')
      invalidateCache('phrases:')
      invalidateCache('emergency:')
      invalidateCache('chat-tour:')
    }

    return NextResponse.json({ ok: true, tourId: tourId ?? 'all' })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
