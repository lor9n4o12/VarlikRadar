import { 
  type Asset, 
  type InsertAsset, 
  type Transaction, 
  type InsertTransaction,
  type PortfolioSummary,
  type AssetAllocation,
  type MonthlyPerformance,
  type AssetDetail,
  type Income,
  type InsertIncome,
  type Expense,
  type InsertExpense,
  type BudgetSummary,
  assets,
  transactions,
  incomes,
  expenses
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, gte, lte, and } from "drizzle-orm";

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
  
  // Income operations
  getIncomes(): Promise<Income[]>;
  getIncome(id: string): Promise<Income | undefined>;
  createIncome(income: InsertIncome): Promise<Income>;
  deleteIncome(id: string): Promise<boolean>;
  
  // Expense operations
  getExpenses(): Promise<Expense[]>;
  getExpense(id: string): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  deleteExpense(id: string): Promise<boolean>;
  
  // Budget calculations
  getBudgetSummary(startDate?: Date, endDate?: Date): Promise<BudgetSummary>;
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
      // Safely coerce decimal strings to numbers with defaults
      const currentQuantity = Number(asset.quantity) || 0;
      const currentAveragePrice = Number(asset.averagePrice) || 0;
      const transactionQuantity = Number(insertTransaction.quantity) || 0;
      const transactionPrice = Number(insertTransaction.price) || 0;
      
      if (insertTransaction.type === "alış") {
        // Calculate new average price for buy
        const currentValue = currentQuantity * currentAveragePrice;
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
    
    // Calculate total investment assets value
    let investmentAssets = 0;
    assets.forEach((asset) => {
      const quantity = Number(asset.quantity) || 0;
      const currentPrice = Number(asset.currentPrice) || 0;
      investmentAssets += quantity * currentPrice;
    });
    
    // Get budget summary (income - expenses = cash balance)
    const budgetSummary = await this.getBudgetSummary();
    const cashBalance = budgetSummary.balance; // income - expenses
    
    // Total assets = investment assets + cash balance (if positive)
    const totalAssets = investmentAssets + Math.max(0, cashBalance);
    
    // Total debt = negative cash balance (if expenses > income)
    const totalDebt = cashBalance < 0 ? Math.abs(cashBalance) : 0;
    
    // Net worth = total assets - total debt
    const netWorth = totalAssets - totalDebt;
    
    // Calculate monthly change (simplified - comparing to average price)
    let totalCost = 0;
    assets.forEach((asset) => {
      const quantity = Number(asset.quantity) || 0;
      const averagePrice = Number(asset.averagePrice) || 0;
      totalCost += quantity * averagePrice;
    });
    
    const totalValue = investmentAssets + cashBalance;
    const monthlyChange = totalCost > 0 ? ((investmentAssets - totalCost) / totalCost) * 100 : 0;
    const monthlyChangeAmount = investmentAssets - totalCost;
    
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
      const quantity = Number(asset.quantity) || 0;
      const currentPrice = Number(asset.currentPrice) || 0;
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
        const transactionQuantity = Number(transaction.quantity) || 0;
        const transactionPrice = Number(transaction.price) || 0;
        
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
          totalValue += value.quantity * (Number(asset.currentPrice) || 0);
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
      const quantity = Number(asset.quantity) || 0;
      const currentPrice = Number(asset.currentPrice) || 0;
      const averagePrice = Number(asset.averagePrice) || 0;
      
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

  // Income operations
  async getIncomes(): Promise<Income[]> {
    return await db.select().from(incomes).orderBy(desc(incomes.date));
  }

  async getIncome(id: string): Promise<Income | undefined> {
    const [income] = await db.select().from(incomes).where(eq(incomes.id, id));
    return income || undefined;
  }

  async createIncome(insertIncome: InsertIncome): Promise<Income> {
    const [income] = await db
      .insert(incomes)
      .values(insertIncome)
      .returning();
    return income;
  }

  async deleteIncome(id: string): Promise<boolean> {
    const result = await db.delete(incomes).where(eq(incomes.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Expense operations
  async getExpenses(): Promise<Expense[]> {
    return await db.select().from(expenses).orderBy(desc(expenses.date));
  }

  async getExpense(id: string): Promise<Expense | undefined> {
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
    return expense || undefined;
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const [expense] = await db
      .insert(expenses)
      .values(insertExpense)
      .returning();
    return expense;
  }

  async deleteExpense(id: string): Promise<boolean> {
    const result = await db.delete(expenses).where(eq(expenses.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Budget calculations
  async getBudgetSummary(startDate?: Date, endDate?: Date): Promise<BudgetSummary> {
    let allIncomes = await this.getIncomes();
    let allExpenses = await this.getExpenses();
    
    // Filter by date range if provided
    if (startDate) {
      allIncomes = allIncomes.filter(i => new Date(i.date) >= startDate);
      allExpenses = allExpenses.filter(e => new Date(e.date) >= startDate);
    }
    if (endDate) {
      allIncomes = allIncomes.filter(i => new Date(i.date) <= endDate);
      allExpenses = allExpenses.filter(e => new Date(e.date) <= endDate);
    }
    
    // Calculate totals
    const totalIncome = allIncomes.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    const totalExpense = allExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const balance = totalIncome - totalExpense;
    
    // Group by category
    const incomeByCategory = new Map<string, number>();
    allIncomes.forEach(i => {
      const current = incomeByCategory.get(i.category) || 0;
      incomeByCategory.set(i.category, current + (Number(i.amount) || 0));
    });
    
    const expenseByCategory = new Map<string, number>();
    allExpenses.forEach(e => {
      const current = expenseByCategory.get(e.category) || 0;
      expenseByCategory.set(e.category, current + (Number(e.amount) || 0));
    });
    
    return {
      totalIncome,
      totalExpense,
      balance,
      incomeByCategory: Array.from(incomeByCategory.entries()).map(([category, amount]) => ({
        category,
        amount,
        percentage: totalIncome > 0 ? (amount / totalIncome) * 100 : 0,
      })),
      expenseByCategory: Array.from(expenseByCategory.entries()).map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
      })),
    };
  }
}

export const storage = new DatabaseStorage();
