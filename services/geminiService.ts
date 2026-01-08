import { GoogleGenAI, Type } from "@google/genai";
import { Candle, AIAnalysisResult } from "../types";

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeMarket = async (symbol: string, interval: string, candles: Candle[]): Promise<AIAnalysisResult> => {
  // Use last 50 candles for better pattern recognition context
  const recentCandles = candles.slice(-50);
  const currentPrice = recentCandles[recentCandles.length - 1].close;

  const prompt = `
    You are an advanced Crypto Quantitative Analyst Engine.
    Your task is to analyze real-time market data for ${symbol} (${interval} timeframe) and predict future trends.

    Current Price: ${currentPrice}

    INPUT DATA (OHLCV + Indicators for last 50 candles):
    ${JSON.stringify(recentCandles.map(c => ({
      t: new Date(c.time).toISOString().split('T')[1].slice(0,5), // HH:MM
      o: c.open, h: c.high, l: c.low, c: c.close, v: c.volume,
      rsi: c.rsi ? c.rsi.toFixed(1) : '-', 
      ma7: c.maFast ? c.maFast.toFixed(2) : '-', 
      ma99: c.maSlow ? c.maSlow.toFixed(2) : '-'
    })))}

    EXECUTE 10-DIMENSIONAL FRACTAL ANALYSIS:
    1.  **Morphological Similarity**: Compare current K-line formations with historical reversal/continuation patterns.
    2.  **Indicator Correlation**: Analyze RSI divergence and Moving Average crossovers.
    3.  **Amplitude Contrast**: Compare current volatility/range against the moving average range.
    4.  **K-Line Curvature**: Analyze the acceleration/deceleration of price changes (slope analysis).
    5.  **Volume Structure**: Assess accumulation/distribution via volume-price spread.
    6.  **Volatility Signature**: Gauge market compression or expansion phases.
    7.  **Support/Resistance Strength**: Identify key liquidity zones.
    8.  **Fractal Dimension**: Look for self-similar patterns across timeframes.
    9.  **Market Sentiment**: Deduce buy/sell pressure intensity.
    10. **Trend Continuity**: Probability of the current vector maintaining direction.

    SYNTHESIZE findings using "8-Dimension AI Logic" (Technical, Fundamental, Sentiment, Liquidity, Whale Activity, Macro Correlation, On-chain proxies, Risk/Reward) to generate a trade signal.

    OUTPUT REQUIREMENTS:
    - BE PRECISE. Do not hallucinate.
    - Calculate a specific "predictedPrice" based on the analysis.
    - "historicalSimilarity" should be an estimated percentage (0-100%) of how much this setup resembles a textbook or historical pattern.
    - "kLinePattern" should describe the specific visual pattern (e.g., "Bull Flag", "Double Bottom", "Descending Wedge").
  `;

  const schema = {
    type: Type.OBJECT,
    properties: {
      timestamp: { type: Type.INTEGER },
      symbol: { type: Type.STRING },
      trend: { type: Type.STRING, enum: ["BULLISH", "BEARISH", "NEUTRAL"] },
      confidence: { type: Type.NUMBER, description: "Confidence score 0-100" },
      predictedPrice: { type: Type.NUMBER },
      action: { type: Type.STRING, enum: ["LONG", "SHORT", "WAIT"] },
      dimensions: {
        type: Type.OBJECT,
        properties: {
          kLinePattern: { type: Type.STRING, description: "Identified K-line shape/pattern" },
          historicalSimilarity: { type: Type.NUMBER, description: "Similarity score to historical fractals (0-100)" },
          volumeAnalysis: { type: Type.STRING, description: "Volume trend analysis" },
          volatilityIndex: { type: Type.STRING, description: "Low/Medium/High volatility state" },
          supportLevel: { type: Type.NUMBER },
          resistanceLevel: { type: Type.NUMBER },
          momentumScore: { type: Type.NUMBER, description: "0-100 momentum strength" },
          institutionalFlow: { type: Type.STRING, description: "Inferred institutional bias" },
        },
        required: ["kLinePattern", "historicalSimilarity", "volumeAnalysis", "volatilityIndex", "supportLevel", "resistanceLevel", "momentumScore", "institutionalFlow"]
      },
      reasoning: { type: Type.STRING, description: "Concise summary of the 10-dimension analysis" }
    },
    required: ["timestamp", "symbol", "trend", "confidence", "predictedPrice", "action", "dimensions", "reasoning"]
  };

  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: "You are a specialized Crypto Market Fractal Analyst. You focus on shape, curvature, and momentum contrast. You provide conservative, high-probability signals."
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const result = JSON.parse(text);
    return { ...result, signals: [] } as AIAnalysisResult;

  } catch (error) {
    console.error("AI Analysis Failed:", error);
    return {
      timestamp: Date.now(),
      symbol,
      trend: "NEUTRAL",
      confidence: 0,
      predictedPrice: currentPrice,
      action: "WAIT",
      dimensions: {
        kLinePattern: "Scan Failed",
        historicalSimilarity: 0,
        volumeAnalysis: "N/A",
        volatilityIndex: "N/A",
        supportLevel: currentPrice * 0.95,
        resistanceLevel: currentPrice * 1.05,
        momentumScore: 50,
        institutionalFlow: "N/A"
      },
      reasoning: "Analysis unavailable due to connection or rate limit issues.",
      signals: []
    };
  }
};