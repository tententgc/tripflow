/**
 * Notify web app to clear cache for a specific tour.
 * Called after admin edits tour data (itinerary, documents, etc.)
 * Fire-and-forget — doesn't block admin response.
 */
export function revalidateWebCache(tourId?: string) {
  const webUrl = process.env.NEXT_PUBLIC_APP_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!webUrl || !serviceKey) return

  fetch(`${webUrl}/api/revalidate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ tourId }),
  }).catch(() => {}) // fire-and-forget
}
