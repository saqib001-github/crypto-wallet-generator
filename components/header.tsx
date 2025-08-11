"use client"

import { Button } from "@/components/ui/button"
import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function Header() {
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CW</span>
            </div>
            <h1 className="text-xl font-bold">Crypto Wallet Generator</h1>
          </Link>

          <nav className="hidden md:flex items-center gap-4">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === "/" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Wallets
            </Link>
            <Link
              href="/tokens"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === "/tokens" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Token Launchpad
            </Link>
          </nav>
        </div>

        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
          <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </header>
  )
}
