import { ApiProperty } from '@nestjs/swagger';

export class GetStockResponseEntity {
  @ApiProperty({
    description: 'Current stock price in US dollars',
    example: 123.45,
  })
  public readonly currentPrice: number;

  @ApiProperty({
    description: 'Timestamp of when the data was last updated (ISO 8601)',
    format: 'date-time',
    example: '2026-02-28T12:34:01.234Z',
  })
  public readonly lastUpdatedAt: string;

  @ApiProperty({
    description:
      'Moving average of the last *N* prices for this symbol (where *N* is the value of the `samples` property)',
    format: 'float',
  })
  public readonly movingAverage: number;

  @ApiProperty({
    description: 'Indicates how many samples the moving average was based on',
    format: 'int32',
  })
  public readonly samples: number;

  constructor(
    currentPrice: number,
    lastUpdatedAt: string,
    movingAverage: number,
    samples: number,
  ) {
    this.currentPrice = currentPrice;
    this.lastUpdatedAt = lastUpdatedAt;
    this.movingAverage = movingAverage;
    this.samples = samples;
  }
}
