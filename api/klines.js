// Vercel Serverless Function
// Handles /api/klines?symbol=...&interval=...&limit=...
export default async function handler(request, response) {
  const { symbol, interval, limit } = request.query;

  if (!symbol || !interval) {
    return response.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit || 100}`;
    const res = await fetch(url);
    
    if (!res.ok) {
      const errorText = await res.text();
      return response.status(res.status).json({ error: `Binance API Error: ${errorText}` });
    }

    const data = await res.json();
    return response.status(200).json(data);
  } catch (error) {
    return response.status(500).json({ error: 'Internal Server Error' });
  }
}