import { Test, TestingModule } from '@nestjs/testing';
import {
  AlphaVantageStockPriceService,
  AlphaVantageGlobalQuoteResponse,
} from './alpha-vantage-stock-price.service.js';
import { ApiClientService } from '../../api-client/api-client.service.js';
import { ApiHttpException } from '../../api-client/api-http-exception.class.js';
import { Mock } from 'vitest';

describe('AlphaVantageStockPriceService', () => {
  let service: AlphaVantageStockPriceService;
  let mockApiClient: { request: Mock };

  beforeEach(async () => {
    mockApiClient = {
      request: vi.fn(),
    };

    const mockApiClientService = {
      createApiClient: vi.fn().mockReturnValue(mockApiClient),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlphaVantageStockPriceService,
        {
          provide: ApiClientService,
          useValue: mockApiClientService,
        },
      ],
    }).compile();

    service = module.get<AlphaVantageStockPriceService>(
      AlphaVantageStockPriceService,
    );
  });

  it('should return the current price from the API response', async () => {
    const mockResponse: AlphaVantageGlobalQuoteResponse = {
      'Global Quote': {
        '01. symbol': 'AAPL',
        '02. open': '150.00',
        '03. high': '152.00',
        '04. low': '149.00',
        '05. price': '151.50',
        '06. volume': '1000000',
        '07. latest trading day': '2023-10-27',
        '08. previous close': '242.0100', // Matches the weird type in interface if strictly enforced
        '09. change': '-1.8000',
        '10. change percent': '-0.7438%',
      },
    };

    mockApiClient.request.mockResolvedValue({
      response: mockResponse,
      ok: true,
    });

    const price = await service.getStockPrice('AAPL');

    expect(price).toBe(151.5);
    expect(mockApiClient.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/query',
        query: { symbol: 'AAPL', function: 'GLOBAL_QUOTE' },
      }),
    );
  });

  it('should throw ApiHttpException if the API returns a non-200 status code', async () => {
    mockApiClient.request.mockRejectedValue(
      new ApiHttpException(
        'API request failed with HTTP status 404 Not Found',
        500,
      ),
    );

    await expect(service.getStockPrice('INVALID')).rejects.toThrow(
      ApiHttpException,
    );
  });

  it('should throw ApiHttpException if the API response is invalid JSON', async () => {
    mockApiClient.request.mockRejectedValue(
      new ApiHttpException('Failed to parse response as JSON', 500),
    );

    await expect(service.getStockPrice('AAPL')).rejects.toThrow(
      ApiHttpException,
    );
  });

  it('should throw ApiHttpException if the response validation fails', async () => {
    mockApiClient.request.mockRejectedValue(
      new ApiHttpException('Response validation failed', 500),
    );

    await expect(service.getStockPrice('AAPL')).rejects.toThrow(
      ApiHttpException,
    );
  });
});
