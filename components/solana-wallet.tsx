"use client"

import { useEffect } from "react"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Wallet, Loader2, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAppDispatch, useAppSelector } from "@/lib/hooks"
import { generateSolanaWallet, fetchSolanaBalance, fetchSolanaTransactionCount } from "@/lib/walletSlice"
import KeyDisplayCard from "./key-display-card"

export function SolanaWallet() {
  const dispatch = useAppDispatch()
  const { solanaWallets, mnemonic } = useAppSelector((state) => state.wallet)
  const { toast } = useToast()


  // Fetch balance and transaction count for new wallets
  useEffect(() => {
    solanaWallets.forEach((wallet) => {
      if (wallet.isLoading) {
        dispatch(
          fetchSolanaBalance({
            publicKey: wallet.publicKey,
            walletId: wallet.id,
          }),
        )
        dispatch(
          fetchSolanaTransactionCount({
            publicKey: wallet.publicKey,
            walletId: wallet.id,
          }),
        )
      }
    })
  }, [solanaWallets, dispatch])

  const handleAddWallet = async () => {
    if (!mnemonic) {
      toast({
        title: "Error",
        description: "Please generate a mnemonic first.",
        variant: "destructive",
      })
      return
    }

    try {
      await dispatch(generateSolanaWallet()).unwrap()
      toast({
        title: "Wallet Added",
        description: "Solana wallet created successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create wallet. Please try again.",
        variant: "destructive",
      })
    }
  }

  const refreshWalletData = (walletId: string, publicKey: string) => {
    dispatch(fetchSolanaBalance({ publicKey, walletId }))
    dispatch(fetchSolanaTransactionCount({ publicKey, walletId }))
    toast({
      title: "Refreshing",
      description: "Updating wallet data...",
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
          Solana Wallets ({solanaWallets.length})
        </h3>
        <Button onClick={handleAddWallet} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Wallet
        </Button>
      </div>

      {solanaWallets.length === 0 && (
        <Alert>
          <Wallet className="h-4 w-4" />
          <AlertDescription>Click "Add Wallet" to generate your first Solana wallet.</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {solanaWallets.map((wallet) => (
          <Card key={wallet.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  Wallet {wallet.index + 1}
                  <Badge variant="secondary">SOL</Badge>
                  <Badge variant="outline" className="text-xs">
                    {wallet.transactionCount} txns
                  </Badge>
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => refreshWalletData(wallet.id, wallet.publicKey)}
                    disabled={wallet.isLoading}
                  >
                    <RefreshCw className={`h-3 w-3 ${wallet.isLoading ? "animate-spin" : ""}`} />
                  </Button>
                  {wallet.isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Badge variant="outline">{wallet.balance.toFixed(4)} SOL</Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <KeyDisplayCard wallet={wallet} coin={"solana"} />
          </Card>
        ))}
      </div>
    </div>
  )
}
