import { Controller } from '@nestjs/common';
import { StockDbalService } from './stock-dbal.service.js';

@Controller()
export class StockController {
  constructor(private readonly stockDbal: StockDbalService) {}
}
