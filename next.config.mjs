/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'http2.mlstatic.com',
      },
    ],
    // Permitimos calidad 50 (usada en miniaturas) y 75 (default)
    qualities: [50, 60, 75], 
    // Optimización: Formatos modernos (AVIF es 20-30% más pequeño que WebP) y caché
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // 1 año de caché para imágenes remotas
  },
};

export default nextConfig;