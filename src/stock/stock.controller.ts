import { Controller, Delete, Get, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ApiHttpException } from '../api-client/api-http-exception.class.js';
import { DeleteStockResponseEntity } from './entities/delete-stock-response.entity.js';
import { GetStockResponseEntity } from './entities/get-stock-response.entity.js';
import { PutStockResponseEntity } from './entities/put-stock-response.entity.js';
import { StockService } from './stock.service.js';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get(':symbol')
  @ApiParam({
    name: 'symbol',
    required: true,
    description: 'Stock symbol',
    example: 'AAPL',
  })
  @ApiOperation({ summary: 'Get stock pricing information' })
  @ApiResponse({
    status: 200,
    description: 'The pricing information for the requested symbol',
    type: GetStockResponseEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'Stock information is missing from the database',
    type: ApiHttpException,
  })
  @ApiResponse({
    status: 500,
    description: 'Server error',
    type: ApiHttpException,
  })
  async getStock(
    @Param('symbol')
    symbol: string,
  ): Promise<GetStockResponseEntity> {
    const priceData = await this.stockService.getStockPriceData(symbol);
    if (!priceData) {
      throw new ApiHttpException('No price data found', 404);
    }
    const movingAverageData =
      await this.stockService.getMovingAverageData(symbol);
    return new GetStockResponseEntity(
      priceData.price,
      priceData.createdAt.toISOString(),
      movingAverageData.movingAverage,
      movingAverageData.samples,
    );
  }

  @Put(':symbol')
  @ApiParam({
    name: 'symbol',
    required: true,
    description: 'Stock symbol',
    example: 'AAPL',
  })
  @ApiOperation({ summary: 'Start the price storage background job' })
  @ApiResponse({
    status: 200,
    description: 'The background job was scheduled (or is already running)',
    type: PutStockResponseEntity,
  })
  @ApiResponse({
    status: 500,
    description: 'Server error',
    type: ApiHttpException,
  })
  putStock(@Param('symbol') symbol: string): PutStockResponseEntity {
    const result = this.stockService.schedulePriceUpdates(symbol);
    return new PutStockResponseEntity(
      `Stock price updates ${result.alreadyRunning ? 'are already scheduled' : 'have been scheduled'}, next execution: ${result.nextRun.toLocaleString()}`,
      result.alreadyRunning,
      result.nextRun,
    );
  }

  @Delete(':symbol')
  @ApiParam({
    name: 'symbol',
    required: true,
    description: 'Stock symbol',
    example: 'AAPL',
  })
  @ApiResponse({
    status: 200,
    description: 'The background job was cancelled (or is not running)',
    type: DeleteStockResponseEntity,
  })
  @ApiResponse({
    status: 500,
    description: 'Server error',
    type: ApiHttpException,
  })
  async deleteStock(
    @Param('symbol') symbol: string,
  ): Promise<DeleteStockResponseEntity> {
    const result = await this.stockService.cancelPriceUpdates(symbol);
    return new DeleteStockResponseEntity(
      `Stock price updates ${result.cancelled ? 'have been cancelled' : 'are not currently scheduled'}`,
      result.cancelled,
      result.lastRun,
    );
  }
}
