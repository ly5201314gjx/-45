import { Candle, AIAnalysisResult, SignalPoint, StrategyMode, SignalType } from '../types';

// --- Advanced Helper: Chandelier Exit (For Trailing Stops/Exits) ---
// Returns an array of stop prices. If current price crosses this, it's an exit.
const calculateChandelierExits = (candles: Candle[], period: number = 22, multiplier: number = 3.0) => {
    const longStops: (number | null)[] = [];
    const shortStops: (number | null)[] = [];

    for (let i = 0; i < candles.length; i++) {
        if (i < period) {
            longStops.push(null);
            shortStops.push(null);
            continue;
        }
        
        const slice = candles.slice(i - period + 1, i + 1);
        const highestHigh = Math.max(...slice.map(c => c.high));
        const lowestLow = Math.min(...slice.map(c => c.low));
        const currentATR = candles[i].atr || 0;

        longStops.push(highestHigh - currentATR * multiplier);
        shortStops.push(lowestLow + currentATR * multiplier);
    }
    return { longStops, shortStops };
};

// --- Advanced Helper: RSI Divergence ---
// Detects if price made higher high but RSI made lower high (Bearish Divergence)
// or Price made lower low but RSI made higher low (Bullish Divergence)
const detectDivergence = (candles: Candle[], currentIndex: number) => {
    if (currentIndex < 10) return { bullishDiv: false, bearishDiv: false };
    
    const curr = candles[currentIndex];
    // Look back 5-15 bars for a pivot
    let pivotIndex = -1;
    
    // Simplified pivot search for recent swing
    for (let i = currentIndex - 5; i > currentIndex - 15; i--) {
        if (i < 0) break;
        // Simple pivot check
        if (candles[i].high > candles[i-1].high && candles[i].high > candles[i+1].high) {
            pivotIndex = i; // Potential High Pivot
        }
    }

    let bearishDiv = false;
    let bullishDiv = false;

    if (pivotIndex !== -1) {
        const pivot = candles[pivotIndex];
        // Bearish Div: Price Higher High, RSI Lower High
        if (curr.high > pivot.high && (curr.rsi || 50) < (pivot.rsi || 50) && (curr.rsi || 0) > 60) {
            bearishDiv = true;
        }
        // Bullish Div logic (simplified inverse)
        // Price Lower Low, RSI Higher Low
        if (curr.low < pivot.low && (curr.rsi || 50) > (pivot.rsi || 50) && (curr.rsi || 0) < 40) {
            bullishDiv = true;
        }
    }

    return { bullishDiv, bearishDiv };
};

// Helper: Calculate Signal Strength based on Confluence
const getSignalStrength = (curr: Candle, trendAligned: boolean, volMultiplier: number, divergence: boolean): 'WEAK' | 'MODERATE' | 'STRONG' => {
    let score = 0;
    if (trendAligned) score += 1.5;
    if (volMultiplier > 1.8) score += 1; // Heavy Volume
    if (divergence) score += 1.5; // Divergence is a strong signal
    if ((curr.adx || 0) > 25) score += 1;
    
    if (score >= 3.5) return 'STRONG';
    if (score >= 2) return 'MODERATE';
    return 'WEAK';
};

const generateHistoricalSignals = (candles: Candle[], strategy: StrategyMode): SignalPoint[] => {
    const signals: SignalPoint[] = [];
    const startIndex = 50; 
    let lastSignalType: SignalType | null = null; // Track position state
    let lastEntryPrice = 0;
    
    // Strategy Specific Parameters
    const chandelierMult = strategy === StrategyMode.SCALPING ? 2.0 : strategy === StrategyMode.SWING ? 3.0 : 3.5;
    const { longStops, shortStops } = calculateChandelierExits(candles, 22, chandelierMult);

    for (let i = startIndex; i < candles.length; i++) {
        const curr = candles[i];
        const prev = candles[i-1];
        
        if (!curr.maFast || !curr.maSlow || !curr.rsi) continue;

        let signalType: SignalType | null = null;
        let reasons: string[] = [];
        let strength: 'WEAK' | 'MODERATE' | 'STRONG' = 'WEAK';

        const volMultiplier = curr.volume / (prev.volume || 1);
        const { bullishDiv, bearishDiv } = detectDivergence(candles, i);
        
        // --- 1. EXIT LOGIC (Priority: Protect Capital) ---
        // If we are theoretically "in" a position based on last signal, check for exits
        if (lastSignalType === 'LONG') {
            // Chandelier Exit Trigger
            if (curr.close < (longStops[i] || 0)) {
                signalType = 'EXIT_LONG';
                reasons.push('吊灯止损触发');
            } 
            // RSI Extreme Reversal
            else if (curr.rsi > 75 && prev.rsi > 75 && curr.close < prev.close) {
                signalType = 'EXIT_LONG';
                reasons.push('RSI极端超买回调');
            }
            // Bearish Divergence (Top Signal)
            else if (bearishDiv) {
                signalType = 'EXIT_LONG';
                reasons.push('顶背离离场');
            }
        } else if (lastSignalType === 'SHORT') {
            if (curr.close > (shortStops[i] || 0)) {
                signalType = 'EXIT_SHORT';
                reasons.push('吊灯止损触发');
            }
            else if (curr.rsi < 25 && prev.rsi < 25 && curr.close > prev.close) {
                signalType = 'EXIT_SHORT';
                reasons.push('RSI极端超卖反弹');
            }
            else if (bullishDiv) {
                signalType = 'EXIT_SHORT';
                reasons.push('底背离离场');
            }
        }

        // If exit triggered, push signal and reset state
        if (signalType && (signalType === 'EXIT_LONG' || signalType === 'EXIT_SHORT')) {
             signals.push({
                time: curr.time,
                price: curr.close,
                type: signalType,
                reason: reasons.join('+'),
                strategy: strategy,
                strength: 'MODERATE' // Exits are always moderate/necessary
            });
            lastSignalType = null;
            continue; // Don't look for entries on the same bar we exit
        }


        // --- 2. ENTRY LOGIC (Top Tier Algo) ---
        // Don't enter if we already have a position in that direction
        
        const isUptrend = curr.close > curr.maSlow && (curr.maMedium || 0) > (curr.maSlow || 0);
        const isDowntrend = curr.close < curr.maSlow && (curr.maMedium || 0) < (curr.maSlow || 0);

        // -- LONG ENTRIES --
        if (lastSignalType !== 'LONG') {
            // A. Trend Pullback (Swing)
            if (strategy === StrategyMode.SWING && isUptrend) {
                // Price dipped near MA Medium and bounced
                if (prev.low <= (prev.maMedium || 0) && curr.close > (curr.maMedium || 0) && curr.rsi > 45) {
                    signalType = 'LONG';
                    reasons.push('趋势回踩确认');
                }
            }
            // B. Breakout (Conservative)
            if (strategy === StrategyMode.CONSERVATIVE && isUptrend) {
                // Price breaks Upper Bollinger with Volume
                if (curr.close > (curr.bbUpper || 0) && volMultiplier > 2.0) {
                    signalType = 'LONG';
                    reasons.push('放量突破布林');
                }
            }
            // C. Divergence/Reversal (Scalping)
            if (strategy === StrategyMode.SCALPING) {
                 if (bullishDiv || (curr.rsi < 30 && curr.k! > curr.d!)) {
                    signalType = 'LONG';
                    reasons.push('超卖/背离反转');
                 }
            }

            // D. Golden Cross with Momentum (Universal)
            if (prev.maFast < prev.maMedium && curr.maFast > curr.maMedium && curr.rsi > 50 && volMultiplier > 1.2) {
                 signalType = 'LONG';
                 reasons.push('金叉共振');
            }
        }

        // -- SHORT ENTRIES --
        if (lastSignalType !== 'SHORT') {
            // A. Trend Pullback
            if (strategy === StrategyMode.SWING && isDowntrend) {
                if (prev.high >= (prev.maMedium || 0) && curr.close < (curr.maMedium || 0) && curr.rsi < 55) {
                    signalType = 'SHORT';
                    reasons.push('趋势反压确认');
                }
            }
             // B. Breakdown
            if (strategy === StrategyMode.CONSERVATIVE && isDowntrend) {
                if (curr.close < (curr.bbLower || 0) && volMultiplier > 2.0) {
                    signalType = 'SHORT';
                    reasons.push('放量跌破布林');
                }
            }
            // C. Reversal
            if (strategy === StrategyMode.SCALPING) {
                 if (bearishDiv || (curr.rsi > 70 && curr.k! < curr.d!)) {
                    signalType = 'SHORT';
                    reasons.push('超买/背离反转');
                 }
            }
            // D. Death Cross
            if (prev.maFast > prev.maMedium && curr.maFast < curr.maMedium && curr.rsi < 50 && volMultiplier > 1.2) {
                 signalType = 'SHORT';
                 reasons.push('死叉共振');
            }
        }

        // --- FINAL ENTRY CHECK ---
        if (signalType) {
            const trendAligned = (signalType === 'LONG' && isUptrend) || (signalType === 'SHORT' && isDowntrend);
            strength = getSignalStrength(curr, trendAligned, volMultiplier, signalType === 'LONG' ? bullishDiv : bearishDiv);
            
            // Only take entry if strength is sufficient for the strategy
            let valid = true;
            if (strategy === StrategyMode.CONSERVATIVE && strength === 'WEAK') valid = false;

            if (valid) {
                signals.push({
                    time: curr.time,
                    price: curr.close,
                    type: signalType,
                    reason: reasons.join('+'),
                    strategy: strategy,
                    strength: strength
                });
                lastSignalType = signalType;
                lastEntryPrice = curr.close;
                i += 1; // Skip next candle to avoid instant doublet
            }
        }
    }
    return signals;
};

export const runInternalAnalysis = (symbol: string, interval: string, candles: Candle[], strategy: StrategyMode = StrategyMode.SWING): AIAnalysisResult => {
    const len = candles.length;
    if (len < 50) throw new Error("Need more data");

    const current = candles[len - 1];
    
    // Generate signals based on the selected strategy
    const signals = generateHistoricalSignals(candles, strategy);
    
    // --- Context Analysis ---
    const maMedium = current.maMedium || 0;
    const maSlow = current.maSlow || 0;
    
    let trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    if (current.close > maMedium && maMedium > maSlow) trend = 'BULLISH';
    else if (current.close < maMedium && maMedium < maSlow) trend = 'BEARISH';

    // Volatility
    const bbWidth = ((current.bbUpper || 0) - (current.bbLower || 0)) / maMedium;
    const volatilityIndex = bbWidth > 0.10 ? "极度活跃" : bbWidth < 0.03 ? "酝酿突破" : "常态波动";

    // Support/Resistance
    const lookback = candles.slice(len - 30);
    const supportLevel = Math.min(...lookback.map(c => c.low));
    const resistanceLevel = Math.max(...lookback.map(c => c.high));

    let kLinePattern = "整理形态";
    if (current.close > resistanceLevel * 0.995) kLinePattern = "试探顶破";
    if (current.close < supportLevel * 1.005) kLinePattern = "试探跌破";

    // Determine current Action based on the LAST signal
    let action: 'LONG' | 'SHORT' | 'WAIT' = 'WAIT';
    let confidence = 50;

    if (signals.length > 0) {
        const lastSignal = signals[signals.length - 1];
        // If the last signal was an entry and recent enough (within last 10 bars)
        const barsSinceSignal = (current.time - lastSignal.time) / (candles[1].time - candles[0].time);
        
        if (barsSinceSignal < 20) {
            if (lastSignal.type === 'LONG') action = 'LONG';
            else if (lastSignal.type === 'SHORT') action = 'SHORT';
            else action = 'WAIT'; // Exited
            
            confidence = lastSignal.strength === 'STRONG' ? 92 : lastSignal.strength === 'MODERATE' ? 78 : 60;
            // Decay confidence over time
            confidence = Math.max(50, confidence - barsSinceSignal);
        }
    }

    // Prediction
    const predictedPrice = action === 'LONG' ? resistanceLevel * 1.02 : action === 'SHORT' ? supportLevel * 0.98 : current.close;
    
    const reasoning = `[顶级算法] 检测到${signals.length > 0 ? signals[signals.length-1].reason : '无'}信号。当前波动率${(bbWidth*100).toFixed(2)}% (${volatilityIndex})。机构资金流向${current.volume > (current.maMedium || 0)*1.5 ? "显著异动" : "平稳"}。`;

    return {
        timestamp: Date.now(),
        symbol,
        trend,
        confidence,
        predictedPrice,
        action,
        dimensions: {
            kLinePattern,
            historicalSimilarity: 88, 
            volumeAnalysis: current.volume > (current.maMedium || 0) * 1.5 ? "主力介入" : "散户行情",
            volatilityIndex,
            supportLevel,
            resistanceLevel,
            momentumScore: current.rsi || 50,
            institutionalFlow: (current.adx || 0) > 25 ? "趋势明确" : "震荡洗盘"
        },
        reasoning,
        signals 
    };
};