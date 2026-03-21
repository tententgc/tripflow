import { createServerClient } from '@supabase/ssr'
import { db } from '@tripflow/database'

export async function getAdminActor(): Promise<{ id: string; name: string } | null> {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    )
    // This won't work without cookies — fallback approach
    // For admin, we just return null and let the system use "Admin" as default
    return null
  } catch {
    return null
  }
}

// Simple: admin routes always log as "Admin" since we can't easily get
// the session in API routes without cookies forwarding.
// In a production system, you'd pass the user info from middleware.
export function getAdminName(): string {
  return 'Admin'
}
