/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@tripflow/utils', '@tripflow/types', '@tripflow/adapters', '@tripflow/database'],
  serverExternalPackages: ['@prisma/client', 'prisma'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'media.tripflow.app' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
}

export default nextConfig
