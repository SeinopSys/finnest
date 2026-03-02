export interface StockPriceServiceInterface {
  getStockPrice(symbol: string): Promise<number>;
}
