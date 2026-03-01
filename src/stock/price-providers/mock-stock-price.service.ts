import { Injectable } from '@nestjs/common';
import { StockPriceServiceInterface } from './stock-price-service.interface.js';

/**
 * Mock Stock Price Provider (for unit testing purposes)
 *
 * Uses the static `mockData` property to return the next price in the array
 */
@Injectable()
export class MockStockPriceService implements StockPriceServiceInterface {
  /**
   * Mapping of symbols to prices that will be returned in
   * the same order as provided for each consecutive call.
   */
  public static mockData: Partial<Record<string, number[]>>;

  public validateSymbol(symbol: string): Promise<boolean> {
    return Promise.resolve(symbol in MockStockPriceService.mockData);
  }

  public getStockPrice(symbol: string): Promise<number> {
    if (
      !(symbol in MockStockPriceService.mockData) ||
      !Array.isArray(MockStockPriceService.mockData[symbol]) ||
      MockStockPriceService.mockData[symbol].length === 0
    ) {
      return Promise.reject(new Error('No mock data available'));
    }
    return Promise.resolve(
      MockStockPriceService.mockData[symbol].shift() as number,
    );
  }
}
