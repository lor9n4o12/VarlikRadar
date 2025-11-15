import { 
  type Asset, 
  type InsertAsset, 
  type Transaction, 
  type InsertTransaction,
  type PortfolioSummary,
  type AssetAllocation,
  type MonthlyPerformance,
  type AssetDetail,
  assets,
  transactions
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Asset operations
  getAssets(): Promise<Asset[]>;
  getAsset(id: string): Promise<Asset | undefined>;
  createAsset(asset: InsertAsset): Promise<Asset>;
  updateAsset(id: string, asset: Partial<InsertAsset>): Promise<Asset | undefined>;
  deleteAsset(id: string): Promise<boolean>;
  
  // Transaction operations
  getTransactions(): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  getTransactionsByAsset(assetId: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  deleteTransaction(id: string): Promise<boolean>;
  
  // Portfolio calculations
  getPortfolioSummary(): Promise<PortfolioSummary>;
  getAssetAllocation(): Promise<AssetAllocation[]>;
  getMonthlyPerformance(): Promise<MonthlyPerformance[]>;
  getAssetDetails(): Promise<AssetDetail[]>;
}

export class DatabaseStorage implements IStorage {
  // Asset operations
  async getAssets(): Promise<Asset[]> {
    return await db.select().from(assets);
  }

  async getAsset(id: string): Promise<Asset | undefined> {
    const [asset] = await db.select().from(assets).where(eq(assets.id, id));
    return asset || undefined;
  }

  async createAsset(insertAsset: InsertAsset): Promise<Asset> {
    const [asset] = await db
      .insert(assets)
      .values(insertAsset)
      .returning();
    return asset;
  }

  async updateAsset(id: string, updateData: Partial<InsertAsset>): Promise<Asset | undefined> {
    const [asset] = await db
      .update(assets)
      .set(updateData)
      .where(eq(assets.id, id))
      .returning();
    return asset || undefined;
  }

  async deleteAsset(id: string): Promise<boolean> {
    const result = await db.delete(assets).where(eq(assets.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Transaction operations
  async getTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions).orderBy(desc(transactions.date));
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction || undefined;
  }

  async getTransactionsByAsset(assetId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.assetId, assetId))
      .orderBy(desc(transactions.date));
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(insertTransaction)
      .returning();
    
    // Update asset's average price and quantity if it's a buy/sell transaction
    const asset = await this.getAsset(insertTransaction.assetId);
    if (asset) {
      const currentQuantity = parseFloat(asset.quantity);
      const transactionQuantity = parseFloat(insertTransaction.quantity);
      const transactionPrice = parseFloat(insertTransaction.price);
      
      if (insertTransaction.type === "alış") {
        // Calculate new average price for buy
        const currentValue = currentQuantity * parseFloat(asset.averagePrice);
        const newValue = transactionQuantity * transactionPrice;
        const newQuantity = currentQuantity + transactionQuantity;
        const newAveragePrice = newQuantity > 0 ? (currentValue + newValue) / newQuantity : 0;
        
        await this.updateAsset(insertTransaction.assetId, {
          quantity: newQuantity.toString(),
          averagePrice: newAveragePrice.toFixed(2),
        });
      } else if (insertTransaction.type === "satış") {
        // Reduce quantity for sell
        const newQuantity = currentQuantity - transactionQuantity;
        await this.updateAsset(insertTransaction.assetId, {
          quantity: Math.max(0, newQuantity).toString(),
        });
      }
    }
    
    return transaction;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    const result = await db.delete(transactions).where(eq(transactions.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Portfolio calculations
  async getPortfolioSummary(): Promise<PortfolioSummary> {
    const assets = await this.getAssets();
    
    let totalAssets = 0;
    assets.forEach((asset) => {
      const quantity = parseFloat(asset.quantity);
      const currentPrice = parseFloat(asset.currentPrice);
      totalAssets += quantity * currentPrice;
    });
    
    const totalDebt = 0; // Not implemented for now
    const netWorth = totalAssets - totalDebt;
    
    // Calculate monthly change (simplified - comparing to average price)
    let totalCost = 0;
    assets.forEach((asset) => {
      const quantity = parseFloat(asset.quantity);
      const averagePrice = parseFloat(asset.averagePrice);
      totalCost += quantity * averagePrice;
    });
    
    const monthlyChange = totalCost > 0 ? ((totalAssets - totalCost) / totalCost) * 100 : 0;
    const monthlyChangeAmount = totalAssets - totalCost;
    
    return {
      totalAssets,
      totalDebt,
      netWorth,
      monthlyChange,
      monthlyChangeAmount,
    };
  }

  async getAssetAllocation(): Promise<AssetAllocation[]> {
    const assets = await this.getAssets();
    
    // Group by asset type
    const allocationMap = new Map<string, { value: number; count: number }>();
    let total = 0;
    
    assets.forEach((asset) => {
      const quantity = parseFloat(asset.quantity);
      const currentPrice = parseFloat(asset.currentPrice);
      const value = quantity * currentPrice;
      total += value;
      
      const existing = allocationMap.get(asset.type) || { value: 0, count: 0 };
      allocationMap.set(asset.type, {
        value: existing.value + value,
        count: existing.count + 1,
      });
    });
    
    const typeNames: Record<string, string> = {
      hisse: "Hisse Senetleri",
      etf: "ETF'ler",
      kripto: "Kripto Paralar",
      gayrimenkul: "Gayrimenkul",
    };
    
    const colors: Record<string, string> = {
      hisse: "hsl(var(--chart-1))",
      etf: "hsl(var(--chart-2))",
      kripto: "hsl(var(--chart-4))",
      gayrimenkul: "hsl(var(--chart-5))",
    };
    
    return Array.from(allocationMap.entries()).map(([type, data]) => ({
      type: type as any,
      name: typeNames[type] || type,
      value: data.value,
      percentage: total > 0 ? (data.value / total) * 100 : 0,
      color: colors[type] || "hsl(var(--chart-1))",
    }));
  }

  async getMonthlyPerformance(): Promise<MonthlyPerformance[]> {
    const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    
    // Calculate portfolio value for each of the last 12 months based on transactions
    const performance: MonthlyPerformance[] = [];
    const transactions = await this.getTransactions();
    
    for (let i = 11; i >= 0; i--) {
      const targetDate = new Date(currentDate);
      targetDate.setMonth(currentDate.getMonth() - i);
      targetDate.setDate(1); // First day of the month
      const monthIndex = targetDate.getMonth();
      
      // Calculate portfolio value at that point in time
      const assetValuesAtDate = new Map<string, { quantity: number; averagePrice: number }>();
      
      // Process transactions up to this date
      const relevantTransactions = transactions.filter(t => 
        new Date(t.date) <= targetDate
      );
      
      relevantTransactions.forEach(transaction => {
        const existing = assetValuesAtDate.get(transaction.assetId) || { quantity: 0, averagePrice: 0 };
        const transactionQuantity = parseFloat(transaction.quantity);
        const transactionPrice = parseFloat(transaction.price);
        
        if (transaction.type === "alış") {
          const currentValue = existing.quantity * existing.averagePrice;
          const newValue = transactionQuantity * transactionPrice;
          const newQuantity = existing.quantity + transactionQuantity;
          const newAveragePrice = newQuantity > 0 ? (currentValue + newValue) / newQuantity : 0;
          
          assetValuesAtDate.set(transaction.assetId, {
            quantity: newQuantity,
            averagePrice: newAveragePrice,
          });
        } else if (transaction.type === "satış") {
          assetValuesAtDate.set(transaction.assetId, {
            quantity: Math.max(0, existing.quantity - transactionQuantity),
            averagePrice: existing.averagePrice,
          });
        }
      });
      
      // Calculate total value using current prices
      let totalValue = 0;
      const assets = await this.getAssets();
      assetValuesAtDate.forEach((value, assetId) => {
        const asset = assets.find(a => a.id === assetId);
        if (asset && value.quantity > 0) {
          totalValue += value.quantity * parseFloat(asset.currentPrice);
        }
      });
      
      performance.push({
        month: months[monthIndex],
        value: totalValue,
      });
    }
    
    return performance;
  }

  async getAssetDetails(): Promise<AssetDetail[]> {
    const assets = await this.getAssets();
    
    return assets.map((asset) => {
      const quantity = parseFloat(asset.quantity);
      const currentPrice = parseFloat(asset.currentPrice);
      const averagePrice = parseFloat(asset.averagePrice);
      
      const totalValue = quantity * currentPrice;
      const totalCost = quantity * averagePrice;
      const profit = totalValue - totalCost;
      const change = totalCost > 0 ? ((currentPrice - averagePrice) / averagePrice) * 100 : 0;
      const changeAmount = currentPrice - averagePrice;
      
      return {
        ...asset,
        totalValue,
        change,
        changeAmount,
        profit,
      };
    });
  }
}

export const storage = new DatabaseStorage();
