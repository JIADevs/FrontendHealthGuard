import type { Metadata } from "next";
import { Inter, Nunito } from "next/font/google";
import { Providers } from "./providers";
import { generateCssVariables } from "@helu/ui";
import "./globals.css";

// v2 (MASTER §5): Inter para el cuerpo y Nunito para títulos, botones y etiquetas.
// `--font-inter` y `--font-nunito` los consumen `--font-body` / `--font-sans` y
// `--font-heading` (generateCssVariables, @helu/ui).
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Helu — Gestión Médica Inteligente",
  description:
    "Gestiona tus documentos médicos, citas, medicamentos y más con Helu.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${nunito.variable}`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: generateCssVariables() }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
