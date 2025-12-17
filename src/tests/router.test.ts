import { DexRouter } from '../dex/router';
import { RaydiumService } from '../dex/raydium.mock';
import { MeteoraService } from '../dex/meteora.mock';
import { QuoteRequest, DexQuote } from '../dex/dex.types';

// Mock dependencies
jest.mock('../dex/raydium.mock');
jest.mock('../dex/meteora.mock');

describe('DexRouter', () => {
  let router: DexRouter;
  let mockRaydium: jest.Mocked<RaydiumService>;
  let mockMeteora: jest.Mocked<MeteoraService>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Initialize router
    router = new DexRouter();
    
    // Get mock instances
    mockRaydium = (RaydiumService as any).mock.instances[0];
    mockMeteora = (MeteoraService as any).mock.instances[0];
  });

  describe('findBestRoute', () => {
    const request: QuoteRequest = {
      inputToken: 'SOL',
      outputToken: 'USDC',
      amount: 1,
      slippage: 0.5
    };

    it('should select Raydium when it offers better price', async () => {
      const raydiumQuote: DexQuote = {
        dex: 'raydium',
        expectedOutput: 105,
        price: 105,
        fee: 0.003
      };
      const meteoraQuote: DexQuote = {
        dex: 'meteora',
        expectedOutput: 100,
        price: 100,
        fee: 0.002
      };

      (mockRaydium.getQuote as jest.Mock).mockResolvedValue(raydiumQuote);
      (mockMeteora.getQuote as jest.Mock).mockResolvedValue(meteoraQuote);

      const result = await router.findBestRoute(request);

      expect(result).toEqual(raydiumQuote);
      expect(mockRaydium.getQuote).toHaveBeenCalledWith(request);
      expect(mockMeteora.getQuote).toHaveBeenCalledWith(request);
    });

    it('should select Meteora when it offers better price', async () => {
      const raydiumQuote: DexQuote = {
        dex: 'raydium',
        expectedOutput: 98,
        price: 98,
        fee: 0.003
      };
      const meteoraQuote: DexQuote = {
        dex: 'meteora',
        expectedOutput: 100,
        price: 100,
        fee: 0.002
      };

      (mockRaydium.getQuote as jest.Mock).mockResolvedValue(raydiumQuote);
      (mockMeteora.getQuote as jest.Mock).mockResolvedValue(meteoraQuote);

      const result = await router.findBestRoute(request);

      expect(result).toEqual(meteoraQuote);
    });

    it('should handle errors from one DEX gracefully if implemented', async () => {
      // Assuming Promise.all fails if one fails. 
      // If the implementation changes to Promise.allSettled, this test would need to change.
      // Current implementation uses Promise.all so it will reject.
      (mockRaydium.getQuote as jest.Mock).mockRejectedValue(new Error('Network Error'));
      (mockMeteora.getQuote as jest.Mock).mockResolvedValue({} as any);

      await expect(router.findBestRoute(request)).rejects.toThrow('Network Error');
    });
  });

  describe('buildTransaction', () => {
    it('should delegate to Raydium service for raydium quotes', async () => {
      const quote: DexQuote = { dex: 'raydium', expectedOutput: 100, price: 100, fee: 0 };
      await router.buildTransaction(quote);
      expect(mockRaydium.buildTransaction).toHaveBeenCalledWith(quote);
      expect(mockMeteora.buildTransaction).not.toHaveBeenCalled();
    });

    it('should delegate to Meteora service for meteora quotes', async () => {
      const quote: DexQuote = { dex: 'meteora', expectedOutput: 100, price: 100, fee: 0 };
      await router.buildTransaction(quote);
      expect(mockMeteora.buildTransaction).toHaveBeenCalledWith(quote);
      expect(mockRaydium.buildTransaction).not.toHaveBeenCalled();
    });
  });

  describe('executeTransaction', () => {
    it('should delegate to Raydium service for raydium transactions', async () => {
      const tx = { dex: 'raydium', txPayload: 'data' };
      await router.executeTransaction(tx);
      expect(mockRaydium.submitTransaction).toHaveBeenCalledWith(tx);
    });

    it('should delegate to Meteora service for meteora transactions', async () => {
      const tx = { dex: 'meteora', txPayload: 'data' };
      await router.executeTransaction(tx);
      expect(mockMeteora.submitTransaction).toHaveBeenCalledWith(tx);
    });
  });
});
