import { Test, TestingModule } from '@nestjs/testing';
import { StockController } from './stock.controller.js';
import { StockDbalService } from './stock-dbal.service.js';

describe('StockController', () => {
  let stockController: StockController;

  beforeEach(async () => {
    const mockStockDbalService = {
      stock: vi.fn(),
      createStock: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StockController],
      providers: [
        {
          provide: StockDbalService,
          useValue: mockStockDbalService,
        },
      ],
    }).compile();

    stockController = module.get<StockController>(StockController);
  });

  describe('getCurrentStockPrice', () => {
    it('should fetch the stock price', async () => {
      const mockStock = { ticker: 'AAPL', price: 150.5 };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      const dbal = (stockController as any).stockDbal;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      vi.mocked(dbal.stock).mockResolvedValue(mockStock);

      const result = await stockController.getCurrentStockPrice('AAPL');
      expect(result).toEqual(mockStock);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(dbal.stock).toHaveBeenCalledWith({ ticker: 'AAPL' });
    });
  });

  describe('putCurrentStockPrice', () => {
    it('should call stockDbal.createStock', async () => {
      const mockStock = { ticker: 'AAPL', price: 0 };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      const dbal = (stockController as any).stockDbal;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      vi.mocked(dbal.createStock).mockResolvedValue(mockStock);

      const result = await stockController.putCurrentStockPrice('AAPL');
      expect(result).toEqual(mockStock);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(dbal.createStock).toHaveBeenCalledWith({
        ticker: 'AAPL',
        price: 0,
      });
    });
  });
});
