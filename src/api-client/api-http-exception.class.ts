import { HttpException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Used for both throwing and OpenAPI typing
 */
export class ApiHttpException extends HttpException {
  @ApiProperty({
    description: 'HTTP status code',
  })
  public readonly statusCode: number;

  @ApiProperty({
    description: 'Error message',
  })
  public readonly message: string;

  constructor(message: string, status: number, cause?: unknown) {
    super(message, status, { cause });
    this.message = message;
    this.statusCode = status;
  }
}
