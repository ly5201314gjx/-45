import { Candle } from '../types';

const BASE_URL = 'https://api.binance.com/api/v3';

// Fallback generator if API fails (due to CORS in browser without proxy)
const generateMockData = (symbol: string, limit: number): Candle[] => {
  const now = Date.now();
  let price = symbol.includes('BTC') ? 65000 : symbol.includes('ETH') ? 3500 : symbol.includes('XRP') ? 0.6 : 2000;
  const data: Candle[] = [];

  for (let i = limit; i > 0; i--) {
    const time = now - i * 60000;
    const volatility = price * 0.005;
    const open = price;
    const close = price + (Math.random() - 0.5) * volatility;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    const volume = Math.random() * 100 + 50;
    
    data.push({ time, open, high, low, close, volume });
    price = close;
  }
  return data;
};

export const fetchKlines = async (symbol: string, interval: string, limit: number = 100): Promise<Candle[]> => {
  try {
    const response = await fetch(`${BASE_URL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
    
    if (!response.ok) {
        throw new Error("Network response was not ok");
    }

    const rawData = await response.json();

    return rawData.map((d: any) => ({
      time: d[0],
      open: parseFloat(d[1]),
      high: parseFloat(d[2]),
      low: parseFloat(d[3]),
      close: parseFloat(d[4]),
      volume: parseFloat(d[5]),
    }));
  } catch (error) {
    console.warn("Binance API failed (likely CORS), using simulation mode.", error);
    return generateMockData(symbol, limit);
  }
};