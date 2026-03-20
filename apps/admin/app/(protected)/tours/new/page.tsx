import { db } from '@tripflow/database'
import { Metadata } from 'next'
import NewTourForm from './NewTourForm'

export const metadata: Metadata = { title: 'สร้างทัวร์ใหม่ — TripFlow Admin' }

export default async function NewTourPage() {
  // Get or create default operator
  let operator = await db.operator.findFirst()
  if (!operator) {
    operator = await db.operator.create({
      data: {
        name: 'TripFlow Tours',
        email: 'admin@tripflow.app',
      },
    })
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8 flex items-center gap-4">
        <a href="/tours" className="text-gray-500 hover:text-gray-700 text-sm">← กลับ</a>
        <h1 className="text-2xl font-bold text-gray-900">สร้างทัวร์ใหม่</h1>
      </div>

      <NewTourForm operatorId={operator.id} />
    </div>
  )
}
