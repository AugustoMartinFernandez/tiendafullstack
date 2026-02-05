import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Optimizaciones
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
    formats: ['image/avif', 'image/webp'],
    qualities: [50, 75],
    remotePatterns: [
      // Google Auth (Soluciona el error de lh3.googleusercontent.com)
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
      // Firebase Storage
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        port: "",
        pathname: "/**",
      },
      // MercadoLibre (si lo usas)
      {
        protocol: "https",
        hostname: "http2.mlstatic.com",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
