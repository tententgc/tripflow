'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'

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

/* ── Modal Form ──────────────────────────────────────── */
function ContactFormModal({
  initial,
  tourId,
  contactId,
  onSave,
  onCancel,
  onDelete,
  title,
  submitLabel,
}: {
  initial: ContactForm
  tourId: string
  contactId?: string
  onSave: (contact: Contact) => void
  onCancel: () => void
  onDelete?: () => void
  title: string
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

  const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400'

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between bg-emerald-50 px-5 py-3.5 border-b border-emerald-100">
            <h3 className="font-semibold text-emerald-800 text-sm">{title}</h3>
            <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-emerald-100 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 max-h-[75vh] overflow-y-auto">
            {/* Left — Name + Type + Phone */}
            <div className="p-5 space-y-4 border-r border-gray-100">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">ชื่อ (ภาษาไทย) *</label>
                <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className={inputCls} placeholder="เช่น คุณนิชา (ไกด์ไทย)" autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">ชื่อภาษาท้องถิ่น</label>
                <input type="text" value={form.nameLocal} onChange={(e) => setForm((p) => ({ ...p, nameLocal: e.target.value }))}
                  className={inputCls} placeholder="เช่น 田中さん" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">ประเภท</label>
                <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                  className={inputCls}>
                  {contactTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.emoji} {opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">เบอร์โทร</label>
                  <input type="text" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    className={inputCls} placeholder="+81-90-0000-5555" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">เบอร์โทรท้องถิ่น</label>
                  <input type="text" value={form.phoneLocal} onChange={(e) => setForm((p) => ({ ...p, phoneLocal: e.target.value }))}
                    className={inputCls} placeholder="090-0000-5555" />
                </div>
              </div>
            </div>

            {/* Right — Social + Notes + Actions */}
            <div className="p-5 space-y-4">
              {/* Social */}
              <div className="bg-emerald-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
                  ช่องทางติดต่อ
                </p>
                <div>
                  <label className="block text-[10px] font-medium text-emerald-600 mb-1">WeChat ID</label>
                  <input type="text" value={form.wechat} onChange={(e) => setForm((p) => ({ ...p, wechat: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-emerald-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    placeholder="WeChat ID" />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-emerald-600 mb-1">LINE ID</label>
                  <input type="text" value={form.line} onChange={(e) => setForm((p) => ({ ...p, line: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-emerald-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    placeholder="LINE ID" />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-emerald-600 mb-1">WhatsApp</label>
                  <input type="text" value={form.whatsapp} onChange={(e) => setForm((p) => ({ ...p, whatsapp: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-emerald-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    placeholder="+66-89-111-2222" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">หมายเหตุ</label>
                <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={2}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
                  placeholder="หมายเหตุเพิ่มเติม" />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button onClick={save} disabled={saving || !form.name.trim()}
                  className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-emerald-700 transition-colors">
                  {saving ? 'กำลังบันทึก...' : submitLabel}
                </button>
                <button onClick={onCancel}
                  className="px-5 py-2.5 border border-gray-200 bg-white text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                  ยกเลิก
                </button>
                {contactId && (
                  <button onClick={deleteContact} disabled={deleting}
                    className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50" title="ลบ">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

/* ── Main Component ──────────────────────────────────── */
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

  const editingContact = editingId ? contacts.find(c => c.id === editingId) : null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">ผู้ติดต่อสำคัญ ({contacts.length})</h2>
      </div>

      {contacts.length === 0 && !adding && (
        <div className="bg-white/50 backdrop-blur-md rounded-2xl p-8 text-center border border-white/60">
          <p className="text-3xl mb-2">📞</p>
          <p className="text-gray-600 font-medium">ยังไม่มีผู้ติดต่อ</p>
          <p className="text-gray-400 text-sm mt-1">เพิ่มผู้ติดต่อสำคัญสำหรับทัวร์นี้</p>
          <button onClick={() => setAdding(true)}
            className="mt-4 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
            + เพิ่มผู้ติดต่อ
          </button>
        </div>
      )}

      {contacts.map((contact) => (
        <div key={contact.id}
          className="bg-white/50 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0 text-xl">
              {getTypeEmoji(contact.type)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">{contact.name}</span>
                {contact.nameLocal && <span className="text-xs text-gray-400">{contact.nameLocal}</span>}
                <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-medium">
                  {getTypeLabel(contact.type)}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-gray-500">
                {contact.phone && <span>{contact.phone}</span>}
                {contact.wechat && <span className="text-emerald-500">WeChat: {contact.wechat}</span>}
                {contact.line && <span className="text-green-500">LINE: {contact.line}</span>}
                {contact.whatsapp && <span className="text-teal-500">WhatsApp: {contact.whatsapp}</span>}
              </div>
              {contact.notes && (
                <p className="text-[10px] text-gray-400 mt-0.5 truncate">{contact.notes}</p>
              )}
            </div>

            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => { setEditingId(contact.id); setAdding(false) }}
                className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="แก้ไข">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
              </button>
              <button onClick={async () => { if (!confirm('ลบผู้ติดต่อนี้?')) return; await fetch(`/api/tours/${tourId}/contacts/${contact.id}`, { method: 'DELETE' }); setContacts(prev => prev.filter(c => c.id !== contact.id)) }}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="ลบ">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
              </button>
            </div>
          </div>
        </div>
      ))}

      {contacts.length > 0 && (
        <button onClick={() => { setAdding(true); setEditingId(null) }}
          className="w-full py-3 bg-white/30 backdrop-blur-sm border border-dashed border-emerald-200/60 text-emerald-500 rounded-2xl text-sm font-medium hover:bg-white/50 hover:border-emerald-300 transition-colors">
          + เพิ่มผู้ติดต่อ
        </button>
      )}

      {/* Add Modal */}
      {adding && (
        <ContactFormModal
          initial={emptyForm}
          tourId={tourId}
          title="เพิ่มผู้ติดต่อใหม่"
          submitLabel="เพิ่มผู้ติดต่อ"
          onSave={(contact) => { setContacts((prev) => [...prev, contact]); setAdding(false) }}
          onCancel={() => setAdding(false)}
        />
      )}

      {/* Edit Modal */}
      {editingContact && (
        <ContactFormModal
          initial={contactToForm(editingContact)}
          tourId={tourId}
          contactId={editingContact.id}
          title={`แก้ไข "${editingContact.name}"`}
          submitLabel="บันทึก"
          onSave={(updated) => { setContacts((prev) => prev.map((c) => (c.id === editingContact.id ? updated : c))); setEditingId(null) }}
          onCancel={() => setEditingId(null)}
          onDelete={() => { setContacts((prev) => prev.filter((c) => c.id !== editingContact.id)); setEditingId(null) }}
        />
      )}
    </div>
  )
}
