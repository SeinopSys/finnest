import { Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Stock } from '../generated/prisma/client.js';
import { StockPriceServiceInterface } from './price-providers/stock-price-service.interface.js';
import { StockDbalService } from './stock-dbal.service.js';
import { StockPriceService } from './stock-price.service.js';
import { CronJob } from 'cron';

@Injectable()
export class StockService implements StockPriceServiceInterface {
  private readonly logger = new Logger(StockService.name);

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly stockPrice: StockPriceService,
    private readonly stockDbal: StockDbalService,
  ) {}

  public getStockPrice(symbol: string): Promise<number> {
    return this.stockPrice.getStockPrice(symbol);
  }

  public schedulePriceUpdates(symbol: string): boolean {
    const name = `price-update-${symbol}`;
    if (this.schedulerRegistry.doesExist('cron', name)) {
      this.logger.debug(`Job ${name} is already running`);
      return false;
    }

    const job = new CronJob(`0 * * * *`, async () => {
      await this.handlePriceUpdate(symbol);
    });

    this.schedulerRegistry.addCronJob(name, job);
    job.start();

    this.logger.debug(`Job ${name} started`);
    return true;
  }

  private async handlePriceUpdate(symbol: string): Promise<Stock> {
    const price = await this.getStockPrice(symbol);
    return await this.stockDbal.createStock({
      ticker: symbol,
      price,
    });
  }
}
