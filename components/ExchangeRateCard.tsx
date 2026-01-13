
import React from 'react';
import { BankRate } from '../types';
import { TrendingUp, Award, ExternalLink, CalendarDays, ArrowUpRight } from 'lucide-react';

interface Props {
  rate: BankRate;
  isHighest: boolean;
}

const ExchangeRateCard: React.FC<Props> = ({ rate, isHighest }) => {
  return (
    <div className={`p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border-2 transition-all group relative overflow-hidden ${
      isHighest 
      ? 'border-indigo-600 bg-white shadow-2xl shadow-indigo-200/50 ring-4 md:ring-8 ring-indigo-50/50' 
      : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-xl'
    }`}>
      {isHighest && (
        <div className="absolute top-0 right-0 p-3 md:p-4">
           <Award className="w-5 h-5 md:w-6 md:h-6 text-indigo-600 animate-bounce" />
        </div>
      )}
      
      <div className="flex flex-col h-full justify-between">
        <div>
          <h3 className="font-extrabold text-slate-900 uppercase tracking-wider text-[10px] md:text-[11px] mb-3 md:mb-4 flex items-center gap-2">
            <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${isHighest ? 'bg-indigo-600' : 'bg-slate-300'}`}></span>
            {rate.bank}
          </h3>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl md:text-4xl font-[900] text-slate-900 tracking-tighter">
              {rate.rate.toFixed(2).split('.')[0]}
              <span className="text-lg md:text-xl text-slate-400">.{rate.rate.toFixed(2).split('.')[1]}</span>
            </span>
            <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">AOA</span>
          </div>
        </div>

        <div className="mt-6 md:mt-8 space-y-3 pt-3 md:pt-4 border-t border-slate-50">
          <div className="flex items-center justify-between">
            <p className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3" /> Sync: {rate.lastUpdate}
            </p>
            {rate.sourceUrl && (
              <a 
                href={rate.sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-6 h-6 md:w-7 md:h-7 bg-slate-100 text-slate-400 hover:bg-indigo-600 hover:text-white rounded-lg flex items-center justify-center transition-all"
              >
                <ArrowUpRight className="w-3 h-3 md:w-4 md:h-4" />
              </a>
            )}
          </div>
          {rate.publishedAt && (
            <p className="text-[8px] md:text-[9px] text-emerald-500 font-black uppercase flex items-center gap-1.5">
              <CalendarDays className="w-3 h-3" /> No Portal: {rate.publishedAt}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExchangeRateCard;