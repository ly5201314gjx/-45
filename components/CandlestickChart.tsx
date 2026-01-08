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

// Professional Signal Arrow with Strength Visualization & Exit Logic
const SignalArrow = (props: any) => {
    const { cx, cy, type, strength } = props;
    if (!cx || !cy) return null;
    
    const isEntryLong = type === 'LONG';
    const isEntryShort = type === 'SHORT';
    const isExitLong = type === 'EXIT_LONG';
    const isExitShort = type === 'EXIT_SHORT';

    const isEntry = isEntryLong || isEntryShort;
    
    // Colors
    let color = '#94a3b8'; // default grey
    if (isEntryLong) color = '#10B981'; // Emerald
    if (isEntryShort) color = '#F43F5E'; // Rose
    if (isExitLong) color = '#F59E0B'; // Amber (Exit Long Warning)
    if (isExitShort) color = '#3B82F6'; // Blue (Exit Short Warning)

    // Configuration based on Strength & Type
    let scale = 1;
    let label = '';
    let hasGlow = false;
    let hasPulse = false;

    // --- EXIT SIGNAL VISUALS ---
    if (!isEntry) {
        scale = 0.9;
        label = 'X'; // Simple exit marker
    } 
    // --- ENTRY SIGNAL VISUALS ---
    else {
        if (strength === 'WEAK') {
            scale = 1.0;
            label = isEntryLong ? 'L' : 'S';
        } else if (strength === 'MODERATE') {
            scale = 1.2;
            label = isEntryLong ? 'LONG' : 'SHORT';
            hasGlow = true;
        } else if (strength === 'STRONG') {
            scale = 1.5;
            label = isEntryLong ? 'BUY' : 'SELL';
            hasGlow = true;
            hasPulse = true;
        }
    }

    const size = 10 * scale;
    const halfWidth = 5 * scale;
    const offset = 15; 

    // Path Calculations
    let path = '';
    let textY = 0;
    let badgeY = 0;

    // Upward pointing (Long Entry or Short Exit)
    if (isEntryLong || isExitShort) {
        const tipY = cy + offset;
        const baseY = tipY + size;
        path = `M${cx},${tipY} L${cx - halfWidth},${baseY} L${cx + halfWidth},${baseY} Z`;
        textY = baseY + (10 * scale);
        badgeY = tipY + size/2;
    } 
    // Downward pointing (Short Entry or Long Exit)
    else {
        const tipY = cy - offset;
        const baseY = tipY - size;
        path = `M${cx},${tipY} L${cx - halfWidth},${baseY} L${cx + halfWidth},${baseY} Z`;
        textY = baseY - (4 * scale);
        badgeY = tipY - size/2;
    }

    // Override shape for EXIT to be distinct (e.g., a square or cross-like diamond)
    if (!isEntry) {
         path = `M${cx},${cy} m-${halfWidth},0 l${halfWidth},-${halfWidth} l${halfWidth},${halfWidth} l-${halfWidth},${halfWidth} Z`; // Diamond
         textY = cy + (isExitLong ? -15 : 15);
         badgeY = cy;
         label = isExitLong ? 'TP/SL' : 'TP/SL';
    }

    return (
        <g>
            {/* Pulse Animation for Strong Signals */}
            {hasPulse && (
                 <circle cx={cx} cy={badgeY} r={size * 1.5} fill={color} opacity="0.3">
                    <animate attributeName="r" from={size} to={size * 2} dur="1s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.5" to="0" dur="1s" repeatCount="indefinite" />
                 </circle>
            )}

            {/* Static Glow */}
            {hasGlow && (
                <circle cx={cx} cy={badgeY} r={size * 1.2} fill={color} opacity="0.2" />
            )}

            {/* The Shape */}
            <path d={path} fill={color} stroke="white" strokeWidth="1" />

            {/* Text Label */}
            <text 
                x={cx} 
                y={textY} 
                textAnchor="middle" 
                fill={color} 
                fontSize={9 * scale} 
                fontWeight="900"
                style={{ textShadow: '0 0 2px white', fontFamily: 'monospace' }}
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
                                 signal.type === 'LONG' ? 'bg-emerald-500' : 
                                 signal.type === 'SHORT' ? 'bg-rose-500' : 'bg-yellow-500'
                             }`} />
                             <span className={signal.type.includes('LONG') ? 'text-emerald-700' : signal.type.includes('SHORT') ? 'text-rose-700' : 'text-slate-700'}>
                                {signal.type === 'LONG' ? '做多开仓' : 
                                 signal.type === 'SHORT' ? '做空开仓' : 
                                 signal.type === 'EXIT_LONG' ? '多单平仓' : '空单平仓'}
                             </span>
                             {signal.strength === 'STRONG' && <span className="ml-auto text-[9px] bg-white px-1 rounded border shadow-sm">强</span>}
                        </div>
                        <div className="text-[10px] text-slate-500 break-words leading-tight">
                            {signal.reason}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <span>Vol:</span> <span className="font-mono text-slate-500">{Math.floor(data.volume)}</span>
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
      if (s.type === 'LONG' || s.type === 'EXIT_LONG') return showLongs;
      if (s.type === 'SHORT' || s.type === 'EXIT_SHORT') return showShorts;
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
          
          <Line type="monotone" dataKey="maFast" stroke="#f59e0b" dot={false} strokeWidth={1} isAnimationActive={false} />
          <Line type="monotone" dataKey="maMedium" stroke="#8b5cf6" dot={false} strokeWidth={1} isAnimationActive={false} />
          <Line type="monotone" dataKey="maSlow" stroke="#3b82f6" dot={false} strokeWidth={1} isAnimationActive={false} />
          
          <Area type="monotone" dataKey="bbUpper" stroke="none" fill="#e2e8f0" fillOpacity={0.1} isAnimationActive={false} />
          <Area type="monotone" dataKey="bbLower" stroke="none" fill="#e2e8f0" fillOpacity={0.1} isAnimationActive={false} />

          <Bar dataKey="wick" barSize={1} isAnimationActive={false}>
            {chartData.map((entry, index) => <Cell key={`wick-${index}`} fill={entry.color} />)}
          </Bar>

          <Bar dataKey="body" barSize={isMacroMode ? 4 : 8} isAnimationActive={false}>
            {chartData.map((entry, index) => <Cell key={`body-${index}`} fill={entry.color} />)}
          </Bar>

          {/* Render Signals */}
          {signals.map((signal, idx) => (
             <ReferenceDot 
                key={`sig-${idx}`}
                x={signal.time} 
                // Position logic: Long/ExitShort below, Short/ExitLong above
                y={
                    (signal.type === 'LONG' || signal.type === 'EXIT_SHORT') 
                    ? signal.price * 0.995 
                    : signal.price * 1.005
                } 
                r={0} 
                shape={(props: any) => <SignalArrow {...props} type={signal.type} strength={signal.strength} />}
             />
          ))}

          {analysis && (
              <ReferenceLine y={analysis.predictedPrice} stroke="#3b82f6" strokeDasharray="3 3" opacity={0.5}>
                  <Label value="AI Target" position="right" fill="#3b82f6" fontSize={10} />
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