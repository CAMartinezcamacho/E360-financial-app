/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export when building for Capacitor (mobile app)
  // Vercel deployment uses normal Next.js server (VERCEL env var is set automatically)
  output: process.env.BUILD_FOR_CAPACITOR ? 'export' : undefined,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
