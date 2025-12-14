import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type DisplayCurrency = "TRY" | "USD" | "EUR" | "BTC" | "ETH" | "XAU";

interface ExchangeRates {
  TRY: number;
  USD: number;
  EUR: number;
  BTC: number;
  ETH: number;
  XAU: number;
}

interface CurrencyContextType {
  displayCurrency: DisplayCurrency;
  setDisplayCurrency: (currency: DisplayCurrency) => void;
  exchangeRates: ExchangeRates;
  isLoadingRates: boolean;
  refreshRates: () => Promise<void>;
  convertFromTRY: (amountInTRY: number) => number;
  formatDisplayCurrency: (amountInTRY: number) => string;
}

const defaultRates: ExchangeRates = {
  TRY: 1,
  USD: 0,
  EUR: 0,
  BTC: 0,
  ETH: 0,
  XAU: 0,
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [displayCurrency, setDisplayCurrencyState] = useState<DisplayCurrency>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("displayCurrency") as DisplayCurrency) || "TRY";
    }
    return "TRY";
  });
  
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>(defaultRates);
  const [isLoadingRates, setIsLoadingRates] = useState(false);

  const setDisplayCurrency = (currency: DisplayCurrency) => {
    setDisplayCurrencyState(currency);
    localStorage.setItem("displayCurrency", currency);
  };

  const refreshRates = async () => {
    setIsLoadingRates(true);
    try {
      const response = await fetch("/api/exchange-rates");
      if (response.ok) {
        const data = await response.json();
        setExchangeRates({ ...defaultRates, ...data.rates });
      }
    } catch (error) {
      console.error("Failed to fetch exchange rates:", error);
    } finally {
      setIsLoadingRates(false);
    }
  };

  const convertFromTRY = (amountInTRY: number): number => {
    if (displayCurrency === "TRY" || !exchangeRates[displayCurrency]) {
      return amountInTRY;
    }
    const rate = exchangeRates[displayCurrency];
    if (rate === 0) return amountInTRY;
    return amountInTRY / rate;
  };

  const currencySymbols: Record<DisplayCurrency, string> = {
    TRY: "₺",
    USD: "$",
    EUR: "€",
    BTC: "₿",
    ETH: "Ξ",
    XAU: "gr",
  };

  const formatDisplayCurrency = (amountInTRY: number): string => {
    const converted = convertFromTRY(amountInTRY);
    const symbol = currencySymbols[displayCurrency];
    
    if (displayCurrency === "BTC" || displayCurrency === "ETH") {
      return `${symbol}${converted.toFixed(6)}`;
    } else if (displayCurrency === "XAU") {
      return `${converted.toFixed(2)} ${symbol}`;
    } else {
      return new Intl.NumberFormat("tr-TR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(converted) + ` ${symbol}`;
    }
  };

  useEffect(() => {
    refreshRates();
  }, []);

  return (
    <CurrencyContext.Provider value={{ 
      displayCurrency, 
      setDisplayCurrency, 
      exchangeRates, 
      isLoadingRates, 
      refreshRates,
      convertFromTRY,
      formatDisplayCurrency,
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useDisplayCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useDisplayCurrency must be used within CurrencyProvider");
  }
  return context;
}
