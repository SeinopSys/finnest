import { Controller, Get, Param, Put } from '@nestjs/common';
import { StockDbalService } from './stock-dbal.service.js';

@Controller('stock')
export class StockController {
  constructor(protected stockDbal: StockDbalService) {}

  @Get(':symbol')
  async getCurrentStockPrice(@Param('symbol') symbol: string) {
    return this.stockDbal.stock({ ticker: symbol });
  }

  @Put(':symbol')
  async putCurrentStockPrice(@Param('symbol') symbol: string) {
    return this.stockDbal.createStock({ ticker: symbol, price: 0 });
  }
}
