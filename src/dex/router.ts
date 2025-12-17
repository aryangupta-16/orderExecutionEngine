import { QuoteRequest, DexQuote } from "./dex.types"
import { RaydiumService } from "./raydium.mock"
import { MeteoraService } from "./meteora.mock"

export class DexRouter {
  private raydium = new RaydiumService()
  private meteora = new MeteoraService()

  async findBestRoute(req: QuoteRequest): Promise<DexQuote> {
    const [raydiumQuote, meteoraQuote] = await Promise.all([
      this.raydium.getQuote(req),
      this.meteora.getQuote(req),
    ])

    return raydiumQuote.expectedOutput > meteoraQuote.expectedOutput
      ? raydiumQuote
      : meteoraQuote
  }

  async buildTransaction(quote: DexQuote) {
    if (quote.dex === "raydium") {
      return this.raydium.buildTransaction(quote)
    }
    return this.meteora.buildTransaction(quote)
  }

  async executeTransaction(builtTx: any) {
    if (builtTx.dex === "raydium") {
      return this.raydium.submitTransaction(builtTx)
    }
    return this.meteora.submitTransaction(builtTx)
  }
}
