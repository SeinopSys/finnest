import { ApiProperty } from '@nestjs/swagger';

/**
 * Used for OpenAPI typing
 */
export class ApiMessageEntity {
  @ApiProperty({
    description: 'Human-readable status message',
  })
  public readonly message: string;

  constructor(message: string) {
    this.message = message;
  }
}
