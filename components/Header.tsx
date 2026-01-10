
import React from 'react';
import { Globe, ShieldCheck } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="glass-panel sticky top-0 z-50 border-b border-slate-200/50">
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="w-12 h-12 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200 group-hover:rotate-6 transition-transform duration-300">
            <Globe className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-2xl leading-none tracking-tighter text-slate-900">
              TECHIMPORT
            </h1>
            <p className="text-[12px] text-indigo-600 uppercase tracking-[0.3em] font-black -mt-0.5">ANGOLA</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
            <ShieldCheck className="w-3.5 h-3.5" /> Servidor Seguro
          </div>
          <div className="flex gap-2 p-1.5 bg-slate-100 rounded-xl">
            <span className="w-4 h-4 rounded-md bg-[#D40000] shadow-sm"></span>
            <span className="w-4 h-4 rounded-md bg-[#000000] shadow-sm"></span>
            <span className="w-4 h-4 rounded-md bg-[#FFD700] shadow-sm"></span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
