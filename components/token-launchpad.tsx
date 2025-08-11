"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Rocket, Coins, AlertCircle, Copy, ExternalLink, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAppDispatch, useAppSelector } from "@/lib/hooks"
import { createToken, clearError, requestAirdrop } from "@/lib/solanaTokenSlice"
import { fetchSolanaBalance } from "@/lib/walletSlice"

export function TokenLaunchpad() {
  const dispatch = useAppDispatch()
  const { solanaWallets } = useAppSelector((state) => state.wallet)
  const { createdTokens, isCreatingToken, isRequestingAirdrop, error } = useAppSelector((state) => state.solanaToken)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    decimals: 9,
    initialSupply: 1000000,
    freezeAuthority: true,
    mintAuthority: true,
    selectedWallet: 0,
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleRequestAirdrop = async () => {
    if (solanaWallets.length === 0) {
      toast({
        title: "No Wallet Found",
        description: "Please create a Solana wallet first.",
        variant: "destructive",
      })
      return
    }

    const selectedWallet = solanaWallets[formData.selectedWallet]
    if (!selectedWallet) {
      toast({
        title: "Invalid Wallet",
        description: "Selected wallet not found.",
        variant: "destructive",
      })
      return
    }

    try {
      const result = await dispatch(
        requestAirdrop({
          walletPublicKey: selectedWallet.publicKey,
          amount: 2, // Request 2 SOL
        }),
      ).unwrap()

      toast({
        title: "Airdrop Successful!",
        description: `Received 2 SOL. New balance: ${result.newBalance.toFixed(4)} SOL. Wallet balance will update shortly.`,
      })

      // Force refresh wallet balance after successful airdrop
      setTimeout(() => {
        dispatch(
          fetchSolanaBalance({
            publicKey: selectedWallet.publicKey,
            walletId: selectedWallet.id,
          }),
        )
      }, 2000)
    } catch (error) {
      toast({
        title: "Airdrop Failed",
        description: error instanceof Error ? error.message : "Failed to request airdrop",
        variant: "destructive",
      })
    }
  }

  const handleCreateToken = async () => {
    if (!formData.name || !formData.symbol) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    if (solanaWallets.length === 0) {
      toast({
        title: "No Wallet Found",
        description: "Please create a Solana wallet first.",
        variant: "destructive",
      })
      return
    }

    const selectedWallet = solanaWallets[formData.selectedWallet]
    if (!selectedWallet) {
      toast({
        title: "Invalid Wallet",
        description: "Selected wallet not found.",
        variant: "destructive",
      })
      return
    }

    try {
      await dispatch(
        createToken({
          name: formData.name,
          symbol: formData.symbol,
          decimals: formData.decimals,
          initialSupply: formData.initialSupply,
          freezeAuthority: formData.freezeAuthority,
          mintAuthority: formData.mintAuthority,
          walletPrivateKey: selectedWallet.privateKey,
        }),
      ).unwrap()

      toast({
        title: "Token Created Successfully!",
        description: `${formData.name} (${formData.symbol}) has been launched on Solana Devnet.`,
      })

      // Reset form
      setFormData({
        name: "",
        symbol: "",
        decimals: 9,
        initialSupply: 1000000,
        freezeAuthority: true,
        mintAuthority: true,
        selectedWallet: 0,
      })
    } catch (error) {
      toast({
        title: "Token Creation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
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

  const openInExplorer = (mintAddress: string) => {
    window.open(`https://explorer.solana.com/address/${mintAddress}?cluster=devnet`, "_blank")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Token Launchpad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800 dark:text-red-200">
                {error}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dispatch(clearError())}
                  className="ml-2 h-auto p-0 text-red-600 hover:text-red-800"
                >
                  Dismiss
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Devnet Notice:</strong> Tokens will be created on Solana Devnet for testing purposes.
            </AlertDescription>
          </Alert>

          <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
            <Zap className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <strong>Need SOL for transaction fees?</strong> Request devnet SOL to pay for token creation.
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRequestAirdrop}
                disabled={isRequestingAirdrop || solanaWallets.length === 0}
                className="ml-4 bg-transparent"
              >
                <Zap className="h-3 w-3 mr-1" />
                {isRequestingAirdrop ? "Requesting..." : "Get 2 SOL"}
              </Button>
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="token-name">Token Name *</Label>
              <Input
                id="token-name"
                placeholder="e.g., My Awesome Token"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="token-symbol">Token Symbol *</Label>
              <Input
                id="token-symbol"
                placeholder="e.g., MAT"
                value={formData.symbol}
                onChange={(e) => handleInputChange("symbol", e.target.value.toUpperCase())}
                maxLength={10}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="decimals">Decimals</Label>
              <Input
                id="decimals"
                type="number"
                min="0"
                max="18"
                value={formData.decimals}
                onChange={(e) => handleInputChange("decimals", Number.parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="initial-supply">Initial Supply</Label>
              <Input
                id="initial-supply"
                type="number"
                min="0"
                value={formData.initialSupply}
                onChange={(e) => handleInputChange("initialSupply", Number.parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wallet-select">Select Wallet</Label>
              <select
                id="wallet-select"
                className="w-full p-2 border rounded-md bg-background"
                value={formData.selectedWallet}
                onChange={(e) => handleInputChange("selectedWallet", Number.parseInt(e.target.value))}
              >
                {solanaWallets.map((wallet, index) => (
                  <option key={wallet.id} value={index}>
                    Wallet {index + 1} ({wallet.publicKey.slice(0, 8)}...)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Freeze Authority</Label>
                <p className="text-sm text-muted-foreground">Ability to freeze token accounts</p>
              </div>
              <Switch
                checked={formData.freezeAuthority}
                onCheckedChange={(checked) => handleInputChange("freezeAuthority", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Mint Authority</Label>
                <p className="text-sm text-muted-foreground">Ability to mint additional tokens</p>
              </div>
              <Switch
                checked={formData.mintAuthority}
                onCheckedChange={(checked) => handleInputChange("mintAuthority", checked)}
              />
            </div>
          </div>

          <Button
            onClick={handleCreateToken}
            className="w-full"
            disabled={isCreatingToken || solanaWallets.length === 0}
          >
            <Rocket className="h-4 w-4 mr-2" />
            {isCreatingToken ? "Creating Token..." : "Launch Token"}
          </Button>
        </CardContent>
      </Card>

      {createdTokens.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Your Created Tokens ({createdTokens.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {createdTokens.map((token) => (
                <div key={token.mintAddress} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{token.name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{token.symbol}</Badge>
                        <Badge variant="outline">{token.decimals} decimals</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Supply</p>
                      <p className="font-mono text-lg">
                        {(Number.parseInt(token.supply) / Math.pow(10, token.decimals)).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Mint Address</p>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded text-xs font-mono break-all">
                          {token.mintAddress}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(token.mintAddress, "Mint address")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openInExplorer(token.mintAddress)}>
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <p className="text-muted-foreground">Created</p>
                      <p>{new Date(token.createdAt).toLocaleString()}</p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">Freeze Authority</p>
                      <p>{token.freezeAuthority ? "Enabled" : "Disabled"}</p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">Mint Authority</p>
                      <p>{token.mintAuthority ? "Enabled" : "Disabled"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
