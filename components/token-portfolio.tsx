"use client"

import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Wallet, RefreshCw, Copy, ExternalLink, Coins } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAppDispatch, useAppSelector } from "@/lib/hooks"
import { fetchUserTokenBalances, setTokenMetadata } from "@/lib/solanaTokenSlice"

export function TokenPortfolio() {
  const dispatch = useAppDispatch()
  const { solanaWallets } = useAppSelector((state) => state.wallet)
  const { userTokenBalances, isFetchingBalances, createdTokens } = useAppSelector((state) => state.solanaToken)
  const { toast } = useToast()

  const selectedWallet = solanaWallets[0] // Use first wallet for now

  useEffect(() => {
    if (selectedWallet) {
      dispatch(fetchUserTokenBalances(selectedWallet.publicKey))
    }
  }, [selectedWallet, dispatch])

  // Set metadata for created tokens
  useEffect(() => {
    createdTokens.forEach((token) => {
      dispatch(
        setTokenMetadata({
          mintAddress: token.mintAddress,
          name: token.name,
          symbol: token.symbol,
        }),
      )
    })
  }, [createdTokens, dispatch])

  const refreshBalances = () => {
    if (selectedWallet) {
      dispatch(fetchUserTokenBalances(selectedWallet.publicKey))
      toast({
        title: "Refreshing",
        description: "Updating token balances...",
      })
    }
  }

  const copyToClipboard = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard.`,
    })
  }

  const openInExplorer = (address: string) => {
    window.open(`https://explorer.solana.com/address/${address}?cluster=devnet`, "_blank")
  }

  const formatBalance = (balance: string, decimals: number) => {
    const balanceNumber = Number.parseInt(balance) / Math.pow(10, decimals)
    return balanceNumber.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    })
  }

  if (!selectedWallet) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Token Portfolio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Wallet className="h-4 w-4" />
            <AlertDescription>Please create a Solana wallet first to view your token portfolio.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Token Portfolio
          </div>
          <Button variant="outline" size="sm" onClick={refreshBalances} disabled={isFetchingBalances}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetchingBalances ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <Wallet className="h-4 w-4" />
          <div>
            <p className="text-sm font-medium">Active Wallet</p>
            <code className="text-xs text-muted-foreground">
              {selectedWallet.publicKey.slice(0, 8)}...{selectedWallet.publicKey.slice(-8)}
            </code>
          </div>
        </div>

        {isFetchingBalances && (
          <Alert>
            <RefreshCw className="h-4 w-4 animate-spin" />
            <AlertDescription>Loading token balances...</AlertDescription>
          </Alert>
        )}

        {userTokenBalances.length === 0 && !isFetchingBalances && (
          <Alert>
            <Coins className="h-4 w-4" />
            <AlertDescription>
              No tokens found in this wallet. Create some tokens using the launchpad above!
            </AlertDescription>
          </Alert>
        )}

        {userTokenBalances.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Token Holdings ({userTokenBalances.length})</h3>
              <Badge variant="outline">Devnet</Badge>
            </div>

            <div className="space-y-3">
              {userTokenBalances.map((tokenBalance) => (
                <div key={tokenBalance.tokenAccount} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{tokenBalance.name || "Unknown Token"}</h4>
                      <div className="flex items-center gap-2">
                        {tokenBalance.symbol && <Badge variant="secondary">{tokenBalance.symbol}</Badge>}
                        <Badge variant="outline">{tokenBalance.decimals} decimals</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Balance</p>
                      <p className="font-mono text-lg">{formatBalance(tokenBalance.balance, tokenBalance.decimals)}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Mint Address</p>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded text-xs font-mono break-all">
                          {tokenBalance.mintAddress}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(tokenBalance.mintAddress, "Mint address")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openInExplorer(tokenBalance.mintAddress)}>
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <p className="text-muted-foreground">Token Account</p>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded text-xs font-mono break-all">
                          {tokenBalance.tokenAccount}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(tokenBalance.tokenAccount, "Token account")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openInExplorer(tokenBalance.tokenAccount)}>
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
