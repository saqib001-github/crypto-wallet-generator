"use client"

import { useState } from "react"
import { CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Eye, EyeOff } from "lucide-react"
import { toast } from "./ui/use-toast"

export default function KeyDisplayCard({ wallet, coin }: { wallet: any; coin: "solana" | "ethereum" }) {
  const [visible, setVisible] = useState(false)
  const publicKey = coin === "solana" ? wallet.publicKey : wallet.address;

  const copyToClipboard = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard.`,
    })
  }

  return (
    <CardContent className="space-y-3">
      {/* Public Key */}
      <div>
        <label className="text-xs font-medium text-muted-foreground">
          Public Key
        </label>
        <div className="flex items-center gap-2 mt-1">
          <code className="flex-1 p-2 bg-muted rounded text-xs font-mono break-all">
            {publicKey}
          </code>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(publicKey, "Public key")}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Private Key with visibility toggle */}
      <div>
        <label className="text-xs font-medium text-muted-foreground">
          Private Key
        </label>
        <div className="flex items-center gap-2 mt-1">
          <code className="flex-1 p-2 bg-muted rounded text-xs font-mono break-all">
            {visible ? wallet.privateKey : "•".repeat(wallet?.privateKey?.length || 44)}
          </code>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVisible((prev) => !prev)}
            aria-label={visible ? "Hide private key" : "Show private key"}
          >
            {visible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(wallet.privateKey, "Private key")}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Footer: Index + Last Updated */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Index: {wallet.index}</span>
        <span>
          Last updated: {new Date(wallet.lastUpdated).toLocaleTimeString()}
        </span>
      </div>
    </CardContent>
  )
}
