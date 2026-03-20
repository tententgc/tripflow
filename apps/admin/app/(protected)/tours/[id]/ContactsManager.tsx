'use client'

import { useState } from 'react'

interface Contact {
  id: string
  name: string
  nameLocal: string | null
  phone: string | null
  phoneLocal: string | null
  wechat: string | null
  line: string | null
  whatsapp: string | null
  type: string
  notes: string | null
}

type ContactForm = {
  name: string
  nameLocal: string
  phone: string
  phoneLocal: string
  wechat: string
  line: string
  whatsapp: string
  type: string
  notes: string
}

const emptyForm: ContactForm = {
  name: '',
  nameLocal: '',
  phone: '',
  phoneLocal: '',
  wechat: '',
  line: '',
  whatsapp: '',
  type: 'OTHER',
  notes: '',
}

const contactTypeOptions = [
  { value: 'THAI_GUIDE', label: 'ไกด์ไทย', emoji: '🧑‍🦰' },
  { value: 'LOCAL_GUIDE', label: 'ไกด์ท้องถิ่น', emoji: '🧑‍🏫' },
  { value: 'HOTEL', label: 'โรงแรม', emoji: '🏨' },
  { value: 'EMERGENCY', label: 'ฉุกเฉิน', emoji: '🚨' },
  { value: 'AIRLINE', label: 'สายการบิน', emoji: '✈️' },
  { value: 'BUS_OPERATOR', label: 'รถบัส', emoji: '🚌' },
  { value: 'RESTAURANT', label: 'ร้านอาหาร', emoji: '🍽️' },
  { value: 'INSURANCE', label: 'ประกัน', emoji: '🛡️' },
  { value: 'OTHER', label: 'อื่นๆ', emoji: '📋' },
]

function getTypeLabel(type: string): string {
  return contactTypeOptions.find((o) => o.value === type)?.label ?? type
}

function getTypeEmoji(type: string): string {
  return contactTypeOptions.find((o) => o.value === type)?.emoji ?? '📋'
}

function contactToForm(c: Contact): ContactForm {
  return {
    name: c.name,
    nameLocal: c.nameLocal ?? '',
    phone: c.phone ?? '',
    phoneLocal: c.phoneLocal ?? '',
    wechat: c.wechat ?? '',
    line: c.line ?? '',
    whatsapp: c.whatsapp ?? '',
    type: c.type,
    notes: c.notes ?? '',
  }
}

function ContactFormInline({
  initial,
  tourId,
  contactId,
  onSave,
  onCancel,
  onDelete,
  submitLabel,
}: {
  initial: ContactForm
  tourId: string
  contactId?: string
  onSave: (contact: Contact) => void
  onCancel: () => void
  onDelete?: () => void
  submitLabel: string
}) {
  const [form, setForm] = useState<ContactForm>(initial)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const url = contactId
        ? `/api/tours/${tourId}/contacts/${contactId}`
        : `/api/tours/${tourId}/contacts`
      const res = await fetch(url, {
        method: contactId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          nameLocal: form.nameLocal.trim() || null,
          phone: form.phone.trim() || null,
          phoneLocal: form.phoneLocal.trim() || null,
          wechat: form.wechat.trim() || null,
          line: form.line.trim() || null,
          whatsapp: form.whatsapp.trim() || null,
          type: form.type,
          notes: form.notes.trim() || null,
        }),
      })
      if (res.ok) onSave(await res.json() as Contact)
    } finally {
      setSaving(false)
    }
  }

  async function deleteContact() {
    if (!contactId || !confirm('ลบผู้ติดต่อนี้?')) return
    setDeleting(true)
    try {
      await fetch(`/api/tours/${tourId}/contacts/${contactId}`, { method: 'DELETE' })
      onDelete?.()
    } finally {
      setDeleting(false)
    }
  }

  const inputCls = 'px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500'

  return (
    <div className="bg-blue-50 rounded-xl p-3 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          className={inputCls}
          placeholder="ชื่อ (ภาษาไทย) *"
          autoFocus
        />
        <input
          type="text"
          value={form.nameLocal}
          onChange={(e) => setForm((p) => ({ ...p, nameLocal: e.target.value }))}
          className={inputCls}
          placeholder="ชื่อภาษาท้องถิ่น"
        />
      </div>

      <select
        value={form.type}
        onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
        className={`w-full ${inputCls}`}
      >
        {contactTypeOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.emoji} {opt.label}</option>
        ))}
      </select>

      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          value={form.phone}
          onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
          className={inputCls}
          placeholder="เบอร์โทร"
        />
        <input
          type="text"
          value={form.phoneLocal}
          onChange={(e) => setForm((p) => ({ ...p, phoneLocal: e.target.value }))}
          className={inputCls}
          placeholder="เบอร์โทรท้องถิ่น"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <input
          type="text"
          value={form.wechat}
          onChange={(e) => setForm((p) => ({ ...p, wechat: e.target.value }))}
          className={inputCls}
          placeholder="WeChat ID"
        />
        <input
          type="text"
          value={form.line}
          onChange={(e) => setForm((p) => ({ ...p, line: e.target.value }))}
          className={inputCls}
          placeholder="LINE ID"
        />
        <input
          type="text"
          value={form.whatsapp}
          onChange={(e) => setForm((p) => ({ ...p, whatsapp: e.target.value }))}
          className={inputCls}
          placeholder="WhatsApp"
        />
      </div>

      <textarea
        value={form.notes}
        onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
        rows={2}
        className={`w-full resize-none ${inputCls}`}
        placeholder="หมายเหตุ..."
      />

      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={saving || !form.name.trim()}
          className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {saving ? 'กำลังบันทึก...' : submitLabel}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-200 bg-white text-gray-600 rounded-lg text-sm"
        >
          ยกเลิก
        </button>
        {contactId && (
          <button
            onClick={deleteContact}
            disabled={deleting}
            className="px-3 py-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm disabled:opacity-50"
            title="ลบผู้ติดต่อ"
          >
            🗑️
          </button>
        )}
      </div>
    </div>
  )
}

export default function ContactsManager({
  tourId,
  initialContacts,
}: {
  tourId: string
  initialContacts: Contact[]
}) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">ผู้ติดต่อสำคัญ ({contacts.length})</h2>
      </div>

      {contacts.length === 0 && !adding && (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
          <p className="text-3xl mb-2">📞</p>
          <p className="text-gray-600 font-medium">ยังไม่มีผู้ติดต่อ</p>
          <p className="text-gray-400 text-sm mt-1">เพิ่มผู้ติดต่อสำคัญสำหรับทัวร์นี้</p>
        </div>
      )}

      {contacts.map((contact) => (
        <div key={contact.id}>
          {editingId === contact.id ? (
            <ContactFormInline
              initial={contactToForm(contact)}
              tourId={tourId}
              contactId={contact.id}
              submitLabel="บันทึก"
              onSave={(updated) => {
                setContacts((prev) => prev.map((c) => (c.id === contact.id ? updated : c)))
                setEditingId(null)
              }}
              onCancel={() => setEditingId(null)}
              onDelete={() => {
                setContacts((prev) => prev.filter((c) => c.id !== contact.id))
                setEditingId(null)
              }}
            />
          ) : (
            <button
              onClick={() => { setEditingId(contact.id); setAdding(false) }}
              className="w-full flex items-center gap-3 p-3 bg-white hover:bg-blue-50 rounded-xl border border-gray-100 shadow-sm transition-colors text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 text-lg">
                {getTypeEmoji(contact.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{contact.name}</span>
                  <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                    {getTypeLabel(contact.type)}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  {contact.phone && (
                    <span className="text-xs text-gray-500">{contact.phone}</span>
                  )}
                  {contact.wechat && (
                    <span className="text-xs text-gray-400">WeChat: {contact.wechat}</span>
                  )}
                  {contact.line && (
                    <span className="text-xs text-gray-400">LINE: {contact.line}</span>
                  )}
                </div>
              </div>
              <span className="text-gray-300 group-hover:text-blue-400 flex-shrink-0 text-sm">✏️</span>
            </button>
          )}
        </div>
      ))}

      {adding ? (
        <ContactFormInline
          initial={emptyForm}
          tourId={tourId}
          submitLabel="เพิ่มผู้ติดต่อ"
          onSave={(contact) => {
            setContacts((prev) => [...prev, contact])
            setAdding(false)
          }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button
          onClick={() => { setAdding(true); setEditingId(null) }}
          className="w-full py-2 border border-dashed border-gray-300 text-gray-500 rounded-xl text-sm hover:border-blue-400 hover:text-blue-600 transition-colors"
        >
          + เพิ่มผู้ติดต่อ
        </button>
      )}
    </div>
  )
}
