import { ApiProperty } from '@nestjs/swagger';
import { ApiMessageEntity } from '../../api-client/api-message-entity.class.js';

export class DeleteStockResponseEntity extends ApiMessageEntity {
  @ApiProperty({
    description: 'Indicates whether the job was cancelled',
    example: false,
  })
  public readonly cancelled: boolean;

  @ApiProperty({
    description:
      'Last run time (ISO 8601) if the job was cancelled, otherwise null',
    format: 'date-time',
    example: '2026-02-28T12:34:00.000Z',
  })
  public readonly lastRun: string | null;

  constructor(message: string, cancelled: boolean, lastRun: Date | null) {
    super(message);
    this.cancelled = cancelled;
    this.lastRun = lastRun?.toISOString() ?? null;
  }
}
