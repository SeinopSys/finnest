import { MockStockPriceService } from './mock-stock-price.service.js';

describe('MockStockPriceService', () => {
  let service: MockStockPriceService;

  beforeEach(() => {
    service = new MockStockPriceService();
    MockStockPriceService.mockData = {};
  });

  it('should return prices from mockData in order', async () => {
    const symbol = 'AAPL';
    MockStockPriceService.mockData = {
      [symbol]: [150.5, 151.2, 149.8],
    };

    expect(await service.getStockPrice(symbol)).toBe(150.5);
    expect(await service.getStockPrice(symbol)).toBe(151.2);
    expect(await service.getStockPrice(symbol)).toBe(149.8);
    expect(MockStockPriceService.mockData[symbol]).toHaveLength(0);
    await expect(service.getStockPrice(symbol)).rejects.toThrow(
      'No mock data available',
    );
  });

  it('should throw error if no mock data is available for symbol', async () => {
    MockStockPriceService.mockData = {};
    const promise = service.getStockPrice('AAPL');
    await expect(promise).rejects.toThrow('No mock data available');
  });

  it('should throw error if mock data array is empty', async () => {
    MockStockPriceService.mockData = {
      AAPL: [],
    };
    const promise = service.getStockPrice('AAPL');
    await expect(promise).rejects.toThrow('No mock data available');
  });
});
