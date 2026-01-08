import { Candle, IndicatorConfig } from '../types';

// Simple Moving Average
export const calculateSMA = (data: number[], period: number): number[] => {
  const results: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      results.push(NaN);
      continue;
    }
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    results.push(sum / period);
  }
  return results;
};

// Exponential Moving Average
export const calculateEMA = (data: number[], period: number): number[] => {
  const results: number[] = [];
  const k = 2 / (period + 1);
  let ema = data[0];
  results.push(ema);

  for (let i = 1; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
    results.push(ema);
  }
  return results;
};

// RSI
export const calculateRSI = (closePrices: number[], period: number): number[] => {
  const results: number[] = [];
  let gains = 0;
  let losses = 0;

  for (let i = 0; i < closePrices.length; i++) {
    if (i === 0) {
      results.push(NaN);
      continue;
    }
    const change = closePrices[i] - closePrices[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    if (i < period) {
      gains += gain;
      losses += loss;
      results.push(NaN);
      continue;
    }
    if (i === period) {
      gains /= period;
      losses /= period;
    } else {
      gains = (gains * (period - 1) + gain) / period;
      losses = (losses * (period - 1) + loss) / period;
    }
    const rs = losses === 0 ? 100 : gains / losses;
    results.push(100 - (100 / (1 + rs)));
  }
  return results;
};

// MACD
export const calculateMACD = (closePrices: number[], fast: number, slow: number, sig: number) => {
  const emaFast = calculateEMA(closePrices, fast);
  const emaSlow = calculateEMA(closePrices, slow);
  
  const macdLine = emaFast.map((f, i) => f - emaSlow[i]);
  const signalLine = calculateEMA(macdLine, sig);
  const histogram = macdLine.map((m, i) => m - signalLine[i]);

  return { macdLine, signalLine, histogram };
};

// Bollinger Bands
export const calculateBollinger = (closePrices: number[], period: number, mult: number) => {
  const sma = calculateSMA(closePrices, period);
  const bands = closePrices.map((price, i) => {
    if (isNaN(sma[i])) return { upper: NaN, lower: NaN, middle: NaN };
    const slice = closePrices.slice(i - period + 1, i + 1);
    const variance = slice.reduce((a, b) => a + Math.pow(b - sma[i], 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    return {
      middle: sma[i],
      upper: sma[i] + stdDev * mult,
      lower: sma[i] - stdDev * mult
    };
  });
  return bands;
};

// KDJ
export const calculateKDJ = (candles: Candle[], period: number) => {
  let k = 50;
  let d = 50;
  
  return candles.map((c, i) => {
    if (i < period - 1) return { k: 50, d: 50, j: 50 };
    
    const slice = candles.slice(i - period + 1, i + 1);
    const lowN = Math.min(...slice.map(x => x.low));
    const highN = Math.max(...slice.map(x => x.high));
    
    const rsv = highN === lowN ? 50 : ((c.close - lowN) / (highN - lowN)) * 100;
    
    k = (2 / 3) * k + (1 / 3) * rsv;
    d = (2 / 3) * d + (1 / 3) * k;
    const j = 3 * k - 2 * d;
    
    return { k, d, j };
  });
};

// ATR
export const calculateATR = (candles: Candle[], period: number) => {
    const trs = candles.map((c, i) => {
        if (i === 0) return c.high - c.low;
        const hl = c.high - c.low;
        const hc = Math.abs(c.high - candles[i-1].close);
        const lc = Math.abs(c.low - candles[i-1].close);
        return Math.max(hl, hc, lc);
    });
    
    const atr = calculateSMA(trs, period);
    return atr;
};

// Williams %R
export const calculateWilliamsR = (candles: Candle[], period: number): number[] => {
  return candles.map((c, i) => {
    if (i < period - 1) return NaN;
    const slice = candles.slice(i - period + 1, i + 1);
    const highestHigh = Math.max(...slice.map(x => x.high));
    const lowestLow = Math.min(...slice.map(x => x.low));
    
    if (highestHigh === lowestLow) return -50;
    
    return ((highestHigh - c.close) / (highestHigh - lowestLow)) * -100;
  });
};

// Stochastic Oscillator
export const calculateStochastic = (candles: Candle[], period: number, smooth: number) => {
  const stochKRaw = candles.map((c, i) => {
    if (i < period - 1) return NaN;
    const slice = candles.slice(i - period + 1, i + 1);
    const lowN = Math.min(...slice.map(x => x.low));
    const highN = Math.max(...slice.map(x => x.high));
    
    if (highN === lowN) return 50;
    return ((c.close - lowN) / (highN - lowN)) * 100;
  });

  const stochK = calculateSMA(stochKRaw.map(v => isNaN(v) ? 0 : v), smooth);
  const stochD = calculateSMA(stochK.map(v => isNaN(v) ? 0 : v), smooth);

  return { stochK, stochD };
};

// ADX
export const calculateADX = (candles: Candle[], period: number) => {
  const trs: number[] = [];
  const plusDMs: number[] = [];
  const minusDMs: number[] = [];

  for(let i=0; i<candles.length; i++) {
    if(i===0) {
      trs.push(0); plusDMs.push(0); minusDMs.push(0);
      continue;
    }
    const curr = candles[i];
    const prev = candles[i-1];
    
    const hl = curr.high - curr.low;
    const hc = Math.abs(curr.high - prev.close);
    const lc = Math.abs(curr.low - prev.close);
    trs.push(Math.max(hl, hc, lc));

    const upMove = curr.high - prev.high;
    const downMove = prev.low - curr.low;

    if (upMove > downMove && upMove > 0) plusDMs.push(upMove);
    else plusDMs.push(0);

    if (downMove > upMove && downMove > 0) minusDMs.push(downMove);
    else minusDMs.push(0);
  }

  const smoothWilders = (data: number[], n: number) => {
    const res: number[] = [];
    let sum = 0;
    for(let i=0; i<data.length; i++) {
       if (i < n) {
           sum += data[i];
           if (i === n-1) res.push(sum); 
           else res.push(NaN);
       } else {
           const prev = res[i-1];
           res.push((prev * (n-1) + data[i]) / n);
       }
    }
    return res;
  };

  const str = smoothWilders(trs, period);
  const sPlus = smoothWilders(plusDMs, period);
  const sMinus = smoothWilders(minusDMs, period);

  const pdi: number[] = [];
  const mdi: number[] = [];
  const dx: number[] = [];

  for(let i=0; i<candles.length; i++) {
    if(isNaN(str[i]) || str[i] === 0) {
      pdi.push(NaN); mdi.push(NaN); dx.push(NaN);
    } else {
      const p = (sPlus[i] / str[i]) * 100;
      const m = (sMinus[i] / str[i]) * 100;
      pdi.push(p);
      mdi.push(m);
      
      if (p + m === 0) dx.push(0);
      else dx.push((Math.abs(p - m) / (p + m)) * 100);
    }
  }

  const adx = smoothWilders(dx.map(v => isNaN(v) ? 0 : v), period);

  return { adx, pdi, mdi };
};

// --- NEW: Linear Regression Calculation ---
// Calculates the slope of the linear regression line over 'period' candles
export const calculateLinearRegression = (closes: number[], period: number) => {
    const slopes: number[] = [];
    
    // X values are just 0, 1, 2... period-1
    // Pre-calculate sumX and sumXSq for efficiency as they are constant for fixed period
    const n = period;
    let sumX = 0;
    let sumXSq = 0;
    for(let i=0; i<n; i++) {
        sumX += i;
        sumXSq += i*i;
    }
    const denominator = n * sumXSq - sumX * sumX;

    for (let i = 0; i < closes.length; i++) {
        if (i < period - 1) {
            slopes.push(NaN);
            continue;
        }

        const slice = closes.slice(i - period + 1, i + 1);
        let sumY = 0;
        let sumXY = 0;
        
        for (let j = 0; j < n; j++) {
            sumY += slice[j];
            sumXY += j * slice[j];
        }

        const slope = (n * sumXY - sumX * sumY) / denominator;
        slopes.push(slope);
    }
    return slopes;
};


// Main Enrichment Function
export const enrichCandles = (candles: Candle[], config: IndicatorConfig): Candle[] => {
  const closes = candles.map(c => c.close);
  
  const maFast = calculateSMA(closes, config.maFast);
  const maMedium = calculateSMA(closes, config.maMedium);
  const maSlow = calculateSMA(closes, config.maSlow);
  const rsi = calculateRSI(closes, config.rsiPeriod);
  const bb = calculateBollinger(closes, config.bbPeriod, config.bbMultiplier);
  const macdData = calculateMACD(closes, config.macdFast, config.macdSlow, config.macdSignal);
  const kdj = calculateKDJ(candles, config.kdjPeriod);
  const atr = calculateATR(candles, config.atrPeriod);
  
  const williams = calculateWilliamsR(candles, config.williamsPeriod);
  const stoch = calculateStochastic(candles, config.stochPeriod, config.stochSmooth);
  const adxData = calculateADX(candles, config.adxPeriod);
  
  // Calculate Linear Regression Slope (Period 14)
  const slopes = calculateLinearRegression(closes, 14);

  return candles.map((c, i) => ({
    ...c,
    maFast: maFast[i],
    maMedium: maMedium[i],
    maSlow: maSlow[i],
    rsi: rsi[i],
    bbUpper: bb[i].upper,
    bbLower: bb[i].lower,
    bbMiddle: bb[i].middle,
    macd: macdData.macdLine[i],
    macdSignal: macdData.signalLine[i],
    macdHist: macdData.histogram[i],
    k: kdj[i].k,
    d: kdj[i].d,
    j: kdj[i].j,
    atr: atr[i],
    williamsR: williams[i],
    stochK: stoch.stochK[i],
    stochD: stoch.stochD[i],
    adx: adxData.adx[i],
    pdi: adxData.pdi[i],
    mdi: adxData.mdi[i],
    linRegSlope: slopes[i]
  }));
};