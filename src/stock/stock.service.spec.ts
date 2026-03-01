import { Test, TestingModule } from '@nestjs/testing';
import { SchedulerRegistry } from '@nestjs/schedule';
import { StockService } from './stock.service.js';
import { StockDbalService } from './stock-dbal.service.js';
import { StockPriceService } from './stock-price.service.js';
import { MockStockPriceService } from './price-providers/mock-stock-price.service.js';
import { CronJob } from 'cron';
import { Prisma } from '../generated/prisma/client.js';

describe('StockService', () => {
  let service: StockService;

  const mockStockDbal = {
    stock: vi.fn(),
    stocks: vi.fn(),
    createStock: vi.fn(),
  };

  const mockSchedulerRegistry = {
    doesExist: vi.fn(),
    getCronJob: vi.fn(),
    addCronJob: vi.fn(),
    deleteCronJob: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        {
          provide: SchedulerRegistry,
          useValue: mockSchedulerRegistry,
        },
        {
          provide: StockDbalService,
          useValue: mockStockDbal,
        },
        {
          provide: StockPriceService,
          useClass: MockStockPriceService,
        },
      ],
    }).compile();

    service = module.get<StockService>(StockService);

    // Clear mock data before each test
    MockStockPriceService.mockData = {};
    vi.clearAllMocks();
  });

  describe('getStockPriceData', () => {
    it('should return stock price data if stock exists', async () => {
      const mockStock = {
        ticker: 'AAPL',
        price: new Prisma.Decimal(150.5),
        createdAt: new Date(),
      };
      mockStockDbal.stock.mockResolvedValue(mockStock);

      const result = await service.getStockPriceData('AAPL');

      expect(result).toEqual({
        price: 150.5,
        createdAt: mockStock.createdAt,
      });
      expect(mockStockDbal.stock).toHaveBeenCalledWith(
        { ticker: 'AAPL' },
        { createdAt: 'desc' },
      );
    });

    it('should return null if stock does not exist', async () => {
      mockStockDbal.stock.mockResolvedValue(null);

      const result = await service.getStockPriceData('INVALID');

      expect(result).toBeNull();
    });
  });

  describe('schedulePriceUpdates', () => {
    it('should create and start a new cron job if it does not exist', async () => {
      const symbol = 'AAPL';
      const jobName = `price-update-${symbol}`;
      MockStockPriceService.mockData = { [symbol]: [150] };
      mockSchedulerRegistry.doesExist.mockReturnValue(false);

      const result = await service.schedulePriceUpdates(symbol);

      expect(mockSchedulerRegistry.doesExist).toHaveBeenCalledWith(
        'cron',
        jobName,
      );
      expect(mockSchedulerRegistry.addCronJob).toHaveBeenCalledWith(
        jobName,
        expect.any(CronJob),
      );
      expect(result.alreadyRunning).toBe(false);
      expect(result.nextRun).toBeInstanceOf(Date);
    });

    it('should return existing job info if it already exists', async () => {
      const symbol = 'AAPL';
      const jobName = `price-update-${symbol}`;
      MockStockPriceService.mockData = { [symbol]: [150] };
      const mockJob = new CronJob('* * * * *', () => {});
      mockSchedulerRegistry.doesExist.mockReturnValue(true);
      mockSchedulerRegistry.getCronJob.mockReturnValue(mockJob);

      const result = await service.schedulePriceUpdates(symbol);

      expect(mockSchedulerRegistry.doesExist).toHaveBeenCalledWith(
        'cron',
        jobName,
      );
      expect(mockSchedulerRegistry.getCronJob).toHaveBeenCalledWith(jobName);
      expect(result.alreadyRunning).toBe(true);
      expect(result.nextRun).toEqual(mockJob.nextDate().toJSDate());
    });
  });

  describe('cancelPriceUpdates', () => {
    it('should stop and delete the cron job if it exists', async () => {
      const symbol = 'AAPL';
      const jobName = `price-update-${symbol}`;
      const mockJob = {
        stop: vi.fn().mockResolvedValue(undefined),
        lastDate: vi.fn().mockReturnValue(new Date()),
      };
      mockSchedulerRegistry.doesExist.mockReturnValue(true);
      mockSchedulerRegistry.getCronJob.mockReturnValue(mockJob);

      const result = await service.cancelPriceUpdates(symbol);

      expect(mockSchedulerRegistry.doesExist).toHaveBeenCalledWith(
        'cron',
        jobName,
      );
      expect(mockJob.stop).toHaveBeenCalled();
      expect(mockSchedulerRegistry.deleteCronJob).toHaveBeenCalledWith(jobName);
      expect(result.cancelled).toBe(true);
      expect(result.lastRun).toEqual(mockJob.lastDate());
    });

    it('should return cancelled: false if job does not exist', async () => {
      const symbol = 'AAPL';
      mockSchedulerRegistry.doesExist.mockReturnValue(false);

      const result = await service.cancelPriceUpdates(symbol);

      expect(result.cancelled).toBe(false);
      expect(result.lastRun).toBeNull();
    });
  });

  describe('handlePriceUpdate (private, but triggered by cron)', () => {
    it('should update the stock price using MockStockPriceService', async () => {
      const symbol = 'AAPL';
      const price = 155.5;
      MockStockPriceService.mockData = {
        [symbol]: [price],
      };

      const mockCreatedStock = {
        ticker: symbol,
        price: new Prisma.Decimal(price),
      };
      mockStockDbal.createStock.mockResolvedValue(mockCreatedStock);

      // Access private method for testing purposes
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const result = await (service as any).handlePriceUpdate(symbol);

      expect(result).toEqual(mockCreatedStock);
      expect(mockStockDbal.createStock).toHaveBeenCalledWith({
        ticker: symbol,
        price,
      });
      expect(MockStockPriceService.mockData[symbol]).toHaveLength(0);
    });
  });

  describe('getMovingAverageData', () => {
    it('should return moving average and samples when data exists', async () => {
      const symbol = 'AAPL';
      const period = 3;
      const mockStocks = [
        { price: new Prisma.Decimal(100) },
        { price: new Prisma.Decimal(200) },
        { price: new Prisma.Decimal(300) },
      ];
      mockStockDbal.stocks.mockResolvedValue(mockStocks);

      const result = await service.getMovingAverageData(symbol, period);

      expect(result).toEqual({
        movingAverage: 200,
        samples: 3,
      });
      expect(mockStockDbal.stocks).toHaveBeenCalledWith({
        where: { ticker: symbol },
        orderBy: { createdAt: 'desc' },
        take: period,
      });
    });

    it('should return zero values when no data exists', async () => {
      const symbol = 'AAPL';
      mockStockDbal.stocks.mockResolvedValue([]);

      const result = await service.getMovingAverageData(symbol);

      expect(result).toEqual({
        movingAverage: 0,
        samples: 0,
      });
    });

    it('should use default period of 10 if not provided', async () => {
      const symbol = 'AAPL';
      mockStockDbal.stocks.mockResolvedValue([]);

      await service.getMovingAverageData(symbol);

      expect(mockStockDbal.stocks).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        }),
      );
    });
  });
});
