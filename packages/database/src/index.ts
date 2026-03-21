import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    // Connection pool: allow more concurrent DB connections for high traffic
    // Supabase free tier: max 60 connections, Pro: 200+
    // Reserve some for admin + migrations
    datasourceUrl: addPoolParams(process.env.DATABASE_URL ?? ''),
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Warm up the connection pool on first import
db.$connect().catch(() => {})

function addPoolParams(url: string): string {
  if (!url) return url
  // Add connection pool params if not already present
  const sep = url.includes('?') ? '&' : '?'
  const params: string[] = []
  if (!url.includes('connection_limit')) params.push('connection_limit=20')
  if (!url.includes('pool_timeout')) params.push('pool_timeout=30')
  return params.length > 0 ? `${url}${sep}${params.join('&')}` : url
}

export * from '@prisma/client'
export { logActivity } from './activity-log'
