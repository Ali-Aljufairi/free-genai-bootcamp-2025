"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Only show navbar on homepage
  const isHomePage = pathname === "/"

  if (!isHomePage) return null

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-sm bg-white/70 dark:bg-slate-900/70 border-b border-blue-100/50 dark:border-blue-900/50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl">Sorami</span>
            <span className="text-xs text-muted-foreground">空見</span>
          </Link>

          <nav className="hidden md:flex gap-6">
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <div className="hidden md:flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="mr-2">
                Dashboard
              </Button>
            </Link>

            <Button
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0"
              size="sm"
            >
              Sign Up
            </Button>
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[240px] sm:w-[300px]">
              <nav className="flex flex-col gap-4 mt-8">
                <Link
                  href="/features"
                  className="text-sm font-medium transition-colors hover:text-blue-600 dark:hover:text-blue-400"
                  onClick={() => setOpen(false)}
                >
                  Features
                </Link>
                <Link
                  href="/pricing"
                  className="text-sm font-medium transition-colors hover:text-blue-600 dark:hover:text-blue-400"
                  onClick={() => setOpen(false)}
                >
                  Pricing
                </Link>
                <Link
                  href="/about"
                  className="text-sm font-medium transition-colors hover:text-blue-600 dark:hover:text-blue-400"
                  onClick={() => setOpen(false)}
                >
                  About
                </Link>
                <div className="h-px bg-border my-2" />
                <Link
                  href="/dashboard"
                  className="text-sm font-medium transition-colors hover:text-blue-600 dark:hover:text-blue-400"
                  onClick={() => setOpen(false)}
                >
                  Dashboard
                </Link>
                <Button
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 mt-2"
                  size="sm"
                  onClick={() => setOpen(false)}
                >
                  Sign Up
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

