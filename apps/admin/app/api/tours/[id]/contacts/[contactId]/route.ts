import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity } from '@tripflow/database'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  try {
    const { contactId } = await params
    const body = await req.json() as {
      name?: string
      nameLocal?: string | null
      phone?: string | null
      phoneLocal?: string | null
      wechat?: string | null
      line?: string | null
      whatsapp?: string | null
      type?: string
      notes?: string | null
    }

    const contact = await db.importantContact.update({
      where: { id: contactId },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.nameLocal !== undefined && { nameLocal: body.nameLocal }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.phoneLocal !== undefined && { phoneLocal: body.phoneLocal }),
        ...(body.wechat !== undefined && { wechat: body.wechat }),
        ...(body.line !== undefined && { line: body.line }),
        ...(body.whatsapp !== undefined && { whatsapp: body.whatsapp }),
        ...(body.type !== undefined && { type: body.type as any }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
    })

    logActivity({ actorName: 'Admin', action: 'contact.update', entity: 'Contact', entityId: contactId, description: 'แก้ไขผู้ติดต่อ' }).catch(() => {})

    return NextResponse.json(contact)
  } catch (error) {
    console.error('Contact PATCH error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  try {
    const { contactId } = await params
    await db.importantContact.delete({ where: { id: contactId } })

    logActivity({ actorName: 'Admin', action: 'contact.delete', entity: 'Contact', entityId: contactId, description: 'ลบผู้ติดต่อ' }).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Contact DELETE error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
