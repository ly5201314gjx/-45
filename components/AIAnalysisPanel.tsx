import React from 'react';
import { AIAnalysisResult } from '../types';

interface Props {
  analysis: AIAnalysisResult | null;
  loading: boolean;
  onAnalyze: () => void;
}

const Capsule = ({ label, value, type = 'neutral' }: { label: string; value: string | number; type?: 'good' | 'bad' | 'neutral' }) => {
    let colors = 'bg-slate-100 text-slate-600 border-slate-200';
    if (type === 'good') colors = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (type === 'bad') colors = 'bg-rose-50 text-rose-700 border-rose-200';

    return (
        <div className={`flex flex-col items-center justify-center p-3 rounded-2xl border ${colors} transition-all`}>
            <span className="text-[10px] opacity-70 mb-1">{label}</span>
            <span className="text-xs font-bold whitespace-nowrap">{value}</span>
        </div>
    );
};

const AIAnalysisPanel: React.FC<Props> = ({ analysis, loading, onAnalyze }) => {
  return (
    <div className="glass-panel rounded-[2rem] p-6 mt-6 capsule-shadow">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
            <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
            <h2 className="text-lg font-bold text-slate-800">智能量化分析</h2>
        </div>
        <button
          onClick={onAnalyze}
          disabled={loading}
          className={`px-6 py-2 rounded-full text-sm font-bold shadow-lg transition-transform active:scale-95 ${
            loading
              ? 'bg-slate-200 text-slate-400'
              : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          {loading ? '计算中...' : '立即分析'}
        </button>
      </div>

      {!analysis ? (
        <div className="py-12 flex flex-col items-center text-slate-400 gap-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" /></svg>
          </div>
          <span className="text-sm">点击上方按钮开始多维分析</span>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
            {/* Signal Card */}
            <div className="flex items-stretch justify-between bg-white rounded-3xl p-1 shadow-sm border border-slate-100">
                <div className={`flex-1 rounded-2xl p-4 flex flex-col justify-center items-center ${
                    analysis.action === 'LONG' ? 'bg-emerald-50 text-emerald-600' :
                    analysis.action === 'SHORT' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600'
                }`}>
                    <span className="text-xs font-medium opacity-60">信号</span>
                    <span className="text-2xl font-black tracking-tighter">
                        {analysis.action === 'LONG' ? '做多' : analysis.action === 'SHORT' ? '做空' : '观望'}
                    </span>
                </div>
                
                <div className="flex-1 flex flex-col justify-center items-center p-4 border-r border-slate-100">
                    <span className="text-xs text-slate-400 mb-1">置信度</span>
                    <span className="text-xl font-bold text-slate-800">{analysis.confidence}%</span>
                </div>
                
                <div className="flex-1 flex flex-col justify-center items-center p-4">
                    <span className="text-xs text-slate-400 mb-1">目标价</span>
                    <span className="text-xl font-bold text-blue-600">${analysis.predictedPrice.toFixed(2)}</span>
                </div>
            </div>

            {/* 10-Dimension Grid */}
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                <Capsule label="趋势" value={analysis.trend === 'BULLISH' ? '看涨' : analysis.trend === 'BEARISH' ? '看跌' : '震荡'} type={analysis.trend === 'BULLISH' ? 'good' : analysis.trend === 'BEARISH' ? 'bad' : 'neutral'} />
                <Capsule label="形态" value={analysis.dimensions.kLinePattern} />
                <Capsule label="动量" value={analysis.dimensions.momentumScore} />
                <Capsule label="量能" value={analysis.dimensions.volumeAnalysis} />
                <Capsule label="支撑" value={analysis.dimensions.supportLevel.toFixed(1)} />
                <Capsule label="阻力" value={analysis.dimensions.resistanceLevel.toFixed(1)} />
                <Capsule label="波动" value={analysis.dimensions.volatilityIndex} />
                <Capsule label="资金" value={analysis.dimensions.institutionalFlow} />
            </div>

            {/* Reasoning */}
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 text-sm leading-relaxed text-slate-600">
                <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-600 mr-2 mb-2">分析逻辑</span>
                {analysis.reasoning}
            </div>
        </div>
      )}
    </div>
  );
};

export default AIAnalysisPanel;