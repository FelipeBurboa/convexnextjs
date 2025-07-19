import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | Notas Inteligentes",
    default: "Notas Inteligentes",
  },
  description:
    "Una aplicación de toma de notas con integración de chatbot de IA construida con Convex y el SDK de Vercel AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ConvexClientProvider>{children}</ConvexClientProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
