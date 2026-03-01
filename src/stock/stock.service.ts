import { HttpException, Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { Stock } from '../generated/prisma/client.js';
import { StockDbalService } from './stock-dbal.service.js';
import { StockPriceService } from './stock-price.service.js';

export interface StockPriceData {
  price: number;
  createdAt: Date;
}

export interface ScheduledPriceUpdateResult {
  alreadyRunning: boolean;
  nextRun: Date;
}
export interface CancelPriceUpdatesResult {
  cancelled: boolean;
  lastRun: Date | null;
}
export interface StockPriceMovingAverageData {
  movingAverage: number;
  samples: number;
}

@Injectable()
export class StockService {
  private readonly logger = new Logger(StockService.name);

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly stockPrice: StockPriceService,
    private readonly stockDbal: StockDbalService,
  ) {}

  public async getStockPriceData(
    symbol: string,
  ): Promise<StockPriceData | null> {
    const stock = await this.stockDbal.stock(
      {
        ticker: symbol,
      },
      { createdAt: 'desc' },
    );
    if (stock === null) {
      return null;
    }
    return {
      price: stock.price.toNumber(),
      createdAt: stock.createdAt,
    };
  }

  public async schedulePriceUpdates(
    symbol: string,
  ): Promise<ScheduledPriceUpdateResult> {
    const isValidSymbol = await this.stockPrice.validateSymbol(symbol);
    if (!isValidSymbol) {
      this.logger.debug(
        `Attempt to schedule price update for invalid symbol ${symbol}`,
      );
      throw new HttpException(
        `Invalid symbol: ${symbol}. Please use a valid ticker symbol (e.g., AAPL).`,
        400,
      );
    }

    const name = this.getPriceUpdateJobName(symbol);
    const alreadyRunning = this.schedulerRegistry.doesExist('cron', name);
    let job: CronJob;
    if (alreadyRunning) {
      job = this.schedulerRegistry.getCronJob(name);
      this.logger.debug(`Job ${name} is already running`);
    } else {
      job = new CronJob(`0 * * * * *`, async () => {
        await this.handlePriceUpdate(symbol);
      });

      this.schedulerRegistry.addCronJob(name, job);
      job.start();

      this.logger.debug(`Job ${name} started`);
    }
    return {
      alreadyRunning,
      nextRun: job.nextDate().toJSDate(),
    };
  }

  public async cancelPriceUpdates(
    symbol: string,
  ): Promise<CancelPriceUpdatesResult> {
    const name = this.getPriceUpdateJobName(symbol);
    const job = this.getPriceUpdateJob(name);
    const cancelled = job !== null;
    if (cancelled) {
      await job.stop();
      this.schedulerRegistry.deleteCronJob(name);
      this.logger.debug(`Job ${name} stopped`);
    }
    return {
      cancelled,
      lastRun: job?.lastDate() ?? null,
    };
  }

  private getPriceUpdateJobName(symbol: string): string {
    return `price-update-${symbol}`;
  }

  private getPriceUpdateJob(name: string): CronJob | null {
    const alreadyRunning = this.schedulerRegistry.doesExist('cron', name);
    return alreadyRunning ? this.schedulerRegistry.getCronJob(name) : null;
  }

  public async getMovingAverageData(
    symbol: string,
    period = 10,
  ): Promise<StockPriceMovingAverageData> {
    const stocks = await this.stockDbal.stocks({
      where: {
        ticker: symbol,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: period,
    });

    if (stocks.length === 0) {
      return { movingAverage: 0, samples: 0 };
    }

    const pricesSum = stocks.reduce(
      (sum, stock) => sum + stock.price.toNumber(),
      0,
    );
    return {
      movingAverage: pricesSum / stocks.length,
      samples: stocks.length,
    };
  }

  private async handlePriceUpdate(symbol: string): Promise<Stock> {
    this.logger.debug(`Updating price for ${symbol}…`);
    const price = await this.stockPrice.getStockPrice(symbol);
    const stock = await this.stockDbal.createStock({
      ticker: symbol,
      price,
    });
    this.logger.debug(`Price for ${symbol} updated to ${price}`);
    return stock;
  }
}
