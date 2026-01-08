export enum CoinSymbol {
  BTC = 'BTCUSDT',
  ETH = 'ETHUSDT',
  XRP = 'XRPUSDT',
  PAXG = 'PAXGUSDT'
}

export enum Interval {
  ONE_MINUTE = '1m',
  FIVE_MINUTES = '5m',
  FIFTEEN_MINUTES = '15m',
  ONE_HOUR = '1h',
  FOUR_HOURS = '4h',
  ONE_DAY = '1d'
}

export enum StrategyMode {
  SCALPING = 'SCALPING',       // High Frequency / Aggressive
  SWING = 'SWING',             // Medium Term / Trend Following
  CONSERVATIVE = 'CONSERVATIVE' // Low Risk / High Confirmation
}

export interface IndicatorConfig {
  // MA
  maFast: number;
  maMedium: number;
  maSlow: number;
  // RSI
  rsiPeriod: number;
  // Bollinger
  bbPeriod: number;
  bbMultiplier: number;
  // MACD
  macdFast: number;
  macdSlow: number;
  macdSignal: number;
  // KDJ
  kdjPeriod: number;
  // ATR
  atrPeriod: number;
  // ADX
  adxPeriod: number;
  // Williams %R
  williamsPeriod: number;
  // Stochastic
  stochPeriod: number;
  stochSmooth: number;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  
  // Indicators
  maFast?: number;
  maMedium?: number;
  maSlow?: number;
  rsi?: number;
  
  bbUpper?: number;
  bbLower?: number;
  bbMiddle?: number;
  
  macd?: number;
  macdSignal?: number;
  macdHist?: number;
  
  k?: number;
  d?: number;
  j?: number;
  
  atr?: number;

  // New Indicators
  adx?: number;
  pdi?: number; // +DI
  mdi?: number; // -DI
  williamsR?: number;
  stochK?: number;
  stochD?: number;
}

export type SignalType = 'LONG' | 'SHORT' | 'EXIT_LONG' | 'EXIT_SHORT';

export interface SignalPoint {
  time: number;
  price: number;
  type: SignalType;
  reason: string;
  strategy: string; 
  strength: 'WEAK' | 'MODERATE' | 'STRONG';
}

export interface AIAnalysisResult {
  timestamp: number;
  symbol: string;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  predictedPrice: number;
  action: 'LONG' | 'SHORT' | 'WAIT';
  dimensions: {
    kLinePattern: string;
    historicalSimilarity: number;
    volumeAnalysis: string;
    volatilityIndex: string;
    supportLevel: number;
    resistanceLevel: number;
    momentumScore: number;
    institutionalFlow: string;
  };
  reasoning: string;
  signals: SignalPoint[]; 
}