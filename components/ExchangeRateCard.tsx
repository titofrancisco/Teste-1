
import React from 'react';
import { BankRate } from '../types';
import { TrendingUp, Award } from 'lucide-react';

interface Props {
  rate: BankRate;
  isHighest: boolean;
}

const ExchangeRateCard: React.FC<Props> = ({ rate, isHighest }) => {
  return (
    <div className={`p-4 rounded-xl border-2 transition-all ${
      isHighest 
      ? 'border-indigo-600 bg-white shadow-md ring-4 ring-indigo-50' 
      : 'border-slate-200 bg-white'
    }`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-slate-800">{rate.bank}</h3>
        {isHighest && (
          <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
            <Award className="w-3 h-3" /> MAX
          </span>
        )}
      </div>
      <div className="flex items-end gap-1">
        <span className="text-2xl font-black text-slate-900">{rate.rate.toFixed(2)}</span>
        <span className="text-xs text-slate-500 font-medium mb-1.5 uppercase">AOA</span>
      </div>
      <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
        <TrendingUp className="w-3 h-3" /> Venda • {rate.lastUpdate}
      </p>
    </div>
  );
};

export default ExchangeRateCard;
