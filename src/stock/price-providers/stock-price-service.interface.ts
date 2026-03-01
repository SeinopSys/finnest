export interface StockPriceServiceInterface {
  validateSymbol(symbol: string): Promise<boolean>;

  getStockPrice(symbol: string): Promise<number>;
}
