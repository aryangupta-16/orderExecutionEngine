
import { MeteoraService } from '../dex/meteora.mock';
import { RaydiumService } from '../dex/raydium.mock';

describe('DEX Mocks', () => {
  describe('MeteoraService', () => {
    let service: MeteoraService;

    beforeEach(() => {
      service = new MeteoraService();
    });

    it('should return a quote', async () => {
      const quote = await service.getQuote({
        inputToken: 'SOL',
        outputToken: 'USDC',
        amount: 1,
        slippage: 0.5
      });

      expect(quote.dex).toBe('meteora');
      expect(quote.price).toBeGreaterThan(0);
      expect(quote.expectedOutput).toBeGreaterThan(0);
      expect(quote.fee).toBe(0.002);
    });

    it('should build a transaction', async () => {
      const tx = await service.buildTransaction({
        dex: 'meteora',
        price: 100,
        expectedOutput: 100,
        fee: 0.002
      });

      expect(tx.dex).toBe('meteora');
      expect(tx.txPayload).toBeDefined();
    });

    it('should submit a transaction', async () => {
      const result = await service.submitTransaction({
        dex: 'meteora',
        txPayload: {}
      });

      expect(result.txHash).toContain('meteora_tx_');
      expect(result.executionPrice).toBeGreaterThan(0);
    });
  });

  describe('RaydiumService', () => {
    let service: RaydiumService;

    beforeEach(() => {
      service = new RaydiumService();
    });

    it('should return a quote', async () => {
      const quote = await service.getQuote({
        inputToken: 'SOL',
        outputToken: 'USDC',
        amount: 1,
        slippage: 0.5
      });

      expect(quote.dex).toBe('raydium');
      expect(quote.price).toBeGreaterThan(0);
      expect(quote.expectedOutput).toBeGreaterThan(0);
      expect(quote.fee).toBe(0.003);
    });

    it('should build a transaction', async () => {
      const tx = await service.buildTransaction({
        dex: 'raydium',
        price: 100,
        expectedOutput: 100,
        fee: 0.003
      });

      expect(tx.dex).toBe('raydium');
      expect(tx.txPayload).toBeDefined();
    });

    it('should submit a transaction', async () => {
      const result = await service.submitTransaction({
        dex: 'raydium',
        txPayload: {}
      });

      expect(result.txHash).toContain('raydium_tx_');
      expect(result.executionPrice).toBeGreaterThan(0);
    });
  });
});
