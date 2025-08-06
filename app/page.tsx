"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, Wallet, AlertCircle } from "lucide-react"
import { MnemonicDisplay } from "@/components/mnemonic-display"
import { useToast } from "@/hooks/use-toast"
import { useAppDispatch, useAppSelector } from "@/lib/hooks"
import { generateNewMnemonic, resetWallets, setSelectedNetwork } from "@/lib/walletSlice"
import { SolanaWallet } from "@/components/solana-wallet"
import { EthereumWallet } from "@/components/ethereum-wallet"
import { WalletStats } from "@/components/wallet-stats"

export default function Home() {
  const dispatch = useAppDispatch()
  const { mnemonic, showWallets, selectedNetwork, isGeneratingMnemonic, error } = useAppSelector(
    (state) => state.wallet,
  )
  const { toast } = useToast()

  const handleGenerateNewMnemonic = () => {
    dispatch(generateNewMnemonic())
    toast({
      title: "New Mnemonic Generated",
      description: "Your seed phrase has been created successfully.",
    })
  }

  const handleResetWallets = () => {
    dispatch(resetWallets())
    toast({
      title: "Wallets Reset",
      description: "All wallet data has been cleared.",
    })
  }

  const copyMnemonic = async () => {
    if (mnemonic) {
      await navigator.clipboard.writeText(mnemonic)
      toast({
        title: "Copied!",
        description: "Mnemonic phrase copied to clipboard.",
      })
    }
  }

  const handleNetworkChange = (network: string) => {
    dispatch(setSelectedNetwork(network as "solana" | "ethereum"))
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Crypto Wallet Generator
        </h1>
        <p className="text-muted-foreground text-lg">Generate secure HD wallets for Solana and Ethereum networks</p>
      </div>

      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="font-medium text-red-800 dark:text-red-200">{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {!showWallets ? (
          <Card className="mx-auto max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Wallet className="h-5 w-5" />
                Get Started
              </CardTitle>
              <CardDescription>Generate a new mnemonic phrase to create your wallets</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleGenerateNewMnemonic} className="w-full" size="lg" disabled={isGeneratingMnemonic}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isGeneratingMnemonic ? "animate-spin" : ""}`} />
                Generate New Mnemonic
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="font-medium">
                <strong>Security Warning:</strong> Store your mnemonic phrase securely. Anyone with access to it can
                control your wallets.
              </AlertDescription>
            </Alert>

            <MnemonicDisplay mnemonic={mnemonic} onCopy={copyMnemonic} />

            <div className="flex gap-2 justify-center">
              <Badge variant="secondary" className="text-sm">
                BIP39 Compatible
              </Badge>
              <Badge variant="secondary" className="text-sm">
                HD Wallets
              </Badge>
              <Badge variant="secondary" className="text-sm">
                Redux Persist
              </Badge>
            </div>

            <WalletStats />

            <Tabs value={selectedNetwork} onValueChange={handleNetworkChange} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="solana" className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                  Solana
                </TabsTrigger>
                <TabsTrigger value="ethereum" className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
                  Ethereum
                </TabsTrigger>
              </TabsList>

              <TabsContent value="solana" className="mt-6">
                <SolanaWallet />
              </TabsContent>

              <TabsContent value="ethereum" className="mt-6">
                <EthereumWallet />
              </TabsContent>
            </Tabs>

            <div className="text-center">
              <Button variant="outline" onClick={handleResetWallets}>
                Generate New Mnemonic
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
