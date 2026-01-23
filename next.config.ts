import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Limitamos los tamaños de salida para evitar generar imágenes 4K (3840px) innecesarias
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
