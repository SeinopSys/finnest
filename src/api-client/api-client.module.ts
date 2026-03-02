import { Module } from '@nestjs/common';
import { ApiClientService } from './api-client.service.js';

@Module({
  providers: [ApiClientService],
  exports: [ApiClientService],
})
export class ApiClientModule {}
