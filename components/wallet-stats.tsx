"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAppSelector } from "@/lib/hooks"
import { Wallet, Activity, DollarSign, Hash } from "lucide-react"

export function WalletStats() {
  const { solanaWallets, ethereumWallets, selectedNetwork, solanaCurrentIndex, ethereumCurrentIndex } = useAppSelector(
    (state) => state.wallet,
  )

  const currentWallets = selectedNetwork === "solana" ? solanaWallets : ethereumWallets
  const totalBalance = currentWallets.reduce((sum, wallet) => sum + wallet.balance, 0)
  const totalTransactions = currentWallets.reduce((sum, wallet) => sum + wallet.transactionCount, 0)
  const currentIndex = selectedNetwork === "solana" ? solanaCurrentIndex : ethereumCurrentIndex

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Wallets</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{currentWallets.length}</div>
          <p className="text-xs text-muted-foreground">Next index: {currentIndex}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalBalance.toFixed(6)}</div>
          <p className="text-xs text-muted-foreground">{selectedNetwork === "solana" ? "SOL" : "ETH"}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTransactions}</div>
          <p className="text-xs text-muted-foreground">Across all wallets</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Network</CardTitle>
          <Hash className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                selectedNetwork === "solana"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500"
                  : "bg-gradient-to-r from-blue-500 to-cyan-500"
              }`}
            ></div>
            <Badge variant="outline" className="capitalize">
              {selectedNetwork}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
