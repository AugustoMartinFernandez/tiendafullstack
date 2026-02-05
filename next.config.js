/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. LISTA BLANCA DE IMÁGENES
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Fotos de Google
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com", // Avatares por defecto
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com", // Imágenes de tus productos en Firebase
      },
    ],
  },

  // 2. CONFIGURACIÓN DE SEGURIDAD (Login Google)
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

module.exports = nextConfig;