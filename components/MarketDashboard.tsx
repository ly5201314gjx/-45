import React from 'react';
import { Candle } from '../types';

interface Props {
  data: Candle | null;
}

const MetricBox = ({ label, value, color = "text-slate-800", subValue = "" }: { label: string, value: string | number, color?: string, subValue?: string }) => (
    <div className="flex flex-col border-r border-slate-100 last:border-0 px-3 py-1 min-w-[80px]">
        <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">{label}</span>
        <div className="flex items-baseline gap-1">
            <span className={`text-sm font-bold font-mono ${color}`}>{value}</span>
            {subValue && <span className="text-[10px] text-slate-400">{subValue}</span>}
        </div>
    </div>
);

const MarketDashboard: React.FC<Props> = ({ data }) => {
    if (!data) return <div className="h-24 bg-white rounded-2xl flex items-center justify-center text-slate-300 text-xs">暂无数据选中</div>;

    const isUp = data.close >= data.open;
    const priceColor = isUp ? 'text-emerald-600' : 'text-rose-600';

    return (
        <div className="bg-white border border-slate-200 rounded-[1.5rem] shadow-sm p-4 overflow-x-auto no-scrollbar animate-fade-in">
            <div className="flex items-center gap-3 mb-3 border-b border-slate-100 pb-2">
                <div className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-600">
                    {new Date(data.time).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className={`text-lg font-black tracking-tight ${priceColor}`}>
                    {data.close.toFixed(2)}
                </div>
                <span className="text-xs text-slate-400">Vol: {Math.floor(data.volume).toLocaleString()}</span>
            </div>

            <div className="flex gap-2 min-w-max">
                {/* OHLC Group */}
                <div className="flex bg-slate-50 rounded-xl p-1">
                    <MetricBox label="开盘" value={data.open.toFixed(2)} />
                    <MetricBox label="最高" value={data.high.toFixed(2)} />
                    <MetricBox label="最低" value={data.low.toFixed(2)} />
                </div>

                {/* MA Group */}
                <div className="flex bg-slate-50 rounded-xl p-1">
                    <MetricBox label="MA(Fast)" value={data.maFast?.toFixed(2) || '-'} color="text-yellow-600" />
                    <MetricBox label="MA(Med)" value={data.maMedium?.toFixed(2) || '-'} color="text-purple-600" />
                    <MetricBox label="MA(Slow)" value={data.maSlow?.toFixed(2) || '-'} color="text-blue-600" />
                </div>

                {/* Oscillators Group 1 */}
                <div className="flex bg-slate-50 rounded-xl p-1">
                    <MetricBox label="RSI" value={data.rsi?.toFixed(1) || '-'} color={data.rsi && data.rsi > 70 ? 'text-rose-500' : data.rsi && data.rsi < 30 ? 'text-emerald-500' : 'text-slate-700'} />
                    <MetricBox label="KDJ(J)" value={data.j?.toFixed(1) || '-'} color="text-orange-600" />
                    <MetricBox label="ATR" value={data.atr?.toFixed(2) || '-'} />
                </div>

                {/* Oscillators Group 2 (New) */}
                <div className="flex bg-slate-50 rounded-xl p-1">
                    <MetricBox label="ADX" value={data.adx?.toFixed(1) || '-'} />
                    <MetricBox label="+DI" value={data.pdi?.toFixed(1) || '-'} color="text-emerald-600" />
                    <MetricBox label="-DI" value={data.mdi?.toFixed(1) || '-'} color="text-rose-600" />
                    <MetricBox label="Will%R" value={data.williamsR?.toFixed(1) || '-'} color="text-indigo-600" />
                </div>

                {/* Stochastic Group */}
                <div className="flex bg-slate-50 rounded-xl p-1">
                     <MetricBox label="Stoch%K" value={data.stochK?.toFixed(1) || '-'} />
                     <MetricBox label="Stoch%D" value={data.stochD?.toFixed(1) || '-'} />
                </div>

                {/* MACD Group */}
                <div className="flex bg-slate-50 rounded-xl p-1">
                    <MetricBox label="DIF" value={data.macd?.toFixed(2) || '-'} />
                    <MetricBox label="DEA" value={data.macdSignal?.toFixed(2) || '-'} />
                    <MetricBox label="MACD柱" value={data.macdHist?.toFixed(4) || '-'} color={data.macdHist && data.macdHist > 0 ? 'text-emerald-600' : 'text-rose-600'} />
                </div>

                {/* BOLL Group */}
                <div className="flex bg-slate-50 rounded-xl p-1">
                    <MetricBox label="布林上轨" value={data.bbUpper?.toFixed(2) || '-'} />
                    <MetricBox label="布林中轨" value={data.bbMiddle?.toFixed(2) || '-'} color="text-slate-500" />
                    <MetricBox label="布林下轨" value={data.bbLower?.toFixed(2) || '-'} />
                </div>
            </div>
        </div>
    );
};

export default MarketDashboard;