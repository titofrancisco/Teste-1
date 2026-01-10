
import React, { useState, useEffect } from 'react';
import { fetchExchangeRates } from './geminiService';
import { BankRate } from './types';
import Header from './components/Header';
import ExchangeRateCard from './components/ExchangeRateCard';
import ImportCalculator from './components/ImportCalculator';
import InventorySystem from './components/InventorySystem';
import BillingSystem from './components/BillingSystem';
import ReportsSystem from './components/ReportsSystem';
import { Calculator, Package, Info, RefreshCw, ReceiptText, FileBarChart, Clock } from 'lucide-react';

const App: React.FC = () => {
  const [rates, setRates] = useState<BankRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'home' | 'calc' | 'inv' | 'bill' | 'info' | 'reports'>('home');

  const maxRate = rates.length > 0 ? Math.max(...rates.map(r => r.rate)) : 0;

  const loadRates = async () => {
    setLoading(true);
    const data = await fetchExchangeRates();
    const now = new Date().toLocaleTimeString('pt-PT');
    setRates(data.map((d: any) => ({ 
      ...d, 
      lastUpdate: now 
    })));
    setLastSync(now);
    setLoading(false);
  };

  useEffect(() => {
    loadRates();
    // Auto-refresh a cada 30 minutos para manter o câmbio "fresco"
    const interval = setInterval(loadRates, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      
      <main className="max-w-5xl mx-auto px-4 py-8 pb-24">
        {activeTab === 'home' && (
          <section className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Câmbio USD/AOA Hoje</h2>
                <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 uppercase tracking-widest mt-1">
                  <Clock className="w-3 h-3" /> Atualizado às: {lastSync || 'Sincronizando...'}
                </p>
              </div>
              <button 
                onClick={loadRates}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 text-indigo-600 ${loading ? 'animate-spin' : ''}`} />
                <span className="text-[10px] font-black uppercase text-indigo-600">Atualizar Agora</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {rates.map((rate) => (
                <ExchangeRateCard key={rate.bank} rate={rate} isHighest={rate.rate === maxRate} />
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-8">
              <button 
                onClick={() => setActiveTab('calc')}
                className="flex flex-col items-center justify-center p-8 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-300 transition-all group"
              >
                <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Calculator className="w-8 h-8 text-indigo-600" />
                </div>
                <span className="font-bold text-slate-700">Verificar Custo Estimado</span>
              </button>

              <button 
                onClick={() => setActiveTab('inv')}
                className="flex flex-col items-center justify-center p-8 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-amber-300 transition-all group"
              >
                <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Package className="w-8 h-8 text-amber-600" />
                </div>
                <span className="font-bold text-slate-700">Inventário</span>
              </button>

              <button 
                onClick={() => setActiveTab('bill')}
                className="flex flex-col items-center justify-center p-8 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-300 transition-all group"
              >
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ReceiptText className="w-8 h-8 text-emerald-600" />
                </div>
                <span className="font-bold text-slate-700">Facturação</span>
              </button>

              <button 
                onClick={() => setActiveTab('reports')}
                className="flex flex-col items-center justify-center p-8 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-rose-300 transition-all group"
              >
                <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileBarChart className="w-8 h-8 text-rose-600" />
                </div>
                <span className="font-bold text-slate-700">Relatórios Gerais</span>
              </button>

              <button 
                onClick={() => setActiveTab('info')}
                className="flex flex-col items-center justify-center p-8 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all group"
              >
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Info className="w-8 h-8 text-slate-600" />
                </div>
                <span className="font-bold text-slate-700">Informações</span>
              </button>
            </div>
          </section>
        )}

        {activeTab === 'calc' && (
          <div className="animate-slideUp">
             <button onClick={() => setActiveTab('home')} className="mb-4 text-indigo-600 font-medium flex items-center gap-1">
               ← Voltar à Home
             </button>
             <ImportCalculator maxRate={maxRate} />
          </div>
        )}

        {activeTab === 'inv' && (
          <div className="animate-slideUp">
             <button onClick={() => setActiveTab('home')} className="mb-4 text-amber-600 font-medium flex items-center gap-1">
               ← Voltar à Home
             </button>
             <InventorySystem />
          </div>
        )}

        {activeTab === 'bill' && (
          <div className="animate-slideUp">
             <button onClick={() => setActiveTab('home')} className="mb-4 text-emerald-600 font-medium flex items-center gap-1">
               ← Voltar à Home
             </button>
             <BillingSystem />
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="animate-slideUp">
             <button onClick={() => setActiveTab('home')} className="mb-4 text-rose-600 font-medium flex items-center gap-1">
               ← Voltar à Home
             </button>
             <ReportsSystem />
          </div>
        )}

        {activeTab === 'info' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm animate-fadeIn">
            <button onClick={() => setActiveTab('home')} className="mb-4 text-slate-600 font-medium flex items-center gap-1">
               ← Voltar à Home
             </button>
             <h2 className="text-2xl font-bold mb-4">Sobre a Aplicação</h2>
             <p className="text-slate-600 leading-relaxed">
               Uma solução completa para gestão de importações e vendas em Angola. Desenvolvida para automatizar cálculos complexos de impostos, câmbio e gestão de prestações.
             </p>
          </div>
        )}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center ${activeTab === 'home' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <RefreshCw className="w-5 h-5" />
          <span className="text-[10px] mt-1">Home</span>
        </button>
        <button onClick={() => setActiveTab('calc')} className={`flex flex-col items-center ${activeTab === 'calc' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <Calculator className="w-5 h-5" />
          <span className="text-[10px] mt-1">Custo</span>
        </button>
        <button onClick={() => setActiveTab('inv')} className={`flex flex-col items-center ${activeTab === 'inv' ? 'text-amber-600' : 'text-slate-400'}`}>
          <Package className="w-5 h-5" />
          <span className="text-[10px] mt-1">Inv.</span>
        </button>
        <button onClick={() => setActiveTab('bill')} className={`flex flex-col items-center ${activeTab === 'bill' ? 'text-emerald-600' : 'text-slate-400'}`}>
          <ReceiptText className="w-5 h-5" />
          <span className="text-[10px] mt-1">Fact.</span>
        </button>
      </nav>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default App;
