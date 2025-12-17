import { QuoteRequest, DexQuote, BuiltTransaction, ExecutionResult } from "./dex.types"

// Helper functions
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const generateMockTxHash = () => `raydium_tx_${Math.floor(Math.random() * 1_000_000)}`
const basePrice = 24.5

export class RaydiumService {
  async getQuote(req: QuoteRequest): Promise<DexQuote> {
    await sleep(200) // simulate network delay
    const price = basePrice * (0.98 + Math.random() * 0.04)
    const expectedOutput = req.amount * price

    return {
      dex: "raydium",
      price,
      expectedOutput,
      fee: 0.003,
    }
  }

  async buildTransaction(quote: DexQuote): Promise<BuiltTransaction> {
    return {
      dex: "raydium",
      txPayload: {
        instructions: "mock-raydium-instructions",
      },
    }
  }

  async submitTransaction(tx: BuiltTransaction): Promise<ExecutionResult> {
    await sleep(2000 + Math.random() * 1000) // simulate execution time
    const executedPrice = basePrice * (0.98 + Math.random() * 0.04)
    return {
      txHash: generateMockTxHash(),
      executionPrice: executedPrice,
    }
  }
}
