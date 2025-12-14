import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAssetSchema, insertTransactionSchema, insertIncomeSchema, insertExpenseSchema } from "@shared/schema";
import { updateAllAssetPrices, fetchSingleAssetPrice, fetchExchangeRates } from "./services/priceService";

export async function registerRoutes(app: Express): Promise<Server> {
  // Asset routes
  app.get("/api/assets", async (req, res) => {
    try {
      const assets = await storage.getAssets();
      res.json(assets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assets" });
    }
  });

  app.get("/api/assets/:id", async (req, res) => {
    try {
      const asset = await storage.getAsset(req.params.id);
      if (!asset) {
        return res.status(404).json({ error: "Asset not found" });
      }
      res.json(asset);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch asset" });
    }
  });

  app.post("/api/assets", async (req, res) => {
    try {
      const validated = insertAssetSchema.parse(req.body);
      const asset = await storage.createAsset(validated);
      res.status(201).json(asset);
    } catch (error) {
      res.status(400).json({ error: "Invalid asset data" });
    }
  });

  app.patch("/api/assets/:id", async (req, res) => {
    try {
      const validated = insertAssetSchema.partial().parse(req.body);
      const asset = await storage.updateAsset(req.params.id, validated);
      if (!asset) {
        return res.status(404).json({ error: "Asset not found" });
      }
      res.json(asset);
    } catch (error) {
      res.status(400).json({ error: "Invalid asset data" });
    }
  });

  app.delete("/api/assets/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteAsset(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Asset not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete asset" });
    }
  });

  // Transaction routes
  app.get("/api/transactions", async (req, res) => {
    try {
      const transactions = await storage.getTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.get("/api/transactions/:id", async (req, res) => {
    try {
      const transaction = await storage.getTransaction(req.params.id);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transaction" });
    }
  });

  app.get("/api/assets/:assetId/transactions", async (req, res) => {
    try {
      const transactions = await storage.getTransactionsByAsset(req.params.assetId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const validated = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(validated);
      res.status(201).json(transaction);
    } catch (error) {
      res.status(400).json({ error: "Invalid transaction data" });
    }
  });

  app.delete("/api/transactions/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTransaction(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete transaction" });
    }
  });

  // Portfolio analytics routes
  app.get("/api/portfolio/summary", async (req, res) => {
    try {
      const summary = await storage.getPortfolioSummary();
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch portfolio summary" });
    }
  });

  app.get("/api/portfolio/allocation", async (req, res) => {
    try {
      const allocation = await storage.getAssetAllocation();
      res.json(allocation);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch asset allocation" });
    }
  });

  app.get("/api/portfolio/performance", async (req, res) => {
    try {
      const performance = await storage.getMonthlyPerformance();
      res.json(performance);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch monthly performance" });
    }
  });

  app.get("/api/portfolio/details", async (req, res) => {
    try {
      const details = await storage.getAssetDetails();
      res.json(details);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch asset details" });
    }
  });

  // Price update routes
  app.post("/api/prices/update", async (req, res) => {
    try {
      const results = await updateAllAssetPrices();
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      res.json({
        message: `Fiyatlar güncellendi: ${successful} başarılı, ${failed} başarısız`,
        results,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Price update error:", error);
      res.status(500).json({ error: "Fiyatlar güncellenirken hata oluştu" });
    }
  });

  app.get("/api/prices/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const { type, market } = req.query;
      
      if (!type || !market) {
        return res.status(400).json({ error: "type and market query params required" });
      }
      
      const price = await fetchSingleAssetPrice(
        symbol,
        type as string,
        market as string
      );
      
      if (price === null) {
        return res.status(404).json({ error: "Price not found" });
      }
      
      res.json({ symbol, price, fetchedAt: new Date().toISOString() });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch price" });
    }
  });

  // Exchange rates endpoint
  app.get("/api/exchange-rates", async (req, res) => {
    try {
      const rates = await fetchExchangeRates();
      res.json({ rates, updatedAt: new Date().toISOString() });
    } catch (error) {
      console.error("Exchange rates error:", error);
      res.status(500).json({ error: "Failed to fetch exchange rates" });
    }
  });

  // Income routes
  app.get("/api/incomes", async (req, res) => {
    try {
      const incomes = await storage.getIncomes();
      res.json(incomes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch incomes" });
    }
  });

  app.post("/api/incomes", async (req, res) => {
    try {
      const validated = insertIncomeSchema.parse(req.body);
      const income = await storage.createIncome(validated);
      res.status(201).json(income);
    } catch (error) {
      res.status(400).json({ error: "Invalid income data" });
    }
  });

  app.delete("/api/incomes/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteIncome(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Income not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete income" });
    }
  });

  // Expense routes
  app.get("/api/expenses", async (req, res) => {
    try {
      const expenses = await storage.getExpenses();
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", async (req, res) => {
    try {
      const validated = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(validated);
      res.status(201).json(expense);
    } catch (error) {
      res.status(400).json({ error: "Invalid expense data" });
    }
  });

  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteExpense(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Expense not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete expense" });
    }
  });

  // Budget summary route
  app.get("/api/budget/summary", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const summary = await storage.getBudgetSummary(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch budget summary" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
