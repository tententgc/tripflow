/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@tripflow/utils', '@tripflow/types', '@tripflow/adapters', '@tripflow/database'],
  serverExternalPackages: ['@prisma/client', 'prisma'],
  experimental: {
    optimizeCss: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'media.tripflow.app' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'cdn.jsdelivr.net' },
    ],
  },
}

export default nextConfig
