
import React from 'react';
import { Globe } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Import Angola</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Cálculo e Inventário</p>
          </div>
        </div>
        <div className="flex gap-1">
          <span className="w-3 h-3 rounded-full bg-red-500"></span>
          <span className="w-3 h-3 rounded-full bg-black"></span>
          <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
        </div>
      </div>
    </header>
  );
};

export default Header;
