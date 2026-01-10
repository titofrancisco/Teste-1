
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
    try {
      // Pequeno delay para feedback visual no Vercel
      await new Promise(r => setTimeout(r, 400));
      const data = await fetchExchangeRates();
      const now = new Date().toLocaleTimeString('pt-PT');
      
      // Filtramos duplicados e garantimos que os dados são válidos
      const validRates = data.filter(r => r && r.bank && typeof r.rate === 'number');
      
      setRates(validRates.map((d: any) => ({ 
        ...d,
        lastUpdate: d.lastUpdate || now 
      })));
      setLastSync(now);
    } catch (err) {
      console.error("Erro ao sincronizar com bancos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRates();
    // Refresh automático a cada 20 minutos
    const interval = setInterval(loadRates, 20 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      
      <main className="max-w-5xl mx-auto px-4 py-8 pb-24">
        {activeTab === 'home' && (
          <section className="space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Câmbio USD/AOA em Directo</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`}></span>
                  <p className="text-[10px] text-slate-500 font-black flex items-center gap-1 uppercase tracking-widest">
                    <Clock className="w-3 h-3" /> Última Verificação: {lastSync || 'Sincronizando...'}
                  </p>
                </div>
              </div>
              <button 
                onClick={loadRates}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95 disabled:opacity-50"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="text-[10px] font-black uppercase tracking-wider">{loading ? 'A aceder aos sites dos bancos...' : 'Forçar Atualização Instantânea'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {loading && rates.length === 0 ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="h-32 bg-slate-200 animate-pulse rounded-xl border border-slate-300"></div>
                ))
              ) : (
                rates.map((rate) => (
                  <ExchangeRateCard key={rate.bank} rate={rate} isHighest={rate.rate === maxRate} />
                ))
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-8">
              <button 
                onClick={() => setActiveTab('calc')}
                className="flex flex-col items-center justify-center p-8 bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all group relative overflow-hidden"
              >
                <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Calculator className="w-8 h-8 text-indigo-600" />
                </div>
                <span className="font-black text-[11px] uppercase tracking-widest text-slate-900">1. Verificar Custos Estimados</span>
              </button>

              <button 
                onClick={() => setActiveTab('inv')}
                className="flex flex-col items-center justify-center p-8 bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-xl hover:border-amber-300 transition-all group"
              >
                <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Package className="w-8 h-8 text-amber-600" />
                </div>
                <span className="font-black text-[11px] uppercase tracking-widest text-slate-900">2. Gestão de Inventário</span>
              </button>

              <button 
                onClick={() => setActiveTab('bill')}
                className="flex flex-col items-center justify-center p-8 bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all group"
              >
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ReceiptText className="w-8 h-8 text-emerald-600" />
                </div>
                <span className="font-black text-[11px] uppercase tracking-widest text-slate-900">3. Facturação Proforma/Final</span>
              </button>

              <button 
                onClick={() => setActiveTab('reports')}
                className="flex flex-col items-center justify-center p-8 bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-xl hover:border-rose-300 transition-all group"
              >
                <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileBarChart className="w-8 h-8 text-rose-600" />
                </div>
                <span className="font-black text-[11px] uppercase tracking-widest text-slate-900">4. Painel de Relatórios</span>
              </button>

              <button 
                onClick={() => setActiveTab('info')}
                className="flex flex-col items-center justify-center p-8 bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-xl hover:border-slate-400 transition-all group"
              >
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Info className="w-8 h-8 text-slate-600" />
                </div>
                <span className="font-black text-[11px] uppercase tracking-widest text-slate-900">5. Guia de Informações</span>
              </button>
            </div>
          </section>
        )}

        {activeTab === 'calc' && (
          <div className="animate-slideUp">
             <button onClick={() => setActiveTab('home')} className="mb-6 text-indigo-600 font-black text-xs uppercase tracking-widest flex items-center gap-2">
               ← Voltar ao Menu Principal
             </button>
             <ImportCalculator maxRate={maxRate} />
          </div>
        )}

        {activeTab === 'inv' && (
          <div className="animate-slideUp">
             <button onClick={() => setActiveTab('home')} className="mb-6 text-amber-600 font-black text-xs uppercase tracking-widest flex items-center gap-2">
               ← Voltar ao Menu Principal
             </button>
             <InventorySystem />
          </div>
        )}

        {activeTab === 'bill' && (
          <div className="animate-slideUp">
             <button onClick={() => setActiveTab('home')} className="mb-6 text-emerald-600 font-black text-xs uppercase tracking-widest flex items-center gap-2">
               ← Voltar ao Menu Principal
             </button>
             <BillingSystem />
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="animate-slideUp">
             <button onClick={() => setActiveTab('home')} className="mb-6 text-rose-600 font-black text-xs uppercase tracking-widest flex items-center gap-2">
               ← Voltar ao Menu Principal
             </button>
             <ReportsSystem />
          </div>
        )}

        {activeTab === 'info' && (
          <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-xl animate-fadeIn max-w-2xl mx-auto">
            <button onClick={() => setActiveTab('home')} className="mb-8 text-slate-600 font-black text-xs uppercase tracking-widest flex items-center gap-2">
               ← Voltar ao Menu Principal
             </button>
             <h2 className="text-3xl font-black mb-6 uppercase tracking-tight">Guia da Aplicação</h2>
             <div className="space-y-6 text-slate-600 leading-relaxed font-medium">
               <p>Esta plataforma foi desenhada para o mercado angolano, oferecendo precisão absoluta nos cálculos de importação e gestão de vendas.</p>
               <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                 <h4 className="font-black text-indigo-900 text-xs uppercase mb-2">Segurança de Dados</h4>
                 <p className="text-xs">O câmbio é atualizado em tempo real via Google Search, buscando dados diretamente nos portais do BAI, BFA, BCI e Atlântico.</p>
               </div>
             </div>
          </div>
        )}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-4 flex justify-between items-center z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <RefreshCw className={`w-5 h-5 ${loading && activeTab === 'home' ? 'animate-spin' : ''}`} />
          <span className="text-[8px] font-black uppercase tracking-tighter">Câmbio</span>
        </button>
        <button onClick={() => setActiveTab('calc')} className={`flex flex-col items-center gap-1 ${activeTab === 'calc' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <Calculator className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase tracking-tighter">Cálculo</span>
        </button>
        <button onClick={() => setActiveTab('inv')} className={`flex flex-col items-center gap-1 ${activeTab === 'inv' ? 'text-amber-600' : 'text-slate-400'}`}>
          <Package className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase tracking-tighter">Stock</span>
        </button>
        <button onClick={() => setActiveTab('bill')} className={`flex flex-col items-center gap-1 ${activeTab === 'bill' ? 'text-emerald-600' : 'text-slate-400'}`}>
          <ReceiptText className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase tracking-tighter">Vendas</span>
        </button>
      </nav>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-slideUp { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
};

export default App;
