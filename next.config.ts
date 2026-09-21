import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Las fotos de WOD se comprimen en el cliente antes de enviarse, pero
      // se deja margen sobre el límite por defecto (1mb) para el overhead
      // de base64 + multipart.
      bodySizeLimit: "3mb",
    },
  },
};

export default nextConfig;
