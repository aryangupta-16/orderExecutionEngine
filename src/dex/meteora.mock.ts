import { QuoteRequest, DexQuote, BuiltTransaction, ExecutionResult } from "./dex.types"

export class MeteoraService {
  async getQuote(req: QuoteRequest): Promise<DexQuote> {
    const price = 24.7
    const expectedOutput = req.amount * price

    return {
      dex: "meteora",
      price,
      expectedOutput,
      fee: 0.0025,
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
    return {
      txHash: `meteora_tx_${Date.now()}`,
      executionPrice: 24.69,
    }
  }
}
