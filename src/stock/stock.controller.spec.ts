import { Test, TestingModule } from '@nestjs/testing';
import { StockController } from './stock.controller.js';
import { StockDbalService } from './stock-dbal.service.js';

describe('StockController', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- will be used later
  let stockController: StockController;

  beforeEach(async () => {
    const stock: TestingModule = await Test.createTestingModule({
      controllers: [StockController],
      providers: [StockDbalService],
    }).compile();

    stockController = stock.get<StockController>(StockController);
  });

  describe('getCurrentStockPrice', () => {
    it.todo('should fetch the stock price');
  });

  describe('putCurrentStockPrice', () => {
    it.todo('should start the stock price fetching cron job');
  });
});
