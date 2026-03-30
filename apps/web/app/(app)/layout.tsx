/**
 * App layout — middleware already handles auth redirects,
 * so this is just a pass-through wrapper. No server-side auth check needed.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <div data-page>{children}</div>
}
