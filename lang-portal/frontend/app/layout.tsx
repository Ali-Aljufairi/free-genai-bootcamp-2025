"use client";

import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import ClientLayout from "./ClientLayout";
import { Toaster } from "sonner";
import { ClerkProvider } from "@clerk/nextjs";
import { clerkAppearance } from "@/components/navbar";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} bg-gradient-to-br from-sky-50/80 via-blue-50/60 to-indigo-50/70 dark:from-slate-900/90 dark:via-blue-950/80 dark:to-indigo-950/90 paper-texture atmospheric-bg`}
      >
        <ClerkProvider
          appearance={clerkAppearance}
          afterSignInUrl="/study"
          afterSignUpUrl="/study"
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ClientLayout>{children}</ClientLayout>
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}