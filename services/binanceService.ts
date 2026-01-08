import { Candle } from '../types';

// Fallback generator if API completely fails
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
    // Try to use the Vercel Serverless Function proxy first
    // This avoids CORS issues on the web
    const response = await fetch(`/api/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
    
    if (!response.ok) {
        throw new Error("Proxy response was not ok");
    }

    const rawData = await response.json();

    if (!Array.isArray(rawData)) {
        throw new Error("Invalid data format");
    }

    return rawData.map((d: any) => ({
      time: d[0],
      open: parseFloat(d[1]),
      high: parseFloat(d[2]),
      low: parseFloat(d[3]),
      close: parseFloat(d[4]),
      volume: parseFloat(d[5]),
    }));
  } catch (error) {
    console.warn("API proxy failed, attempting direct fetch or simulation...", error);
    
    // Fallback: Try Direct (Might work in some local envs, will likely fail CORS on web)
    try {
        const directResponse = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
        if(directResponse.ok) {
             const directData = await directResponse.json();
             return directData.map((d: any) => ({
                time: d[0],
                open: parseFloat(d[1]),
                high: parseFloat(d[2]),
                low: parseFloat(d[3]),
                close: parseFloat(d[4]),
                volume: parseFloat(d[5]),
              }));
        }
    } catch(e) {
        // Ignore direct fetch error
    }

    return generateMockData(symbol, limit);
  }
};