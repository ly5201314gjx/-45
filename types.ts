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
  SCALPING = 'SCALPING',       // High Frequency
  SWING = 'SWING',             // Trend Following
  CONSERVATIVE = 'CONSERVATIVE' // Low Risk
}

export interface IndicatorConfig {
  maFast: number;
  maMedium: number;
  maSlow: number;
  rsiPeriod: number;
  bbPeriod: number;
  bbMultiplier: number;
  macdFast: number;
  macdSlow: number;
  macdSignal: number;
  kdjPeriod: number;
  atrPeriod: number;
  adxPeriod: number;
  williamsPeriod: number;
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

  adx?: number;
  pdi?: number;
  mdi?: number;
  williamsR?: number;
  stochK?: number;
  stochD?: number;
  
  // New Math Model Indicators
  linRegSlope?: number; // Linear Regression Slope
  linRegAngle?: number; // Normalized Angle
}

// Expanded Signal Types for clearer UI
export type SignalType = 'ENTRY_LONG' | 'ENTRY_SHORT' | 'EXIT_TP' | 'EXIT_SL';

export interface SignalPoint {
  time: number;
  price: number;
  type: SignalType;
  subType?: 'LONG' | 'SHORT'; // Which position is being closed
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