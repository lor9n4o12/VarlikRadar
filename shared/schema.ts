import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Varlık türleri: Hisse, ETF, Kripto, Gayrimenkul
export const assetTypeEnum = z.enum(["hisse", "etf", "kripto", "gayrimenkul"]);
export type AssetType = z.infer<typeof assetTypeEnum>;

// Borsa türleri: BIST (Borsa İstanbul), US (Amerikan Borsası), Diğer
export const marketEnum = z.enum(["BIST", "US", "Diğer"]);
export type Market = z.infer<typeof marketEnum>;

// İşlem türleri: Alış, Satış
export const transactionTypeEnum = z.enum(["alış", "satış"]);
export type TransactionType = z.infer<typeof transactionTypeEnum>;

// Varlıklar tablosu
export const assets = pgTable("assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // hisse, etf, kripto, gayrimenkul
  name: text("name").notNull(), // Varlık adı
  symbol: text("symbol").notNull(), // Ticker/Symbol (örn: THYAO, AAPL, BTC)
  market: text("market").notNull(), // BIST, US, Diğer
  quantity: decimal("quantity", { precision: 18, scale: 8 }).notNull().default("0"), // Miktar
  averagePrice: decimal("average_price", { precision: 18, scale: 2 }).notNull(), // Ortalama alış fiyatı
  currentPrice: decimal("current_price", { precision: 18, scale: 2 }).notNull(), // Güncel fiyat
  currency: text("currency").notNull().default("TRY"), // Para birimi (TRY, USD, vb.)
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAssetSchema = createInsertSchema(assets).omit({
  id: true,
  createdAt: true,
});

export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type Asset = typeof assets.$inferSelect;

// İşlemler tablosu (Alım/Satım geçmişi)
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assetId: varchar("asset_id").notNull(),
  type: text("type").notNull(), // alış, satış
  quantity: decimal("quantity", { precision: 18, scale: 8 }).notNull(), // Miktar
  price: decimal("price", { precision: 18, scale: 2 }).notNull(), // İşlem fiyatı
  totalAmount: decimal("total_amount", { precision: 18, scale: 2 }).notNull(), // Toplam tutar
  currency: text("currency").notNull().default("TRY"),
  notes: text("notes"), // Notlar
  date: timestamp("date").notNull(), // İşlem tarihi
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactions, {
  date: z.coerce.date(), // Accept string or Date, convert to Date
}).omit({
  id: true,
  createdAt: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// Portföy özeti için tip
export type PortfolioSummary = {
  totalAssets: number; // Toplam Varlık
  totalDebt: number; // Toplam Borç
  netWorth: number; // Net Değer
  monthlyChange: number; // Aylık Değişim (%)
  monthlyChangeAmount: number; // Aylık Değişim (Tutar)
};

// Varlık dağılımı için tip
export type AssetAllocation = {
  type: AssetType;
  name: string;
  value: number;
  percentage: number;
  color: string;
};

// Aylık performans için tip
export type MonthlyPerformance = {
  month: string;
  value: number;
};

// Varlık detay görünümü için tip (tabloda gösterilecek)
export type AssetDetail = Asset & {
  totalValue: number; // Toplam Değer (quantity * currentPrice)
  change: number; // Değişim (%)
  changeAmount: number; // Değişim (Tutar)
  profit: number; // Kar/Zarar
};

// Gelir/Gider kategorileri
export const incomeCategories = [
  "maaş",
  "kira",
  "temettü",
  "faiz",
  "serbest",
  "diğer",
] as const;

export const expenseCategories = [
  "market",
  "faturalar",
  "ulaşım",
  "sağlık",
  "eğlence",
  "giyim",
  "yemek",
  "kira",
  "kredi",
  "sigorta",
  "diğer",
] as const;

export type IncomeCategory = typeof incomeCategories[number];
export type ExpenseCategory = typeof expenseCategories[number];

// Gelirler tablosu
export const incomes = pgTable("incomes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: text("category").notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("TRY"),
  date: timestamp("date").notNull(),
  isRecurring: integer("is_recurring").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertIncomeSchema = createInsertSchema(incomes, {
  date: z.coerce.date(),
}).omit({
  id: true,
  createdAt: true,
});

export type InsertIncome = z.infer<typeof insertIncomeSchema>;
export type Income = typeof incomes.$inferSelect;

// Giderler tablosu
export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: text("category").notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("TRY"),
  date: timestamp("date").notNull(),
  isRecurring: integer("is_recurring").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertExpenseSchema = createInsertSchema(expenses, {
  date: z.coerce.date(),
}).omit({
  id: true,
  createdAt: true,
});

export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

// Bütçe özeti tipi
export type BudgetSummary = {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  incomeByCategory: { category: string; amount: number; percentage: number }[];
  expenseByCategory: { category: string; amount: number; percentage: number }[];
};
