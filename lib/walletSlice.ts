import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import { generateMnemonic, mnemonicToSeed } from "bip39"
import { derivePath } from "ed25519-hd-key"
import { Keypair } from "@solana/web3.js"
import { Wallet, HDNodeWallet } from "ethers"
import nacl from "tweetnacl"
import { toast } from "@/hooks/use-toast"

export interface SolanaWallet {
  id: string
  index: number
  publicKey: string
  privateKey: string
  balance: number
  transactionCount: number
  isLoading: boolean
  lastUpdated: number
}

export interface EthereumWallet {
  id: string
  index: number
  address: string
  privateKey: string
  balance: number
  transactionCount: number
  isLoading: boolean
  lastUpdated: number
}

export interface WalletState {
  mnemonic: string
  showWallets: boolean
  solanaWallets: SolanaWallet[]
  ethereumWallets: EthereumWallet[]
  solanaCurrentIndex: number
  ethereumCurrentIndex: number
  selectedNetwork: "solana" | "ethereum"
  isGeneratingMnemonic: boolean
  error: string | null
}

const initialState: WalletState = {
  mnemonic: "",
  showWallets: false,
  solanaWallets: [],
  ethereumWallets: [],
  solanaCurrentIndex: 0,
  ethereumCurrentIndex: 0,
  selectedNetwork: "solana",
  isGeneratingMnemonic: false,
  error: null,
}

const solanaApiUrl = process.env.NEXT_SOLANA_API
const ethereumApiUrl = process.env.NEXT_ETHEREUM_API
if (!ethereumApiUrl) {
  throw new Error("Missing NEXT_ETHEREUM_API in environment variables")
}
if (!solanaApiUrl) {
  throw new Error("Missing NEXT_SOLANA_API in environment variables")
}

// Async thunks for API calls
export const fetchSolanaBalance = createAsyncThunk(
  "wallet/fetchSolanaBalance",
  async ({ publicKey, walletId }: { publicKey: string; walletId: string }) => {
    try {
      const response = await fetch(solanaApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getBalance",
          params: [publicKey],
        }),
      })

      const data = await response.json()
      toast({
        title: "Balance",
        description: JSON.stringify(data)
      })
      const balance = data.result?.value ? data.result.value / 1000000000 : 0

      return { walletId, balance }
    } catch (error) {
      throw new Error("Failed to fetch Solana balance")
    }
  },
)

export const fetchSolanaTransactionCount = createAsyncThunk(
  "wallet/fetchSolanaTransactionCount",
  async ({ publicKey, walletId }: { publicKey: string; walletId: string }) => {
    try {
      const response = await fetch(solanaApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getSignaturesForAddress",
          params: [publicKey, { limit: 1000 }],
        }),
      })

      const data = await response.json()
      const transactionCount = data.result ? data.result.length : 0

      return { walletId, transactionCount }
    } catch (error) {
      throw new Error("Failed to fetch Solana transaction count")
    }
  },
)

export const fetchEthereumBalance = createAsyncThunk(
  "wallet/fetchEthereumBalance",
  async ({ address, walletId }: { address: string; walletId: string }) => {
    try {
      const response = await fetch(ethereumApiUrl , {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_getBalance",
          params: [address, "latest"],
        }),
      })

      const data = await response.json()
      const balanceWei = Number.parseInt(data.result, 16)
      const balance = balanceWei / 1000000000000000000

      return { walletId, balance }
    } catch (error) {
      throw new Error("Failed to fetch Ethereum balance")
    }
  },
)

export const fetchEthereumTransactionCount = createAsyncThunk(
  "wallet/fetchEthereumTransactionCount",
  async ({ address, walletId }: { address: string; walletId: string }) => {
    try {
      const response = await fetch(ethereumApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_getTransactionCount",
          params: [address, "latest"],
        }),
      })

      const data = await response.json()
      const transactionCount = Number.parseInt(data.result, 16)

      return { walletId, transactionCount }
    } catch (error) {
      throw new Error("Failed to fetch Ethereum transaction count")
    }
  },
)

export const generateSolanaWallet = createAsyncThunk("wallet/generateSolanaWallet", async (_, { getState }) => {
  const state = getState() as { wallet: WalletState }
  const { mnemonic, solanaCurrentIndex } = state.wallet

  try {
    const seed = await mnemonicToSeed(mnemonic)
    const path = `m/44'/501'/${solanaCurrentIndex}'/0'`
    const derivedSeed = derivePath(path, seed.toString("hex")).key
    const secret = nacl.sign.keyPair.fromSeed(derivedSeed).secretKey
    const keypair = Keypair.fromSecretKey(secret)

    const walletId = `solana-${solanaCurrentIndex}-${Date.now()}`

    const newWallet: SolanaWallet = {
      id: walletId,
      index: solanaCurrentIndex,
      publicKey: keypair.publicKey.toBase58(),
      privateKey: Buffer.from(keypair.secretKey).toString("hex"),
      balance: 0,
      transactionCount: 0,
      isLoading: true,
      lastUpdated: Date.now(),
    }

    return newWallet
  } catch (error) {
    throw new Error("Failed to generate Solana wallet")
  }
})

export const generateEthereumWallet = createAsyncThunk("wallet/generateEthereumWallet", async (_, { getState }) => {
  const state = getState() as { wallet: WalletState }
  const { mnemonic, ethereumCurrentIndex } = state.wallet

  try {
    const seed = await mnemonicToSeed(mnemonic)
    const derivationPath = `m/44'/60'/${ethereumCurrentIndex}'/0'`
    const hdNode = HDNodeWallet.fromSeed(seed)
    const child = hdNode.derivePath(derivationPath)
    const wallet = new Wallet(child.privateKey)

    const walletId = `ethereum-${ethereumCurrentIndex}-${Date.now()}`

    const newWallet: EthereumWallet = {
      id: walletId,
      index: ethereumCurrentIndex,
      address: wallet.address,
      privateKey: child.privateKey,
      balance: 0,
      transactionCount: 0,
      isLoading: true,
      lastUpdated: Date.now(),
    }

    return newWallet
  } catch (error) {
    throw new Error("Failed to generate Ethereum wallet")
  }
})

const walletSlice = createSlice({
  name: "wallet",
  initialState,
  reducers: {
    generateNewMnemonic: (state) => {
      state.isGeneratingMnemonic = true
      state.mnemonic = generateMnemonic()
      state.showWallets = true
      state.solanaWallets = []
      state.ethereumWallets = []
      state.solanaCurrentIndex = 0
      state.ethereumCurrentIndex = 0
      state.isGeneratingMnemonic = false
      state.error = null
    },
    setSelectedNetwork: (state, action: PayloadAction<"solana" | "ethereum">) => {
      state.selectedNetwork = action.payload
    },
    resetWallets: (state) => {
      state.mnemonic = ""
      state.showWallets = false
      state.solanaWallets = []
      state.ethereumWallets = []
      state.solanaCurrentIndex = 0
      state.ethereumCurrentIndex = 0
      state.error = null
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Generate Solana Wallet
      .addCase(generateSolanaWallet.fulfilled, (state, action) => {
        state.solanaWallets.push(action.payload)
        state.solanaCurrentIndex += 1
      })
      .addCase(generateSolanaWallet.rejected, (state, action) => {
        state.error = action.error.message || "Failed to generate Solana wallet"
      })

      // Generate Ethereum Wallet
      .addCase(generateEthereumWallet.fulfilled, (state, action) => {
        state.ethereumWallets.push(action.payload)
        state.ethereumCurrentIndex += 1
      })
      .addCase(generateEthereumWallet.rejected, (state, action) => {
        state.error = action.error.message || "Failed to generate Ethereum wallet"
      })

      // Fetch Solana Balance
      .addCase(fetchSolanaBalance.fulfilled, (state, action) => {
        const wallet = state.solanaWallets.find((w) => w.id === action.payload.walletId)
        if (wallet) {
          wallet.balance = action.payload.balance
          wallet.isLoading = false
          wallet.lastUpdated = Date.now()
        }
      })
      .addCase(fetchSolanaBalance.rejected, (state, action) => {
        const walletId = action.meta.arg.walletId
        const wallet = state.solanaWallets.find((w) => w.id === walletId)
        if (wallet) {
          wallet.isLoading = false
        }
      })

      // Fetch Solana Transaction Count
      .addCase(fetchSolanaTransactionCount.fulfilled, (state, action) => {
        const wallet = state.solanaWallets.find((w) => w.id === action.payload.walletId)
        if (wallet) {
          wallet.transactionCount = action.payload.transactionCount
          wallet.lastUpdated = Date.now()
        }
      })

      // Fetch Ethereum Balance
      .addCase(fetchEthereumBalance.fulfilled, (state, action) => {
        const wallet = state.ethereumWallets.find((w) => w.id === action.payload.walletId)
        if (wallet) {
          wallet.balance = action.payload.balance
          wallet.isLoading = false
          wallet.lastUpdated = Date.now()
        }
      })
      .addCase(fetchEthereumBalance.rejected, (state, action) => {
        const walletId = action.meta.arg.walletId
        const wallet = state.ethereumWallets.find((w) => w.id === walletId)
        if (wallet) {
          wallet.isLoading = false
        }
      })

      // Fetch Ethereum Transaction Count
      .addCase(fetchEthereumTransactionCount.fulfilled, (state, action) => {
        const wallet = state.ethereumWallets.find((w) => w.id === action.payload.walletId)
        if (wallet) {
          wallet.transactionCount = action.payload.transactionCount
          wallet.lastUpdated = Date.now()
        }
      })
  },
})

export const { generateNewMnemonic, setSelectedNetwork, resetWallets, clearError } = walletSlice.actions
export default walletSlice.reducer
