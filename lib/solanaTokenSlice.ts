import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import { Connection, clusterApiUrl, Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, TOKEN_PROGRAM_ID, getMint, MintLayout, AccountLayout } from "@solana/spl-token"
import { fetchSolanaBalance } from "./walletSlice"

export interface TokenInfo {
  mintAddress: string
  name: string
  symbol: string
  decimals: number
  supply: string
  freezeAuthority: string | null
  mintAuthority: string | null
  createdAt: number
  isLoading: boolean
}

export interface UserTokenBalance {
  mintAddress: string
  tokenAccount: string
  balance: string
  decimals: number
  name?: string
  symbol?: string
  isLoading: boolean
}

export interface CreateTokenParams {
  name: string
  symbol: string
  decimals: number
  initialSupply: number
  freezeAuthority: boolean
  mintAuthority: boolean
  walletPrivateKey: string
}

export interface AirdropParams {
  walletPublicKey: string
  amount: number // Amount in SOL
}

export interface SolanaTokenState {
  createdTokens: TokenInfo[]
  userTokenBalances: UserTokenBalance[]
  isCreatingToken: boolean
  isFetchingBalances: boolean
  isRequestingAirdrop: boolean
  error: string | null
}

const initialState: SolanaTokenState = {
  createdTokens: [],
  userTokenBalances: [],
  isCreatingToken: false,
  isFetchingBalances: false,
  isRequestingAirdrop: false,
  error: null,
}

// Create a new token
export const createToken = createAsyncThunk("solanaToken/createToken", async (params: CreateTokenParams) => {
  try {
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed")

    // Convert private key from hex to Uint8Array
    const privateKeyBytes = new Uint8Array(Buffer.from(params.walletPrivateKey, "hex"))
    const payer = Keypair.fromSecretKey(privateKeyBytes)

    const balance = await connection.getBalance(payer.publicKey)
const mintRent = await connection.getMinimumBalanceForRentExemption(MintLayout.span);
    const tokenAccountRent = params.initialSupply > 0
      ? await connection.getMinimumBalanceForRentExemption(AccountLayout.span)
      : 0;
    const requiredBalance = mintRent + tokenAccountRent + (0.001 * LAMPORTS_PER_SOL);

    if (balance < requiredBalance) {
      throw new Error(
        `Insufficient SOL balance. Required at least ${requiredBalance / LAMPORTS_PER_SOL} SOL ` +
        `(rent + fees) but have ${balance / LAMPORTS_PER_SOL} SOL.`
      );
    }

    // Create mint (FIXED: don't pass payer as mint keypair)
    const mint = await createMint(
      connection,
      payer,
      payer.publicKey,  // mint authority
      params.freezeAuthority ? payer.publicKey : null,  // freeze authority
      params.decimals,
      undefined,  // Let function generate new keypair for mint
      { commitment: "confirmed" },
      TOKEN_PROGRAM_ID
    );

    // Create associated token account and mint initial supply
    if (params.initialSupply > 0) {
      const tokenAccount = await getOrCreateAssociatedTokenAccount(connection, payer, mint, payer.publicKey)

      await mintTo(
        connection,
        payer,
        mint,
        tokenAccount.address,
        payer,
        params.initialSupply * Math.pow(10, params.decimals),
      )
    }

    const tokenInfo: TokenInfo = {
      mintAddress: mint.toBase58(),
      name: params.name,
      symbol: params.symbol,
      decimals: params.decimals,
      supply: (params.initialSupply * Math.pow(10, params.decimals)).toString(),
      freezeAuthority: params.freezeAuthority ? payer.publicKey.toBase58() : null,
      mintAuthority: params.mintAuthority ? payer.publicKey.toBase58() : null,
      createdAt: Date.now(),
      isLoading: false,
    }

    return tokenInfo
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Simulation failed") || error.message.includes("insufficient funds")) {
        throw new Error("Insufficient SOL balance for transaction fees. Please request an airdrop first.")
      }
      throw new Error(`Failed to create token: ${error.message}`)
    }
    throw new Error("Failed to create token: Unknown error occurred")
  }
})

// Fetch user token balances
export const fetchUserTokenBalances = createAsyncThunk(
  "solanaToken/fetchUserTokenBalances",
  async (walletPublicKey: string) => {
    try {
      const connection = new Connection(clusterApiUrl("devnet"), "confirmed")
      const publicKey = new PublicKey(walletPublicKey)

      // Get all token accounts for the wallet
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
        programId: TOKEN_PROGRAM_ID,
      })

      const balances: UserTokenBalance[] = []

      for (const tokenAccount of tokenAccounts.value) {
        const accountData = tokenAccount.account.data.parsed
        const mintAddress = accountData.info.mint
        const balance = accountData.info.tokenAmount.amount
        const decimals = accountData.info.tokenAmount.decimals

        // Skip accounts with zero balance
        if (balance === "0") continue

        balances.push({
          mintAddress,
          tokenAccount: tokenAccount.pubkey.toBase58(),
          balance,
          decimals,
          isLoading: false,
        })
      }

      return balances
    } catch (error) {
      throw new Error(`Failed to fetch token balances: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  },
)

// Mint additional tokens
export const mintAdditionalTokens = createAsyncThunk(
  "solanaToken/mintAdditionalTokens",
  async ({
    mintAddress,
    amount,
    walletPrivateKey,
    recipientPublicKey,
  }: {
    mintAddress: string
    amount: number
    walletPrivateKey: string
    recipientPublicKey: string
  }) => {
    try {
      const connection = new Connection(clusterApiUrl("devnet"), "confirmed")
      const privateKeyBytes = new Uint8Array(Buffer.from(walletPrivateKey, "hex"))
      const payer = Keypair.fromSecretKey(privateKeyBytes)
      const mint = new PublicKey(mintAddress)
      const recipient = new PublicKey(recipientPublicKey)

      // Get mint info to determine decimals
      const mintInfo = await getMint(connection, mint)

      // Get or create associated token account for recipient
      const tokenAccount = await getOrCreateAssociatedTokenAccount(connection, payer, mint, recipient)

      // Mint tokens
      await mintTo(connection, payer, mint, tokenAccount.address, payer, amount * Math.pow(10, mintInfo.decimals))

      return {
        mintAddress,
        amount: amount * Math.pow(10, mintInfo.decimals),
        recipient: recipientPublicKey,
      }
    } catch (error) {
      throw new Error(`Failed to mint additional tokens: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  },
)

// Request airdrop
export const requestAirdrop = createAsyncThunk(
  "solanaToken/requestAirdrop",
  async (params: AirdropParams, { dispatch, getState }) => {
    try {
      const connection = new Connection(clusterApiUrl("devnet"), "confirmed")
      const publicKey = new PublicKey(params.walletPublicKey)

      // Request airdrop (amount in SOL converted to lamports)
      const signature = await connection.requestAirdrop(publicKey, params.amount * LAMPORTS_PER_SOL)

      // Wait for confirmation
      await connection.confirmTransaction(signature, "confirmed")

      // Get updated balance
      const balance = await connection.getBalance(publicKey)

      const state = getState() as any
      const wallet = state.wallet.solanaWallets.find((w: any) => w.publicKey === params.walletPublicKey)

      if (wallet) {
        // Dispatch fetchSolanaBalance to update the wallet balance in wallet slice
        dispatch(
          fetchSolanaBalance({
            publicKey: params.walletPublicKey,
            walletId: wallet.id,
          }),
        )
      }

      return {
        signature,
        newBalance: balance / LAMPORTS_PER_SOL,
        walletPublicKey: params.walletPublicKey,
      }
    } catch (error) {
      throw new Error(`Failed to request airdrop: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  },
)

const solanaTokenSlice = createSlice({
  name: "solanaToken",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setTokenMetadata: (state, action: PayloadAction<{ mintAddress: string; name: string; symbol: string }>) => {
      const balance = state.userTokenBalances.find((b) => b.mintAddress === action.payload.mintAddress)
      if (balance) {
        balance.name = action.payload.name
        balance.symbol = action.payload.symbol
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Create token
      .addCase(createToken.pending, (state) => {
        state.isCreatingToken = true
        state.error = null
      })
      .addCase(createToken.fulfilled, (state, action) => {
        state.isCreatingToken = false
        state.createdTokens.push(action.payload)
      })
      .addCase(createToken.rejected, (state, action) => {
        state.isCreatingToken = false
        state.error = action.error.message || "Failed to create token"
      })

      // Fetch user token balances
      .addCase(fetchUserTokenBalances.pending, (state) => {
        state.isFetchingBalances = true
        state.error = null
      })
      .addCase(fetchUserTokenBalances.fulfilled, (state, action) => {
        state.isFetchingBalances = false
        state.userTokenBalances = action.payload
      })
      .addCase(fetchUserTokenBalances.rejected, (state, action) => {
        state.isFetchingBalances = false
        state.error = action.error.message || "Failed to fetch token balances"
      })

      // Mint additional tokens
      .addCase(mintAdditionalTokens.fulfilled, (state, action) => {
        // Update the token supply in created tokens
        const token = state.createdTokens.find((t) => t.mintAddress === action.payload.mintAddress)
        if (token) {
          const currentSupply = Number.parseInt(token.supply)
          token.supply = (currentSupply + action.payload.amount).toString()
        }
      })
      .addCase(mintAdditionalTokens.rejected, (state, action) => {
        state.error = action.error.message || "Failed to mint additional tokens"
      })

      // Request airdrop
      .addCase(requestAirdrop.pending, (state) => {
        state.isRequestingAirdrop = true
        state.error = null
      })
      .addCase(requestAirdrop.fulfilled, (state) => {
        state.isRequestingAirdrop = false
        // Airdrop successful - error will be cleared
      })
      .addCase(requestAirdrop.rejected, (state, action) => {
        state.isRequestingAirdrop = false
        state.error = action.error.message || "Failed to request airdrop"
      })
  },
})

export const { clearError, setTokenMetadata } = solanaTokenSlice.actions
export default solanaTokenSlice.reducer
