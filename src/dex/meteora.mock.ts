import { QuoteRequest, DexQuote, BuiltTransaction, ExecutionResult } from "./dex.types"

// Helper functions
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const generateMockTxHash = () => `meteora_tx_${Math.floor(Math.random() * 1_000_000)}`
const basePrice = 24.7

export class MeteoraService {
  async getQuote(req: QuoteRequest): Promise<DexQuote> {
    await sleep(200) // simulate network delay
    const price = basePrice * (0.97 + Math.random() * 0.05)
    const expectedOutput = req.amount * price

    return {
      dex: "meteora",
      price,
      expectedOutput,
      fee: 0.002,
    }
  }

  async buildTransaction(quote: DexQuote): Promise<BuiltTransaction> {
    return {
      dex: "meteora",
      txPayload: {
        instructions: "mock-meteora-instructions",
      },
    }
  }

  async submitTransaction(tx: BuiltTransaction): Promise<ExecutionResult> {
    await sleep(2000 + Math.random() * 1000) // simulate execution time
    const executedPrice = basePrice * (0.97 + Math.random() * 0.05)
    return {
      txHash: generateMockTxHash(),
      executionPrice: executedPrice,
    }
  }
}
