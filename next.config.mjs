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
    qualities: [50, 75], 
  },
};

export default nextConfig;