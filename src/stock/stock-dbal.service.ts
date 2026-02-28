import { Injectable } from '@nestjs/common';
import { Prisma, Stock } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * Stock Database Abstraction Layer Service
 */
@Injectable()
export class StockDbalService {
  constructor(private prisma: PrismaService) {}

  async stock(
    where?: Prisma.StockWhereInput,
    orderBy?: Prisma.StockOrderByWithRelationInput,
  ): Promise<Stock | null> {
    return this.prisma.stock.findFirst({
      where,
      take: 1,
      orderBy,
    });
  }

  async stocks(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.StockWhereUniqueInput;
    where?: Prisma.StockWhereInput;
    orderBy?: Prisma.StockOrderByWithRelationInput;
  }): Promise<Stock[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.stock.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createStock(data: Prisma.StockCreateInput): Promise<Stock> {
    return this.prisma.stock.create({
      data,
    });
  }
}
