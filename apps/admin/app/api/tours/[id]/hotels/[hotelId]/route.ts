import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity } from '@tripflow/database'
import { revalidateWebCache } from '@/lib/revalidate-web'

/**
 * DELETE /api/tours/[id]/hotels/[hotelId]
 * Deletes all accommodation records for a given hotel name
 * hotelId is the URL-encoded hotel name
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; hotelId: string }> }
) {
  try {
    const { id, hotelId } = await params
    const hotelName = decodeURIComponent(hotelId)

    // Find all days with this hotel
    const days = await db.tourDay.findMany({
      where: { tourId: id },
      include: { accommodation: true },
    })

    const matchingDays = days.filter(
      d => d.accommodation && d.accommodation.name.trim().toLowerCase() === hotelName.trim().toLowerCase()
    )

    // Delete all accommodation records for this hotel
    for (const day of matchingDays) {
      await db.accommodation.delete({ where: { tourDayId: day.id } }).catch(() => {})
    }

    logActivity({
      action: 'hotel.delete',
      entity: 'Accommodation',
      tourId: id,
      description: `ลบที่พัก "${hotelName}" (${matchingDays.length} คืน)`,
    }).catch(() => {})

    revalidateWebCache(id)

    return NextResponse.json({ success: true, deletedCount: matchingDays.length })
  } catch (error) {
    console.error('Hotel DELETE error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
