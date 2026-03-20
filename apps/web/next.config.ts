import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Incluir paquetes del workspace para que Next sustituya NEXT_PUBLIC_* en el bundle
  // del cliente (si no, @healthguard/config puede quedar con process.env vacío y caer
  // en localhost → en Windows a veces ::1 y el puerto mapeado por Docker no responde).
  transpilePackages: [
    "@healthguard/ui",
    "@healthguard/config",
    "@healthguard/api",
  ],
};

export default nextConfig;
