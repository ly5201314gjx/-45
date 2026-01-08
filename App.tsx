import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SUPPORTED_COINS, TIMEFRAMES, DEFAULT_CONFIG, STRATEGY_PRESETS } from './constants';
import { CoinSymbol, Interval, Candle, AIAnalysisResult, IndicatorConfig, StrategyMode } from './types';
import { fetchKlines } from './services/binanceService';
import { enrichCandles } from './services/indicatorService';
import { runInternalAnalysis } from './services/analysisService';
import CandlestickChart from './components/CandlestickChart';
import AIAnalysisPanel from './components/AIAnalysisPanel';
import MarketDashboard from './components/MarketDashboard';

const App: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState<CoinSymbol>(CoinSymbol.BTC);
  const [selectedInterval, setSelectedInterval] = useState<Interval>(Interval.ONE_HOUR);
  
  // Strategy State
  const [strategyMode, setStrategyMode] = useState<StrategyMode>(StrategyMode.SWING);
  
  // Signal Filter State
  const [showLongs, setShowLongs] = useState(true);
  const [showShorts, setShowShorts] = useState(true);
  
  const [candles, setCandles] = useState<Candle[]>([]);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  
  // Macro Mode State
  const [isMacroMode, setIsMacroMode] = useState(false);
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);
  
  const [config, setConfig] = useState<IndicatorConfig>(() => {
    const saved = localStorage.getItem('quant_config');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  const handleStrategyChange = (mode: StrategyMode) => {
      setStrategyMode(mode);
      setConfig(STRATEGY_PRESETS[mode]);
  };

  useEffect(() => {
    localStorage.setItem('quant_config', JSON.stringify(config));
  }, [config]);
  
  const refreshData = useCallback(async () => {
    try {
      const limit = isMacroMode ? 1000 : 200;
      const rawCandles = await fetchKlines(selectedSymbol, selectedInterval, limit);
      const enriched = enrichCandles(rawCandles, config);
      setCandles(enriched);
      
      const result = runInternalAnalysis(selectedSymbol, selectedInterval, enriched, strategyMode);
      setAnalysis(result);

    } catch (error) {
      console.error("Fetch failed", error);
    }
  }, [selectedSymbol, selectedInterval, config, isMacroMode, strategyMode]);

  useEffect(() => {
    refreshData();
    const intervalId = setInterval(refreshData, isMacroMode ? 15000 : 5000); 
    return () => clearInterval(intervalId);
  }, [refreshData, isMacroMode]);

  const handleManualAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
        refreshData().then(() => setIsAnalyzing(false));
    }, 500);
  };

  const getCoinDisplay = (sym: string) => SUPPORTED_COINS.find(c => c.symbol === sym);

  const ConfigInput = ({ label, value, field }: { label: string, value: number, field: keyof IndicatorConfig }) => (
    <div className="flex flex-col">
        <label className="text-[10px] text-slate-400 font-bold mb-1">{label}</label>
        <input 
            type="number" 
            value={value} 
            onChange={(e) => setConfig({...config, [field]: parseInt(e.target.value) || 0})} 
            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-blue-500" 
        />
    </div>
  );

  const dashboardData = hoveredCandle || (candles.length > 0 ? candles[candles.length - 1] : null);

  return (
    <div className="min-h-screen pb-20 selection:bg-blue-100 selection:text-blue-900 bg-slate-50/50">
      
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-sm">
        <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-slate-900/20">Q</div>
                <span className="font-bold text-lg text-slate-800 tracking-tight">Quant<span className="text-blue-600">AI</span></span>
            </div>
            
            <div className="flex gap-2">
                 {/* Signal Filters */}
                 <button 
                    onClick={() => setShowLongs(!showLongs)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${showLongs ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}
                 >
                    {showLongs ? '✅ 只看多' : '⬜ 只看多'}
                 </button>
                 <button 
                    onClick={() => setShowShorts(!showShorts)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${showShorts ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}
                 >
                    {showShorts ? '✅ 只看空' : '⬜ 只看空'}
                 </button>

                <button 
                    onClick={() => setShowConfig(!showConfig)}
                    className={`p-2 rounded-xl transition-all ${showConfig ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                </button>
            </div>
        </div>
      </nav>

      {/* Asset Selector */}
      <div className="bg-white border-b border-slate-200 sticky top-[60px] z-40">
          <div className="container mx-auto px-4 py-3 overflow-x-auto no-scrollbar flex gap-3">
            {SUPPORTED_COINS.map(coin => (
                <button
                    key={coin.symbol}
                    onClick={() => { setSelectedSymbol(coin.symbol); }}
                    className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                        selectedSymbol === coin.symbol 
                        ? 'bg-slate-800 text-white border-slate-800 shadow-md transform scale-105' 
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                    }`}
                >
                    {coin.display}
                </button>
            ))}
          </div>
      </div>

      <main className="container mx-auto p-4 space-y-4 max-w-4xl">
        
        {/* Main Price Header & Controls */}
        <div className="flex justify-between items-end px-2">
            <div>
                <h1 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{getCoinDisplay(selectedSymbol)?.name}</h1>
                <div className="flex items-center gap-3">
                    <div className="text-3xl font-black text-slate-800 tracking-tighter tabular-nums">
                        ${candles.length > 0 ? candles[candles.length-1].close.toLocaleString(undefined, {minimumFractionDigits: 2}) : '---'}
                    </div>
                </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                     <span className="text-[10px] font-bold text-slate-400 uppercase">宏观模式</span>
                     <button 
                        onClick={() => setIsMacroMode(!isMacroMode)}
                        className={`w-10 h-6 rounded-full p-1 transition-colors ${isMacroMode ? 'bg-blue-600' : 'bg-slate-200'}`}
                     >
                         <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${isMacroMode ? 'translate-x-4' : 'translate-x-0'}`} />
                     </button>
                </div>
                
                <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
                    {TIMEFRAMES.slice(0,5).map(tf => (
                        <button
                            key={tf.value}
                            onClick={() => { setSelectedInterval(tf.value); }}
                            className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                                selectedInterval === tf.value
                                ? 'bg-blue-500 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            {tf.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Strategy Selector Capsule */}
        <div className="flex justify-center my-2">
            <div className="bg-slate-200 p-1 rounded-full flex gap-1 shadow-inner">
                <button 
                    onClick={() => handleStrategyChange(StrategyMode.SCALPING)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${strategyMode === StrategyMode.SCALPING ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    ⚡ 高频短线
                </button>
                <button 
                    onClick={() => handleStrategyChange(StrategyMode.SWING)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${strategyMode === StrategyMode.SWING ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    📈 中长线
                </button>
                <button 
                    onClick={() => handleStrategyChange(StrategyMode.CONSERVATIVE)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${strategyMode === StrategyMode.CONSERVATIVE ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    🛡️ 稳健交易
                </button>
            </div>
        </div>

        {/* Real-time Detailed Dashboard */}
        <MarketDashboard data={dashboardData} />

        {/* Config Panel */}
        {showConfig && (
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xl shadow-slate-200/50 animate-fade-in z-50 relative">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-800">指标参数配置</h3>
                    <div className="flex gap-2">
                         <span className="text-[10px] text-slate-400 px-2 py-1 bg-slate-100 rounded">当前模式: {strategyMode}</span>
                         <button onClick={() => setConfig(STRATEGY_PRESETS[StrategyMode.SWING])} className="text-xs text-blue-500 hover:underline">重置默认</button>
                    </div>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                    <div className="col-span-3 sm:col-span-4 text-xs font-bold text-slate-300 border-b border-slate-100 pb-1 mt-2">均线 (MA)</div>
                    <ConfigInput label="MA Fast" value={config.maFast} field="maFast" />
                    <ConfigInput label="MA Med" value={config.maMedium} field="maMedium" />
                    <ConfigInput label="MA Slow" value={config.maSlow} field="maSlow" />
                    
                    <div className="col-span-3 sm:col-span-4 text-xs font-bold text-slate-300 border-b border-slate-100 pb-1 mt-2">MACD</div>
                    <ConfigInput label="Fast" value={config.macdFast} field="macdFast" />
                    <ConfigInput label="Slow" value={config.macdSlow} field="macdSlow" />
                    <ConfigInput label="Signal" value={config.macdSignal} field="macdSignal" />

                    <div className="col-span-3 sm:col-span-4 text-xs font-bold text-slate-300 border-b border-slate-100 pb-1 mt-2">常规指标</div>
                    <ConfigInput label="RSI Period" value={config.rsiPeriod} field="rsiPeriod" />
                    <ConfigInput label="KDJ Period" value={config.kdjPeriod} field="kdjPeriod" />
                    <ConfigInput label="ATR Period" value={config.atrPeriod} field="atrPeriod" />

                    <div className="col-span-3 sm:col-span-4 text-xs font-bold text-slate-300 border-b border-slate-100 pb-1 mt-2">高级指标</div>
                    <ConfigInput label="ADX Period" value={config.adxPeriod} field="adxPeriod" />
                    <ConfigInput label="Will%R Period" value={config.williamsPeriod} field="williamsPeriod" />
                    <ConfigInput label="Stoch Period" value={config.stochPeriod} field="stochPeriod" />
                    <ConfigInput label="Stoch Smooth" value={config.stochSmooth} field="stochSmooth" />
                </div>
            </div>
        )}

        {/* Chart */}
        <div className="bg-white rounded-[2rem] p-1 shadow-lg shadow-slate-200/50 border border-white overflow-hidden relative">
            {candles.length > 0 ? (
                <CandlestickChart 
                    data={candles} 
                    analysis={analysis} 
                    isMacroMode={isMacroMode}
                    onHover={setHoveredCandle}
                    showLongs={showLongs}
                    showShorts={showShorts}
                />
            ) : (
                <div className="h-[400px] flex items-center justify-center text-slate-300 font-bold animate-pulse">
                    正在连接交易所数据...
                </div>
            )}
        </div>

        {/* Analysis Panel */}
        <AIAnalysisPanel 
            analysis={analysis} 
            loading={isAnalyzing} 
            onAnalyze={handleManualAnalyze} 
        />

      </main>
    </div>
  );
};

export default App;