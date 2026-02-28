import { Test, TestingModule } from '@nestjs/testing';
import { StockDbalService } from './stock-dbal.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';

describe('StockDbalService', () => {
  let service: StockDbalService;

  const mockPrismaService = {
    stock: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockDbalService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<StockDbalService>(StockDbalService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should call findFirst with correct arguments', async () => {
    const where: Prisma.StockWhereInput = { ticker: 'AAPL' };
    const orderBy: Prisma.StockOrderByWithRelationInput = { createdAt: 'desc' };
    mockPrismaService.stock.findFirst.mockResolvedValue({
      id: 1,
      ticker: 'AAPL',
    });

    const result = await service.stock(where, orderBy);

    expect(result).toEqual({ id: 1, ticker: 'AAPL' });
    expect(mockPrismaService.stock.findFirst).toHaveBeenCalledWith({
      where,
      take: 1,
      orderBy,
    });
  });

  it('should call findMany with correct arguments', async () => {
    const params = {
      skip: 10,
      take: 20,
      where: { ticker: 'AAPL' },
    };
    mockPrismaService.stock.findMany.mockResolvedValue([
      { id: 1, ticker: 'AAPL' },
    ]);

    const result = await service.stocks(params);

    expect(result).toEqual([{ id: 1, ticker: 'AAPL' }]);
    expect(mockPrismaService.stock.findMany).toHaveBeenCalledWith(params);
  });

  it('should call create with correct arguments', async () => {
    const data: Prisma.StockCreateInput = {
      ticker: 'AAPL',
      price: new Prisma.Decimal(150.5),
    };
    mockPrismaService.stock.create.mockResolvedValue({ id: 1, ...data });

    const result = await service.createStock(data);

    expect(result).toEqual({ id: 1, ...data });
    expect(mockPrismaService.stock.create).toHaveBeenCalledWith({ data });
  });
});
