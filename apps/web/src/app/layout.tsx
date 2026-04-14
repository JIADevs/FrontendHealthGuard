import type { Metadata } from "next";
import { Providers } from "./providers";
import { generateCssVariables } from "@helu/ui";
import "./globals.css";

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
    <html lang="es">
      <head>
        <style dangerouslySetInnerHTML={{ __html: generateCssVariables() }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
