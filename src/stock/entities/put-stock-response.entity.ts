import { ApiProperty } from '@nestjs/swagger';
import { ApiMessageEntity } from '../../api-client/api-message-entity.class.js';

export class PutStockResponseEntity extends ApiMessageEntity {
  @ApiProperty({
    description: 'Indicates whether the job is already running',
    example: false,
  })
  public readonly alreadyRunning: boolean;

  @ApiProperty({
    description: 'Next scheduled run time (ISO 8601)',
    format: 'date-time',
    example: '2026-02-28T12:34:00.000Z',
  })
  public readonly nextRun: string;

  constructor(message: string, alreadyRunning: boolean, nextRun: Date) {
    super(message);
    this.alreadyRunning = alreadyRunning;
    this.nextRun = nextRun.toISOString();
  }
}
