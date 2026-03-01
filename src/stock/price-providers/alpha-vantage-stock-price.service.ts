import { Injectable } from '@nestjs/common';
import typia from 'typia';
import { ApiAuthType, ApiClient } from '../../api-client/api-client.class.js';
import { ApiClientService } from '../../api-client/api-client.service.js';
import { StockPriceServiceInterface } from './stock-price-service.interface.js';

export interface AlphaVantageGlobalQuoteResponse {
  'Global Quote': {
    '01. symbol': string;
    /**
     * @format float
     */
    '02. open': string;
    /**
     * @format float
     */
    '03. high': string;
    /**
     * @format float
     */
    '04. low': string;
    /**
     * @format float
     */
    '05. price': string;
    /**
     * @format float
     */
    '06. volume': string;
    /**
     * @format date
     */
    '07. latest trading day': string;
    /**
     * @format float
     */
    '08. previous close': '242.0100';
    /**
     * @format float
     */
    '09. change': '-1.8000';
    /**
     * @format percentage
     */
    '10. change percent': '-0.7438%';
  };
}

/**
 * Alpha Vantage Stock Price Provider
 *
 * Note: by default, the quote endpoint is updated at the end of each trading day for all users
 * Realtime or 15-minute delayed stock quote data for the US market requires a premium membership.
 *
 * @see https://www.alphavantage.co/documentation/
 */
@Injectable()
export class AlphaVantageStockPriceService implements StockPriceServiceInterface {
  private readonly baseUrl: string = 'https://www.alphavantage.co';
  protected readonly client: ApiClient;

  constructor(apiClientService: ApiClientService) {
    this.client = apiClientService.createApiClient({
      baseUrl: this.baseUrl,
      authentication: {
        type: ApiAuthType.QUERY_PARAM,
        paramName: 'apikey',
        paramValueEnvKey: 'ALPHA_VANTAGE_API_KEY',
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
      path: '/query',
      query: { symbol, function: 'GLOBAL_QUOTE' },
      validator: typia.createValidate<AlphaVantageGlobalQuoteResponse>(),
    });
    return parseFloat(response.response['Global Quote']['05. price']);
  }
}
