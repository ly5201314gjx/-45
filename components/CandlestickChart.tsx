import React from 'react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Line,
  ReferenceDot,
  Area,
  Brush,
  ReferenceLine,
  Label
} from 'recharts';
import { Candle, AIAnalysisResult, SignalPoint } from '../types';

interface Props {
  data: Candle[];
  analysis: AIAnalysisResult | null;
  isMacroMode: boolean;
  onHover: (candle: Candle | null) => void;
  showLongs: boolean; // Control toggle
  showShorts: boolean; // Control toggle
}

// Optimized Signal Marker Component
const SignalMarker = (props: any) => {
    const { cx, cy, type, strength, subType } = props;
    if (!cx || !cy) return null;
    
    // Determine Color and Shape Logic
    let color = '#94a3b8'; 
    let scale = 1;
    let path = '';
    let label = '';
    let labelY = 0;
    let glow = false;

    // --- 1. ENTRY SIGNALS ---
    if (type === 'ENTRY_LONG') {
        color = '#10B981'; // Emerald
        scale = strength === 'STRONG' ? 1.4 : 1.1;
        glow = strength === 'STRONG';
        // Up Arrow
        path = `M${cx},${cy+10} L${cx-6},${cy+20} L${cx+6},${cy+20} Z`; 
        label = 'BUY';
        labelY = cy + 30;
    } 
    else if (type === 'ENTRY_SHORT') {
        color = '#F43F5E'; // Rose
        scale = strength === 'STRONG' ? 1.4 : 1.1;
        glow = strength === 'STRONG';
        // Down Arrow
        path = `M${cx},${cy-10} L${cx-6},${cy-20} L${cx+6},${cy-20} Z`; 
        label = 'SELL';
        labelY = cy - 26;
    }
    // --- 2. EXIT TP SIGNALS (Take Profit) ---
    else if (type === 'EXIT_TP') {
        color = subType === 'LONG' ? '#059669' : '#BE123C'; // Darker Green/Red
        scale = 1.2;
        // Checkmark / Target Circle
        path = `M${cx},${cy} m-6,0 a6,6 0 1,0 12,0 a6,6 0 1,0 -12,0 M${cx-3},${cy} l2,2 l4,-4`;
        label = 'TP';
        labelY = subType === 'LONG' ? cy - 15 : cy + 15;
    }
    // --- 3. EXIT SL SIGNALS (Stop Loss) ---
    else if (type === 'EXIT_SL') {
        color = '#F59E0B'; // Amber/Orange for Warning
        scale = 1.0;
        // X Mark
        path = `M${cx-4},${cy-4} L${cx+4},${cy+4} M${cx+4},${cy-4} L${cx-4},${cy+4}`;
        label = 'SL';
        labelY = subType === 'LONG' ? cy + 15 : cy - 15;
    }

    return (
        <g>
            {/* Glow for Strong Signals */}
            {glow && (
                 <circle cx={cx} cy={cy} r={15} fill={color} opacity="0.2">
                    <animate attributeName="opacity" values="0.2;0.5;0.2" dur="2s" repeatCount="indefinite" />
                 </circle>
            )}

            {/* Icon Shape */}
            <path d={path} fill={type.includes('ENTRY') ? color : 'none'} stroke={color} strokeWidth={type.includes('ENTRY') ? 0 : 2} />

            {/* Text Label - Monospace for clarity */}
            <text 
                x={cx} 
                y={labelY} 
                textAnchor="middle" 
                fill={color} 
                fontSize={9 * scale} 
                fontWeight="800"
                style={{ fontFamily: 'monospace', textShadow: '0 1px 2px white' }}
            >
                {label}
            </text>
        </g>
    );
};

// Enhanced Tooltip
const CustomTooltip = ({ active, payload, label, analysis }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload as Candle;
        const signal = analysis?.signals?.find((s: SignalPoint) => s.time === data.time);

        return (
            <div className="bg-white/95 border border-slate-200 p-3 rounded-xl shadow-xl backdrop-blur-md text-xs text-slate-600 z-50 min-w-[180px]">
                <div className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-1 flex justify-between">
                    <span>{new Date(data.time).toLocaleTimeString()}</span>
                    <span className={data.close >= data.open ? "text-emerald-600" : "text-rose-600"}>
                        {data.close.toFixed(2)}
                    </span>
                </div>
                
                {signal && (
                    <div className={`mb-2 p-2 rounded-lg border flex flex-col gap-1 ${
                        signal.type.includes('LONG') ? 'bg-emerald-50 border-emerald-100' : 
                        signal.type.includes('SHORT') ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'
                    }`}>
                        <div className="flex items-center gap-2 font-bold">
                             <div className={`w-2 h-2 rounded-full ${
                                 signal.type === 'ENTRY_LONG' ? 'bg-emerald-500' : 
                                 signal.type === 'ENTRY_SHORT' ? 'bg-rose-500' : 
                                 signal.type === 'EXIT_TP' ? 'bg-blue-500' : 'bg-orange-500'
                             }`} />
                             <span className="text-slate-800">
                                {signal.type === 'ENTRY_LONG' ? '多单进场' : 
                                 signal.type === 'ENTRY_SHORT' ? '空单进场' : 
                                 signal.type === 'EXIT_TP' ? '止盈离场' : '止损/平保'}
                             </span>
                        </div>
                        <div className="text-[10px] text-slate-500 break-words leading-tight mt-1">
                            {signal.reason}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <span>ATR:</span> <span className="font-mono text-slate-500">{data.atr?.toFixed(2)}</span>
                    <span>RSI:</span> <span className="font-mono text-purple-600">{data.rsi?.toFixed(1)}</span>
                </div>
            </div>
        );
    }
    return null;
};

const CandlestickChart: React.FC<Props> = ({ data, analysis, isMacroMode, onHover, showLongs, showShorts }) => {
  const chartData = data.map(d => ({
    ...d,
    body: [Math.min(d.open, d.close), Math.max(d.open, d.close)],
    wick: [d.low, d.high],
    color: d.close > d.open ? '#10B981' : '#F43F5E',
  }));

  // Filter signals based on user toggle
  const signals = (analysis?.signals || []).filter(s => {
      // Determine if this signal relates to LONG or SHORT strategy
      const isLongRel = s.type === 'ENTRY_LONG' || (s.subType === 'LONG');
      const isShortRel = s.type === 'ENTRY_SHORT' || (s.subType === 'SHORT');
      
      if (isLongRel) return showLongs;
      if (isShortRel) return showShorts;
      return true;
  });

  return (
    <div className="w-full h-[500px] select-none touch-pan-x relative group">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart 
            data={chartData} 
            margin={{ top: 20, right: 50, left: 0, bottom: 5 }}
            onMouseMove={(state) => {
                if (state.activePayload && state.activePayload.length > 0) {
                    onHover(state.activePayload[0].payload as Candle);
                }
            }}
            onMouseLeave={() => onHover(null)}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          
          <XAxis 
            dataKey="time" 
            tickFormatter={(tick) => new Date(tick).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
            stroke="#94a3b8"
            fontSize={10}
            minTickGap={50}
            tickLine={false}
            axisLine={false}
          />
          
          <YAxis 
            domain={['auto', 'auto']}
            orientation="right" 
            stroke="#94a3b8"
            fontSize={10}
            tickFormatter={(val) => val.toFixed(2)}
            tickLine={false}
            axisLine={false}
            width={50}
          />
          
          <Tooltip 
            content={<CustomTooltip analysis={analysis} />} 
            cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }} 
            isAnimationActive={false}
          />
          
          {/* Main Indicators */}
          <Line type="monotone" dataKey="maMedium" stroke="#8b5cf6" dot={false} strokeWidth={1.5} isAnimationActive={false} />
          
          <Area type="monotone" dataKey="bbUpper" stroke="none" fill="#e2e8f0" fillOpacity={0.15} isAnimationActive={false} />
          <Area type="monotone" dataKey="bbLower" stroke="none" fill="#e2e8f0" fillOpacity={0.15} isAnimationActive={false} />

          <Bar dataKey="wick" barSize={1} isAnimationActive={false}>
            {chartData.map((entry, index) => <Cell key={`wick-${index}`} fill={entry.color} />)}
          </Bar>

          <Bar dataKey="body" barSize={isMacroMode ? 4 : 8} isAnimationActive={false}>
            {chartData.map((entry, index) => <Cell key={`body-${index}`} fill={entry.color} />)}
          </Bar>

          {/* Signals */}
          {signals.map((signal, idx) => (
             <ReferenceDot 
                key={`sig-${idx}`}
                x={signal.time} 
                // Position logic: 
                // Entry Long / TP Short / SL Short -> Below
                // Entry Short / TP Long / SL Long -> Above
                y={
                    (signal.type === 'ENTRY_LONG' || (signal.type !== 'ENTRY_SHORT' && signal.subType === 'SHORT')) 
                    ? signal.price * 0.996
                    : signal.price * 1.004
                } 
                r={0} 
                shape={(props: any) => <SignalMarker {...props} type={signal.type} subType={signal.subType} strength={signal.strength} />}
             />
          ))}

          {analysis && (
              <ReferenceLine y={analysis.predictedPrice} stroke="#3b82f6" strokeDasharray="3 3" opacity={0.5}>
                  <Label value="AI 目标" position="right" fill="#3b82f6" fontSize={10} />
              </ReferenceLine>
          )}

          {isMacroMode && (
            <Brush 
                dataKey="time" 
                height={30} 
                stroke="#cbd5e1" 
                fill="#f8fafc" 
                tickFormatter={() => ''}
                travellerWidth={10}
            />
          )}

        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CandlestickChart;