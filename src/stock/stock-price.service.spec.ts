import { Test, TestingModule } from '@nestjs/testing';
import { StockPriceService } from './stock-price.service.js';
import { MockStockPriceService } from './price-providers/mock-stock-price.service.js';
import { FinnhubStockPriceService } from './price-providers/finnhub-stock-price.service.js';
import { AlphaVantageStockPriceService } from './price-providers/alpha-vantage-stock-price.service.js';

describe('StockPriceService', () => {
  let mockPriceProvider: MockStockPriceService;
  let finnhubPriceProvider: FinnhubStockPriceService;
  let alphaVantagePriceProvider: AlphaVantageStockPriceService;

  const createService = async (provider: string | undefined) => {
    if (provider) {
      process.env.STOCK_PRICE_PROVIDER = provider;
    } else {
      delete process.env.STOCK_PRICE_PROVIDER;
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockPriceService,
        {
          provide: MockStockPriceService,
          useValue: { getStockPrice: vi.fn() },
        },
        {
          provide: FinnhubStockPriceService,
          useValue: { getStockPrice: vi.fn() },
        },
        {
          provide: AlphaVantageStockPriceService,
          useValue: { getStockPrice: vi.fn() },
        },
      ],
    }).compile();

    mockPriceProvider = module.get<MockStockPriceService>(
      MockStockPriceService,
    );
    finnhubPriceProvider = module.get<FinnhubStockPriceService>(
      FinnhubStockPriceService,
    );
    alphaVantagePriceProvider = module.get<AlphaVantageStockPriceService>(
      AlphaVantageStockPriceService,
    );

    return module.get<StockPriceService>(StockPriceService);
  };

  afterEach(() => {
    delete process.env.STOCK_PRICE_PROVIDER;
    vi.clearAllMocks();
  });

  it('should use MockStockPriceService when provider is "mock"', async () => {
    const service = await createService('mock');
    const symbol = 'AAPL';
    // eslint-disable-next-line @typescript-eslint/unbound-method
    vi.mocked(mockPriceProvider.getStockPrice).mockResolvedValue(150.5);

    const price = await service.getStockPrice(symbol);

    expect(price).toBe(150.5);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockPriceProvider.getStockPrice).toHaveBeenCalledWith(symbol);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(finnhubPriceProvider.getStockPrice).not.toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(alphaVantagePriceProvider.getStockPrice).not.toHaveBeenCalled();
  });

  it('should use FinnhubStockPriceService when provider is "finnhub"', async () => {
    const service = await createService('finnhub');
    const symbol = 'AAPL';
    // eslint-disable-next-line @typescript-eslint/unbound-method
    vi.mocked(finnhubPriceProvider.getStockPrice).mockResolvedValue(160.5);

    const price = await service.getStockPrice(symbol);

    expect(price).toBe(160.5);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(finnhubPriceProvider.getStockPrice).toHaveBeenCalledWith(symbol);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockPriceProvider.getStockPrice).not.toHaveBeenCalled();
  });

  it('should use AlphaVantageStockPriceService when provider is "alpha-vantage"', async () => {
    const service = await createService('alpha-vantage');
    const symbol = 'AAPL';
    // eslint-disable-next-line @typescript-eslint/unbound-method
    vi.mocked(alphaVantagePriceProvider.getStockPrice).mockResolvedValue(170.5);

    const price = await service.getStockPrice(symbol);

    expect(price).toBe(170.5);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(alphaVantagePriceProvider.getStockPrice).toHaveBeenCalledWith(
      symbol,
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockPriceProvider.getStockPrice).not.toHaveBeenCalled();
  });

  it('should throw error when provider is invalid', async () => {
    // noinspection ES6RedundantAwait
    await expect(createService('invalid')).rejects.toThrow(
      'Invalid STOCK_PRICE_PROVIDER environment variable value: invalid',
    );
  });

  it('should throw error when provider is not set', async () => {
    // noinspection ES6RedundantAwait
    await expect(createService(undefined)).rejects.toThrow(
      'Invalid STOCK_PRICE_PROVIDER environment variable value: undefined',
    );
  });
});
