import { Module } from '@nestjs/common';
import { ApiClientModule } from '../api-client/api-client.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AlphaVantageStockPriceService } from './price-providers/alpha-vantage-stock-price.service.js';
import { FinnhubStockPriceService } from './price-providers/finnhub-stock-price.service.js';
import { MockStockPriceService } from './price-providers/mock-stock-price.service.js';
import { StockDbalService } from './stock-dbal.service.js';
import { StockPriceService } from './stock-price.service.js';
import { StockController } from './stock.controller.js';
import { StockService } from './stock.service.js';

@Module({
  imports: [PrismaModule, ApiClientModule],
  controllers: [StockController],
  providers: [
    StockService,
    StockDbalService,
    StockPriceService,
    FinnhubStockPriceService,
    AlphaVantageStockPriceService,
    MockStockPriceService,
  ],
  exports: [StockService],
})
export class StockModule {}
