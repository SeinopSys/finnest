import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller.js';
import { StockModule } from './stock/stock.module.js';

@Module({
  imports: [StockModule, ScheduleModule.forRoot()],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
