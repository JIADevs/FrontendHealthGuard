import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

// Turbopack (Next 16+ dev) can mis-infer the workspace root in a pnpm monorepo (e.g. Docker:
// "project directory: .../src/app" and then `next/package.json` is not found). Pin the root
// to the repo root so hoisted `node_modules` and workspace packages resolve correctly.
const webAppDir = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(webAppDir, "../..");

const nextConfig: NextConfig = {
  output: 'standalone',
  turbopack: {
    root: monorepoRoot,
  },
  // Incluir paquetes del workspace para que Next sustituya NEXT_PUBLIC_* en el bundle
  // del cliente (si no, @helu/config puede quedar con process.env vacío y caer
  // en localhost → en Windows a veces ::1 y el puerto mapeado por Docker no responde).
  transpilePackages: [
    "@helu/ui",
    "@helu/config",
    "@helu/api",
  ],
};

export default nextConfig;
