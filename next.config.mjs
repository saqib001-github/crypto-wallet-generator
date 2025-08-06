/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  env:{
    NEXT_SOLANA_API: process.env.NEXT_SOLANA_API,
    NEXT_ETHEREUM_API: process.env.NEXT_ETHEREUM_API
  },
}

export default nextConfig
