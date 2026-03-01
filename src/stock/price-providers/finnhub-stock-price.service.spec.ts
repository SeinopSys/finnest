import { Test, TestingModule } from '@nestjs/testing';
import {
  FinnhubStockPriceService,
  FinnhubQuoteResponse,
} from './finnhub-stock-price.service.js';
import { ApiClientService } from '../../api-client/api-client.service.js';
import { ApiHttpException } from '../../api-client/api-http-exception.class.js';
import { Mock } from 'vitest';

describe('FinnhubStockPriceService', () => {
  let service: FinnhubStockPriceService;
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
        FinnhubStockPriceService,
        {
          provide: ApiClientService,
          useValue: mockApiClientService,
        },
      ],
    }).compile();

    service = module.get<FinnhubStockPriceService>(FinnhubStockPriceService);
  });

  it('should return the current price (c) from the API response', async () => {
    const mockResponse: FinnhubQuoteResponse = {
      c: 150.5,
      d: 2.5,
      dp: 1.6,
      h: 151.0,
      l: 149.0,
      o: 149.5,
      pc: 148.0,
    };

    mockApiClient.request.mockResolvedValue({
      response: mockResponse,
      ok: true,
    });

    const price = await service.getStockPrice('AAPL');

    expect(price).toBe(150.5);
    expect(mockApiClient.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/quote',
        query: { symbol: 'AAPL' },
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

    // noinspection ES6RedundantAwait
    await expect(service.getStockPrice('INVALID')).rejects.toThrow(
      ApiHttpException,
    );
    // noinspection ES6RedundantAwait
    await expect(service.getStockPrice('INVALID')).rejects.toThrow(
      'API request failed with HTTP status 404 Not Found',
    );
  });

  it('should throw ApiHttpException if the API response is invalid JSON', async () => {
    mockApiClient.request.mockRejectedValue(
      new ApiHttpException('Failed to parse response as JSON', 500),
    );

    // noinspection ES6RedundantAwait
    await expect(service.getStockPrice('AAPL')).rejects.toThrow(
      ApiHttpException,
    );
    // noinspection ES6RedundantAwait
    await expect(service.getStockPrice('AAPL')).rejects.toThrow(
      'Failed to parse response as JSON',
    );
  });

  it('should throw ApiHttpException if the response validation fails', async () => {
    mockApiClient.request.mockRejectedValue(
      new ApiHttpException('Response validation failed', 500),
    );

    // noinspection ES6RedundantAwait
    await expect(service.getStockPrice('AAPL')).rejects.toThrow(
      ApiHttpException,
    );
    // noinspection ES6RedundantAwait
    await expect(service.getStockPrice('AAPL')).rejects.toThrow(
      'Response validation failed',
    );
  });

  describe('validateSymbol', () => {
    it('should return true if getStockPrice succeeds', async () => {
      mockApiClient.request.mockResolvedValue({
        response: { c: 150.5 },
        ok: true,
      });

      const result = await service.validateSymbol('AAPL');

      expect(result).toBe(true);
      expect(mockApiClient.request).toHaveBeenCalled();
    });

    it('should return false if getStockPrice fails', async () => {
      mockApiClient.request.mockRejectedValue(
        new ApiHttpException('Not Found', 404),
      );

      const result = await service.validateSymbol('INVALID');

      expect(result).toBe(false);
      expect(mockApiClient.request).toHaveBeenCalled();
    });
  });
});
