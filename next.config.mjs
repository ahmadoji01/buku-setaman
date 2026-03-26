/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      // imgcdn.dev CDN - domain utama
      {
        protocol: 'https',
        hostname: 'imgcdn.dev',
        pathname: '/**',
      },
      // imgcdn.dev subdomain (seperti s6.imgcdn.dev, dll)
      {
        protocol: 'https',
        hostname: '*.imgcdn.dev',
        pathname: '/**',
      },
      // Vercel blob storage (untuk logo, dll)
      {
        protocol: 'https',
        hostname: 'hebbkx1anhila5yf.public.blob.vercel-storage.com',
        pathname: '/**',
      },
    ],
  },
  // Izinkan domain eksternal untuk tag <img> biasa (non-Next Image)
  // imgcdn.dev menggunakan berbagai subdomain seperti i.imgcdn.dev
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "img-src 'self' data: https://*.imgcdn.dev https://imgcdn.dev https://hebbkx1anhila5yf.public.blob.vercel-storage.com;",
          },
        ],
      },
    ]
  },
}

export default nextConfig
