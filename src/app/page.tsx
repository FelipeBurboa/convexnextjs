import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import Image from "next/image";
import Link from "next/link";

export default async function Home() {
  const token = await convexAuthNextjsToken();
  const isAuthenticated = !!token;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <main className="max-w-4xl mx-auto text-center space-y-8">
        {/* Logo */}
        <div className="mb-8">
          <Image
            src={logo}
            alt="Smart Notes Logo"
            width={120}
            height={120}
            className="mx-auto"
            priority
          />
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
          Smart Notitas
        </h1>

        {/* Description */}
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Una aplicación de toma de notas con integración de chatbot de IA
          construida con Convex y el SDK de Vercel AI.
        </p>

        {/* CTA Button */}
        <div className="pt-4">
          <Button asChild size="lg" className="text-lg px-8 py-3">
            <Link href="/notes">{isAuthenticated ? "Seguir" : "Empezar"}</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
