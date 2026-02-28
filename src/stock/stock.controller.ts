import { Controller, Get, HttpException, Put } from '@nestjs/common';
import { StockService } from './stock.service.js';

export interface GetStockResponse {
  price: number;
  lastUpdatedAt: string;
  movingAverage: number;
}
export interface PutStockResponse {
  message: string;
}

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get('{symbol}')
  async getStock(symbol: string): Promise<GetStockResponse> {
    const priceData = await this.stockService.getStockPriceData(symbol);
    if (!priceData) {
      throw new HttpException('No price data found', 404);
    }
    const movingAverage = await this.stockService.getMovingAverage(symbol);
    return {
      price: priceData.price,
      lastUpdatedAt: priceData.createdAt.toISOString(),
      movingAverage,
    };
  }

  @Put('{symbol}')
  putStock(symbol: string): PutStockResponse {
    const scheduled = this.stockService.schedulePriceUpdates(symbol);
    return {
      message: `Stock price updates ${scheduled ? 'have been scheduled' : 'are already scheduled'}`,
    };
  }
}
