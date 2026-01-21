import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";

import "./globals.css";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  metadataBase: new URL("https://adaptive-chat.vercel.app"),
  title: "Gatapreta Sapatilhas - Assistente Virtual",
  description: "Converse com nosso assistente virtual para tirar dúvidas sobre produtos, entregas, preços e muito mais. Atendimento rápido e personalizado.",
  keywords: ["sapatilhas", "calçados", "atendimento", "assistente virtual", "gatapreta"],
  authors: [{ name: "Gatapreta Sapatilhas" }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://adaptive-chat.vercel.app",
    title: "Gatapreta Sapatilhas - Assistente Virtual",
    description: "Tire suas dúvidas sobre produtos, entregas e preços com nosso assistente virtual.",
    siteName: "Gatapreta Sapatilhas",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Gatapreta Sapatilhas - Assistente Virtual",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gatapreta Sapatilhas - Assistente Virtual",
    description: "Tire suas dúvidas sobre produtos, entregas e preços com nosso assistente virtual.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  maximumScale: 1, // Disable auto-zoom on mobile Safari
};

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

const LIGHT_THEME_COLOR = "hsl(0 0% 100%)";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${geist.variable} ${geistMono.variable}`}
      lang="pt-BR"
    >
      <head>
        <meta name="theme-color" content={LIGHT_THEME_COLOR} />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/og-image.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="antialiased">
        <Toaster position="top-center" />
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
