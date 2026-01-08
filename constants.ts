import { CoinSymbol, Interval, IndicatorConfig, StrategyMode } from './types';

export const SUPPORTED_COINS = [
  { symbol: CoinSymbol.BTC, name: '比特币', display: 'BTC' },
  { symbol: CoinSymbol.ETH, name: '以太坊', display: 'ETH' },
  { symbol: CoinSymbol.XRP, name: '瑞波币', display: 'XRP' },
  { symbol: CoinSymbol.PAXG, name: 'PAX黄金', display: 'PAXG' },
];

export const TIMEFRAMES = [
  { value: Interval.ONE_MINUTE, label: '1分' },
  { value: Interval.FIVE_MINUTES, label: '5分' },
  { value: Interval.FIFTEEN_MINUTES, label: '15分' },
  { value: Interval.ONE_HOUR, label: '1时' },
  { value: Interval.FOUR_HOURS, label: '4时' },
  { value: Interval.ONE_DAY, label: '日线' },
];

// Base default (Swing)
export const DEFAULT_CONFIG: IndicatorConfig = {
  maFast: 7,
  maMedium: 25,
  maSlow: 99,
  rsiPeriod: 14,
  bbPeriod: 20,
  bbMultiplier: 2,
  macdFast: 12,
  macdSlow: 26,
  macdSignal: 9,
  kdjPeriod: 9,
  atrPeriod: 14,
  adxPeriod: 14,
  williamsPeriod: 14,
  stochPeriod: 14,
  stochSmooth: 3
};

// Strategy Presets
export const STRATEGY_PRESETS: Record<StrategyMode, IndicatorConfig> = {
  [StrategyMode.SCALPING]: {
    // Fast, sensitive settings for high frequency
    maFast: 5,
    maMedium: 10,
    maSlow: 30,
    rsiPeriod: 6, // Very sensitive RSI
    bbPeriod: 20,
    bbMultiplier: 2,
    macdFast: 5,
    macdSlow: 15,
    macdSignal: 5, // Quick MACD
    kdjPeriod: 9,
    atrPeriod: 14,
    adxPeriod: 14,
    williamsPeriod: 14,
    stochPeriod: 9,
    stochSmooth: 3
  },
  [StrategyMode.SWING]: {
    // Balanced settings (Default)
    maFast: 7,
    maMedium: 25,
    maSlow: 99,
    rsiPeriod: 14,
    bbPeriod: 20,
    bbMultiplier: 2,
    macdFast: 12,
    macdSlow: 26,
    macdSignal: 9,
    kdjPeriod: 9,
    atrPeriod: 14,
    adxPeriod: 14,
    williamsPeriod: 14,
    stochPeriod: 14,
    stochSmooth: 3
  },
  [StrategyMode.CONSERVATIVE]: {
    // Slow, requires strong confirmation
    maFast: 20,
    maMedium: 50,
    maSlow: 200, // Golden Cross standard
    rsiPeriod: 21, // Smoother RSI
    bbPeriod: 20,
    bbMultiplier: 2.5, // Wider bands to avoid false breakouts
    macdFast: 24,
    macdSlow: 52,
    macdSignal: 18,
    kdjPeriod: 14,
    atrPeriod: 21,
    adxPeriod: 14,
    williamsPeriod: 21,
    stochPeriod: 21,
    stochSmooth: 5
  }
};