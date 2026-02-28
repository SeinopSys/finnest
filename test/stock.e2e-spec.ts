import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { MockStockPriceService } from '../src/stock/price-providers/mock-stock-price.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('StockController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await prisma.stock.deleteMany();
    // Reset mock data
    MockStockPriceService.mockData = {};
  });

  it('PUT /stock/:symbol should schedule price updates', async () => {
    const symbol = 'AAPL';
    const response = await request(app.getHttpServer())
      .put(`/stock/${symbol}`)
      .expect(200);

    // Assert response data types and properties
    /* eslint-disable @typescript-eslint/no-unsafe-member-access */
    expect(typeof response.body.message).toBe('string');
    expect(response.body.message).toContain('have been scheduled');
    expect(typeof response.body.alreadyRunning).toBe('boolean');
    expect(response.body.alreadyRunning).toBe(false);
    expect(typeof response.body.nextRun).toBe('string');
    expect(new Date(response.body.nextRun as string).getTime()).not.toBeNaN();
    /* eslint-enable @typescript-eslint/no-unsafe-member-access */
  });

  it('GET /stock/:symbol should return 404 if no data exists', async () => {
    const symbol = 'MSFT';
    const response = await request(app.getHttpServer())
      .get(`/stock/${symbol}`)
      .expect(404);

    // Assert response data types and properties for ApiHttpException
    /* eslint-disable @typescript-eslint/no-unsafe-member-access */
    expect(typeof response.body.message).toBe('string');
    expect(response.body.message).toBe('No price data found');
    expect(typeof response.body.statusCode).toBe('number');
    expect(response.body.statusCode).toBe(404);
    /* eslint-enable @typescript-eslint/no-unsafe-member-access */
  });

  it('GET /stock/:symbol should return stock data if it exists', async () => {
    const symbol = 'GOOGL';
    const price = 2800.5;

    // Seed database
    await prisma.stock.create({
      data: {
        ticker: symbol,
        price: price,
      },
    });

    const response = await request(app.getHttpServer())
      .get(`/stock/${symbol}`)
      .expect(200);

    // Assert response data types and properties for GetStockResponseEntity
    /* eslint-disable @typescript-eslint/no-unsafe-member-access */
    expect(typeof response.body.currentPrice).toBe('number');
    expect(response.body.currentPrice).toBe(price);
    expect(typeof response.body.movingAverage).toBe('number');
    expect(response.body.movingAverage).toBe(price);
    expect(typeof response.body.samples).toBe('number');
    expect(response.body.samples).toBe(1);
    expect(typeof response.body.lastUpdatedAt).toBe('string');
    expect(
      new Date(response.body.lastUpdatedAt as string).getTime(),
    ).not.toBeNaN();
    /* eslint-enable @typescript-eslint/no-unsafe-member-access */
  });

  it('DELETE /stock/:symbol should cancel price updates', async () => {
    const symbol = 'TSLA';

    // First schedule it
    await request(app.getHttpServer()).put(`/stock/${symbol}`).expect(200);

    // Then delete it
    const response = await request(app.getHttpServer())
      .delete(`/stock/${symbol}`)
      .expect(200);

    // Assert response data types and properties for DeleteStockResponseEntity
    /* eslint-disable @typescript-eslint/no-unsafe-member-access */
    expect(typeof response.body.message).toBe('string');
    expect(response.body.message).toContain('have been cancelled');
    expect(typeof response.body.cancelled).toBe('boolean');
    expect(response.body.cancelled).toBe(true);
    expect(
      response.body.lastRun === null ||
        typeof response.body.lastRun === 'string',
    ).toBe(true);
    if (response.body.lastRun !== null) {
      expect(new Date(response.body.lastRun as string).getTime()).not.toBeNaN();
    }
    /* eslint-enable @typescript-eslint/no-unsafe-member-access */
  });

  it('Full flow: schedule, wait for update (manual trigger), and get data', async () => {
    const symbol = 'AMZN';
    const price = 3300.75;
    MockStockPriceService.mockData = {
      [symbol]: [price],
    };

    // 1. Schedule updates
    const putResponse = await request(app.getHttpServer())
      .put(`/stock/${symbol}`)
      .expect(200);
    /* eslint-disable @typescript-eslint/no-unsafe-member-access */
    expect(typeof putResponse.body.message).toBe('string');
    expect(typeof putResponse.body.alreadyRunning).toBe('boolean');
    /* eslint-enable @typescript-eslint/no-unsafe-member-access */

    // 2. Since we can't easily wait for the cron job in a stable way in e2e without long waits,
    // we can manually trigger the private handlePriceUpdate if we want to test the full integration,
    // OR we can rely on the fact that PUT schedules it and we trust the unit tests for the cron.
    // However, the issue asks for "as many of the real module and service implementations as possible".

    // Let's try to trigger the service method directly to simulate the cron job execution
    const { StockService } = await import('../src/stock/stock.service.js');
    const stockService = app.get(StockService);
    // @ts-expect-error accessing private method for e2e simulation
    await stockService.handlePriceUpdate(symbol);

    // 3. Verify data is in DB via GET
    const getResponse = await request(app.getHttpServer())
      .get(`/stock/${symbol}`)
      .expect(200);

    /* eslint-disable @typescript-eslint/no-unsafe-member-access */
    expect(typeof getResponse.body.currentPrice).toBe('number');
    expect(getResponse.body.currentPrice).toBe(price);
    expect(typeof getResponse.body.samples).toBe('number');
    expect(getResponse.body.samples).toBe(1);
    expect(typeof getResponse.body.movingAverage).toBe('number');
    expect(typeof getResponse.body.lastUpdatedAt).toBe('string');
    /* eslint-enable @typescript-eslint/no-unsafe-member-access */

    // 4. Cancel
    const deleteResponse = await request(app.getHttpServer())
      .delete(`/stock/${symbol}`)
      .expect(200);
    /* eslint-disable @typescript-eslint/no-unsafe-member-access */
    expect(typeof deleteResponse.body.message).toBe('string');
    expect(typeof deleteResponse.body.cancelled).toBe('boolean');
    /* eslint-enable @typescript-eslint/no-unsafe-member-access */
  });
});
