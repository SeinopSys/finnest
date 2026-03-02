import { Injectable } from '@nestjs/common';
import { AlphaVantageStockPriceService } from './price-providers/alpha-vantage-stock-price.service.js';
import { FinnhubStockPriceService } from './price-providers/finnhub-stock-price.service.js';
import { MockStockPriceService } from './price-providers/mock-stock-price.service.js';
import type { StockPriceServiceInterface } from './price-providers/stock-price-service.interface.js';

@Injectable()
export class StockPriceService implements StockPriceServiceInterface {
  private provider: StockPriceServiceInterface;
  protected readonly providerEnvVar = 'STOCK_PRICE_PROVIDER';

  constructor(
    mockPriceProvider: MockStockPriceService,
    finnhubPriceProvider: FinnhubStockPriceService,
    alphaVantagePriceProvider: AlphaVantageStockPriceService,
  ) {
    const providerName = process.env[this.providerEnvVar];
    switch (providerName) {
      case 'mock':
        this.provider = mockPriceProvider;
        break;
      case 'finnhub':
        this.provider = finnhubPriceProvider;
        break;
      case 'alpha-vantage':
        this.provider = alphaVantagePriceProvider;
        break;
      default:
        throw new Error(
          `Invalid ${this.providerEnvVar} environment variable value: ${providerName}`,
        );
    }
  }

  async getStockPrice(symbol: string): Promise<number> {
    return this.provider.getStockPrice(symbol);
  }
}
