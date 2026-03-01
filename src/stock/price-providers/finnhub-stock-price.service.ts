import { Injectable } from '@nestjs/common';
import typia from 'typia';
import { ApiAuthType, ApiClient } from '../../api-client/api-client.class.js';
import { ApiClientService } from '../../api-client/api-client.service.js';
import { StockPriceServiceInterface } from './stock-price-service.interface.js';

/**
 * @see https://finnhub.io/docs/api/quote
 */
export interface FinnhubQuoteResponse {
  /**
   * Current price
   */
  c: number;
  /**
   * Change
   */
  d: number;
  /**
   * Percent change
   */
  dp: number;
  /**
   * High price of the day
   */
  h: number;
  /**
   * Low price of the day
   */
  l: number;
  /**
   * Open price of the day
   */
  o: number;
  /**
   * Previous close price
   */
  pc: number;
}

/**
 * Finnhub Stock Price Provider
 *
 * @see https://finnhub.io/docs/api
 */
@Injectable()
export class FinnhubStockPriceService implements StockPriceServiceInterface {
  private readonly baseUrl: string = 'https://finnhub.io/api/v1';
  protected readonly client: ApiClient;

  constructor(apiClientService: ApiClientService) {
    this.client = apiClientService.createApiClient({
      baseUrl: this.baseUrl,
      authentication: {
        type: ApiAuthType.QUERY_PARAM,
        paramName: 'token',
        paramValueEnvKey: 'FINNHUB_TOKEN',
      },
    });
  }

  public async validateSymbol(symbol: string): Promise<boolean> {
    try {
      await this.getStockPrice(symbol);
      return true;
    } catch {
      return false;
    }
  }

  public async getStockPrice(symbol: string): Promise<number> {
    const response = await this.client.request({
      path: '/quote',
      query: { symbol },
      validator: typia.createValidate<FinnhubQuoteResponse>(),
    });
    return response.response.c;
  }
}
