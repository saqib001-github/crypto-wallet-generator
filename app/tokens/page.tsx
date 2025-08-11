"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Rocket } from "lucide-react"
import { TokenLaunchpad } from "@/components/token-launchpad"
import { TokenPortfolio } from "@/components/token-portfolio"
import { useAppSelector } from "@/lib/hooks"

export default function TokensPage() {
  const { solanaWallets } = useAppSelector((state) => state.wallet)

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Solana Token Launchpad
        </h1>
        <p className="text-muted-foreground text-lg">Create and manage your SPL tokens on Solana Devnet</p>
        <div className="flex justify-center gap-2 mt-4">
          <Badge variant="secondary" className="text-sm">
            <Rocket className="h-3 w-3 mr-1" />
            SPL Token Creation
          </Badge>
          <Badge variant="secondary" className="text-sm">
            Devnet Testing
          </Badge>
          <Badge variant="secondary" className="text-sm">
            Portfolio Management
          </Badge>
        </div>
      </div>

      {solanaWallets.length === 0 && (
        <Alert className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="font-medium">
            <strong>Setup Required:</strong> Please create a Solana wallet first from the main page to use the token
            launchpad.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-8">
        <TokenLaunchpad />
        <TokenPortfolio />
      </div>
    </div>
  )
}
