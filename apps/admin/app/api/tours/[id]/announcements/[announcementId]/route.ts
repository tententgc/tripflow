import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity } from '@tripflow/database'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; announcementId: string }> }
) {
  try {
    const { id, announcementId } = await params
    const body = await req.json() as {
      title?: string
      content?: string
      imageUrls?: string[]
      isPinned?: boolean
      order?: number
    }

    const announcement = await db.tourAnnouncement.update({
      where: { id: announcementId },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.content !== undefined && { content: body.content }),
        ...(body.imageUrls !== undefined && { imageUrls: body.imageUrls }),
        ...(body.isPinned !== undefined && { isPinned: body.isPinned }),
        ...(body.order !== undefined && { order: body.order }),
      },
    })

    logActivity({
      actorName: 'Admin',
      action: 'announcement.update',
      entity: 'TourAnnouncement',
      entityId: announcementId,
      description: `แก้ไขประกาศ "${announcement.title}"`,
      tourId: id,
    }).catch(() => {})

    return NextResponse.json(announcement)
  } catch (error) {
    console.error('Announcement PATCH error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; announcementId: string }> }
) {
  try {
    const { id, announcementId } = await params

    const announcement = await db.tourAnnouncement.delete({
      where: { id: announcementId },
    })

    logActivity({
      actorName: 'Admin',
      action: 'announcement.delete',
      entity: 'TourAnnouncement',
      entityId: announcementId,
      description: `ลบประกาศ "${announcement.title}"`,
      tourId: id,
    }).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Announcement DELETE error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
