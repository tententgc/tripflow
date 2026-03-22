import { revalidateWebCache } from '@/lib/revalidate-web'
import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity } from '@tripflow/database'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tourId } = await params
    const body = await req.json() as {
      name: string
      nameLocal?: string | null
      phone?: string | null
      phoneLocal?: string | null
      wechat?: string | null
      line?: string | null
      whatsapp?: string | null
      type: string
      notes?: string | null
    }

    const contact = await db.importantContact.create({
      data: {
        tourId,
        name: body.name,
        nameLocal: body.nameLocal ?? null,
        phone: body.phone ?? null,
        phoneLocal: body.phoneLocal ?? null,
        wechat: body.wechat ?? null,
        line: body.line ?? null,
        whatsapp: body.whatsapp ?? null,
        type: body.type as any,
        notes: body.notes ?? null,
      },
    })

    logActivity({
      action: 'contact.add',
      entity: 'Contact',
      entityId: contact.id,
      description: `เพิ่มผู้ติดต่อ "${contact.name}"`,
      tourId,
    }).catch(() => {})

    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    console.error('Contact POST error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
