import { storage } from "../storage";

interface BinancePriceResponse {
  symbol: string;
  price: string;
}

interface YahooChartResponse {
  chart: {
    result: Array<{
      meta: {
        regularMarketPrice: number;
        previousClose: number;
      };
    }>;
    error: null | { code: string; description: string };
  };
}

export async function fetchBinancePrice(symbol: string): Promise<number | null> {
  try {
    // Preserve alphanumeric characters for Binance symbols (e.g., 1INCH, SHIB1000)
    const binanceSymbol = symbol.toUpperCase().replace(/[^A-Z0-9]/g, "") + "USDT";
    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`);
    
    if (!response.ok) {
      console.log(`Binance API error for ${symbol}: ${response.status}`);
      return null;
    }
    
    const data: BinancePriceResponse = await response.json();
    return parseFloat(data.price);
  } catch (error) {
    console.error(`Failed to fetch Binance price for ${symbol}:`, error);
    return null;
  }
}

export async function fetchYahooPrice(symbol: string, market: string): Promise<number | null> {
  try {
    let yahooSymbol = symbol;
    
    if (market === "BIST") {
      yahooSymbol = symbol.toUpperCase() + ".IS";
    } else if (market === "US") {
      yahooSymbol = symbol.toUpperCase();
    }
    
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      }
    );
    
    if (!response.ok) {
      console.log(`Yahoo Finance API error for ${symbol}: ${response.status}`);
      return null;
    }
    
    const data: YahooChartResponse = await response.json();
    
    if (data.chart.error) {
      console.log(`Yahoo Finance error for ${symbol}:`, data.chart.error.description);
      return null;
    }
    
    const result = data.chart.result?.[0];
    if (!result?.meta?.regularMarketPrice) {
      console.log(`No price data for ${symbol}`);
      return null;
    }
    
    return result.meta.regularMarketPrice;
  } catch (error) {
    console.error(`Failed to fetch Yahoo price for ${symbol}:`, error);
    return null;
  }
}

export interface PriceUpdateResult {
  assetId: string;
  symbol: string;
  oldPrice: number;
  newPrice: number | null;
  success: boolean;
  error?: string;
}

export async function updateAllAssetPrices(): Promise<PriceUpdateResult[]> {
  const assets = await storage.getAssets();
  const results: PriceUpdateResult[] = [];
  
  for (const asset of assets) {
    const oldPrice = Number(asset.currentPrice) || 0;
    let newPrice: number | null = null;
    let error: string | undefined;
    
    try {
      if (asset.type === "kripto") {
        newPrice = await fetchBinancePrice(asset.symbol);
      } else if (asset.type === "hisse" || asset.type === "etf") {
        newPrice = await fetchYahooPrice(asset.symbol, asset.market);
      } else if (asset.type === "gayrimenkul") {
        newPrice = oldPrice;
      }
      
      if (newPrice !== null && newPrice > 0) {
        await storage.updateAsset(asset.id, {
          currentPrice: newPrice.toFixed(2),
        });
      }
    } catch (e) {
      error = e instanceof Error ? e.message : "Unknown error";
      console.error(`Error updating price for ${asset.symbol}:`, error);
    }
    
    results.push({
      assetId: asset.id,
      symbol: asset.symbol,
      oldPrice,
      newPrice,
      success: newPrice !== null && newPrice > 0,
      error,
    });
  }
  
  return results;
}

export async function fetchSingleAssetPrice(
  symbol: string,
  type: string,
  market: string
): Promise<number | null> {
  if (type === "kripto") {
    return await fetchBinancePrice(symbol);
  } else if (type === "hisse" || type === "etf") {
    return await fetchYahooPrice(symbol, market);
  }
  return null;
}

async function fetchCoinGeckoPrice(coinId: string): Promise<number | null> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
      {
        headers: {
          "Accept": "application/json",
        },
      }
    );
    
    if (!response.ok) {
      console.log(`CoinGecko API error for ${coinId}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    return data[coinId]?.usd || null;
  } catch (error) {
    console.error(`Failed to fetch CoinGecko price for ${coinId}:`, error);
    return null;
  }
}

export async function fetchExchangeRates(): Promise<Record<string, number>> {
  const rates: Record<string, number> = { TRY: 1 };
  
  // Fetch USD/TRY 
  const usdTry = await fetchYahooPrice("USDTRY=X", "Diğer");
  if (usdTry) rates.USD = usdTry;
  
  // Fetch EUR/TRY
  const eurTry = await fetchYahooPrice("EURTRY=X", "Diğer");
  if (eurTry) rates.EUR = eurTry;
  
  // Fetch BTC price in USD - try Binance first, fallback to CoinGecko
  let btcUsd = await fetchBinancePrice("BTC");
  if (!btcUsd) {
    btcUsd = await fetchCoinGeckoPrice("bitcoin");
  }
  if (btcUsd && usdTry) rates.BTC = btcUsd * usdTry;
  
  // Fetch ETH price in USD - try Binance first, fallback to CoinGecko
  let ethUsd = await fetchBinancePrice("ETH");
  if (!ethUsd) {
    ethUsd = await fetchCoinGeckoPrice("ethereum");
  }
  if (ethUsd && usdTry) rates.ETH = ethUsd * usdTry;
  
  // Gold price (XAU/USD then convert to TRY per gram)
  // 1 troy oz = 31.1035 grams
  const goldOzUsd = await fetchYahooPrice("GC=F", "Diğer");
  if (goldOzUsd && usdTry) rates.XAU = (goldOzUsd / 31.1035) * usdTry;
  
  return rates;
}
