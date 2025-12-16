export interface QuoteRequest {
  inputToken: string
  outputToken: string
  amount: number
  slippage: number
}

export interface DexQuote {
  dex: "raydium" | "meteora"
  expectedOutput: number
  price: number
  fee: number
}

export interface BuiltTransaction {
  dex: "raydium" | "meteora"
  txPayload: any
}

export interface ExecutionResult {
  txHash: string
  executionPrice: number
}
