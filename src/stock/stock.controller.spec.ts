import { Test, TestingModule } from '@nestjs/testing';
import { StockController } from './stock.controller.js';
import { StockService } from './stock.service.js';

describe('StockController', () => {
  let stockController: StockController;
  let stockService: StockService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StockController],
      providers: [
        {
          provide: StockService,
          useValue: {
            getStockPriceData: vi.fn(),
            getMovingAverageData: vi.fn(),
            schedulePriceUpdates: vi.fn(),
            cancelPriceUpdates: vi.fn(),
          },
        },
      ],
    }).compile();

    stockController = module.get<StockController>(StockController);
    stockService = module.get<StockService>(StockService);
  });

  describe('getCurrentStockPrice', () => {
    it('should return stock price data if found', async () => {
      const mockPriceData = { price: 150.0, createdAt: new Date() };
      const mockMovingAverageData = { movingAverage: 145.0, samples: 10 };
      vi.spyOn(stockService, 'getStockPriceData').mockResolvedValue(
        mockPriceData,
      );
      vi.spyOn(stockService, 'getMovingAverageData').mockResolvedValue(
        mockMovingAverageData,
      );

      const result = await stockController.getStock('AAPL');

      expect(result.currentPrice).toBe(mockPriceData.price);
      expect(result.lastUpdatedAt).toBe(mockPriceData.createdAt.toISOString());
      expect(result.movingAverage).toBe(mockMovingAverageData.movingAverage);
      expect(result.samples).toBe(mockMovingAverageData.samples);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(stockService.getStockPriceData).toHaveBeenCalledWith('AAPL');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(stockService.getMovingAverageData).toHaveBeenCalledWith('AAPL');
    });

    it('should throw ApiHttpException if stock price data is not found', async () => {
      vi.spyOn(stockService, 'getStockPriceData').mockResolvedValue(null);

      // noinspection ES6RedundantAwait
      await expect(stockController.getStock('INVALID')).rejects.toThrow(
        'No price data found',
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(stockService.getStockPriceData).toHaveBeenCalledWith('INVALID');
    });
  });

  describe('putCurrentStockPrice', () => {
    it('should schedule stock price updates and return the result', () => {
      const mockResult = {
        alreadyRunning: false,
        nextRun: new Date(),
      };
      vi.spyOn(stockService, 'schedulePriceUpdates').mockReturnValue(
        mockResult,
      );

      const result = stockController.putStock('AAPL');

      expect(result.alreadyRunning).toBe(mockResult.alreadyRunning);
      expect(result.nextRun).toBe(mockResult.nextRun.toISOString());
      expect(result.message).toContain('have been scheduled');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(stockService.schedulePriceUpdates).toHaveBeenCalledWith('AAPL');
    });

    it('should indicate if stock price updates are already running', () => {
      const mockResult = {
        alreadyRunning: true,
        nextRun: new Date(),
      };
      vi.spyOn(stockService, 'schedulePriceUpdates').mockReturnValue(
        mockResult,
      );

      const result = stockController.putStock('AAPL');

      expect(result.alreadyRunning).toBe(mockResult.alreadyRunning);
      expect(result.message).toContain('are already scheduled');
    });
  });

  describe('deleteStock', () => {
    it('should cancel stock price updates and return the result', async () => {
      const mockResult = {
        cancelled: true,
        lastRun: new Date(),
      };
      vi.spyOn(stockService, 'cancelPriceUpdates').mockResolvedValue(
        mockResult,
      );

      const result = await stockController.deleteStock('AAPL');

      expect(result.cancelled).toBe(mockResult.cancelled);
      expect(result.lastRun).toBe(mockResult.lastRun.toISOString());
      expect(result.message).toContain('have been cancelled');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(stockService.cancelPriceUpdates).toHaveBeenCalledWith('AAPL');
    });

    it('should indicate if stock price updates are not running', async () => {
      const mockResult = {
        cancelled: false,
        lastRun: null,
      };
      vi.spyOn(stockService, 'cancelPriceUpdates').mockResolvedValue(
        mockResult,
      );

      const result = await stockController.deleteStock('AAPL');

      expect(result.cancelled).toBe(mockResult.cancelled);
      expect(result.message).toContain('are not currently scheduled');
    });
  });

  describe('Global 500 handling', () => {
    it('should let service exceptions bubble up', async () => {
      vi.spyOn(stockService, 'getStockPriceData').mockRejectedValue(
        new Error('Database error'),
      );

      // noinspection ES6RedundantAwait
      await expect(stockController.getStock('AAPL')).rejects.toThrow(
        'Database error',
      );
    });
  });
});
