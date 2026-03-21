import { db } from '@tripflow/database'
import { Metadata } from 'next'
import NewTourForm from './NewTourForm'

export const metadata: Metadata = { title: 'สร้างทัวร์ใหม่ — TripFlow Admin' }

export default async function NewTourPage() {
  let operator = await db.operator.findFirst()
  if (!operator) {
    operator = await db.operator.create({
      data: { name: 'TripFlow Tours', email: 'admin@tripflow.app' },
    })
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <a href="/tours" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors mb-3">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          จัดการทัวร์
        </a>
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl">🗺️</div>
            <div>
              <h1 className="text-xl font-bold">สร้างทัวร์ใหม่</h1>
              <p className="text-white/60 text-sm mt-0.5">กรอกข้อมูลเบื้องต้นเพื่อเริ่มสร้างทัวร์</p>
            </div>
          </div>
        </div>
      </div>

      <NewTourForm operatorId={operator.id} />
    </div>
  )
}
