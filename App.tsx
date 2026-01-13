
import React, { useState, useEffect } from 'react';
import { fetchExchangeRates } from './geminiService';
import { BankRate } from './types';
import Header from './components/Header';
import ExchangeRateCard from './components/ExchangeRateCard';
import ImportCalculator from './components/ImportCalculator';
import InventorySystem from './components/InventorySystem';
import BillingSystem from './components/BillingSystem';
import ReportsSystem from './components/ReportsSystem';
import { Calculator, Package, Info, RefreshCw, ReceiptText, FileBarChart, Clock, LayoutDashboard, ChevronRight, ShieldCheck } from 'lucide-react';

const App: React.FC = () => {
  const [rates, setRates] = useState<BankRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'home' | 'calc' | 'inv' | 'bill' | 'info' | 'reports'>('home');

  const maxRate = rates.length > 0 ? Math.max(...rates.map(r => r.rate)) : 0;

  const loadRates = async () => {
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 600));
      const data = await fetchExchangeRates();
      const now = new Date().toLocaleTimeString('pt-PT');
      const validRates = data.filter(r => r && r.bank && typeof r.rate === 'number');
      setRates(validRates.map((d: any) => ({ ...d, lastUpdate: d.lastUpdate || now })));
      setLastSync(now);
    } catch (err) {
      console.error("Erro ao sincronizar com bancos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRates();
    const interval = setInterval(loadRates, 20 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 pb-24 md:pb-32">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10">
        {activeTab === 'home' && (
          <section className="space-y-6 md:space-y-10 animate-fadeIn">
            <div className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-xl md:shadow-2xl shadow-slate-200/50 flex flex-col lg:flex-row justify-between items-start md:items-center gap-6 md:gap-8 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-indigo-50 rounded-full blur-3xl -mr-24 -mt-24 md:-mr-32 md:-mt-32 opacity-50 pointer-events-none"></div>
              <div className="relative z-10 w-full">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-2.5 py-0.5 bg-indigo-600 text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-full">Mercado Financeiro</span>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]'}`}></span>
                    <p className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-wider">Monitorização Real</p>
                  </div>
                </div>
                <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">Taxas de Câmbio <br/><span className="text-indigo-600">USD para Kwanza</span></h2>
                <p className="text-xs md:text-sm text-slate-500 mt-3 md:mt-4 font-medium max-w-md leading-relaxed">Dados extraídos diretamente dos portais oficiais dos principais bancos comerciais angolanos via Gemini AI.</p>
              </div>

              <div className="flex flex-row md:flex-col gap-3 w-full lg:w-auto relative z-10">
                <button 
                  onClick={loadRates}
                  className="flex-1 md:flex-none group relative flex items-center justify-center gap-2 md:gap-3 px-4 md:px-8 py-4 md:py-5 bg-slate-900 text-white rounded-xl md:rounded-2xl hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-50 overflow-hidden"
                  disabled={loading}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                  <RefreshCw className={`w-4 h-4 md:w-5 md:h-5 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                  <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">{loading ? '...' : 'Atualizar'}</span>
                </button>
                <div className="flex-1 md:flex-none bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-center md:justify-between gap-1 md:gap-4">
                   <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase flex items-center gap-2">
                    <Clock className="w-3 h-3" /> <span className="hidden md:inline">Última Verificação</span><span className="md:hidden">Sync</span>
                  </p>
                  <span className="text-[10px] md:text-xs font-black text-slate-900">{lastSync || '--:--'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
              {loading && rates.length === 0 ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="h-32 md:h-40 bg-white border border-slate-200 rounded-2xl md:rounded-3xl animate-pulse shadow-sm"></div>
                ))
              ) : (
                rates.map((rate) => (
                  <ExchangeRateCard key={rate.bank} rate={rate} isHighest={rate.rate === maxRate} />
                ))
              )}
            </div>

            <div className="pt-6 md:pt-10">
              <h3 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-slate-400 mb-6 md:mb-8 flex items-center gap-4">
                Módulos de Gestão <div className="h-px bg-slate-200 flex-1"></div>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                <div onClick={() => setActiveTab('calc')} className="group p-6 md:p-8 bg-white border border-slate-200 rounded-[2rem] md:rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:border-indigo-400/50 transition-all cursor-pointer relative overflow-hidden active:scale-[0.98]">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-indigo-50 rounded-2xl md:rounded-3xl flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <Calculator className="w-8 h-8 md:w-10 md:h-10 text-indigo-600" />
                  </div>
                  <h4 className="text-lg md:text-xl font-black mb-1 md:mb-2">Calculadora</h4>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">Cálculo de taxas alfandegárias e custos.</p>
                  <div className="mt-6 md:mt-8 flex items-center gap-2 text-indigo-600 font-black text-[9px] md:text-[10px] uppercase tracking-widest opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    Aceder agora <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
                  </div>
                </div>

                <div onClick={() => setActiveTab('inv')} className="group p-6 md:p-8 bg-white border border-slate-200 rounded-[2rem] md:rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:border-amber-400/50 transition-all cursor-pointer relative overflow-hidden active:scale-[0.98]">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-amber-50 rounded-2xl md:rounded-3xl flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
                    <Package className="w-8 h-8 md:w-10 md:h-10 text-amber-600" />
                  </div>
                  <h4 className="text-lg md:text-xl font-black mb-1 md:mb-2">Stock</h4>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">Controlo de inventário e custos reais.</p>
                  <div className="mt-6 md:mt-8 flex items-center gap-2 text-amber-600 font-black text-[9px] md:text-[10px] uppercase tracking-widest opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    Aceder agora <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
                  </div>
                </div>

                <div onClick={() => setActiveTab('bill')} className="group p-6 md:p-8 bg-white border border-slate-200 rounded-[2rem] md:rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:border-emerald-400/50 transition-all cursor-pointer relative overflow-hidden active:scale-[0.98]">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-50 rounded-2xl md:rounded-3xl flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <ReceiptText className="w-8 h-8 md:w-10 md:h-10 text-emerald-600" />
                  </div>
                  <h4 className="text-lg md:text-xl font-black mb-1 md:mb-2">Facturação</h4>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">Emissão de Facturas e Recibos.</p>
                  <div className="mt-6 md:mt-8 flex items-center gap-2 text-emerald-600 font-black text-[9px] md:text-[10px] uppercase tracking-widest opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    Aceder agora <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
                  </div>
                </div>
                
                <div onClick={() => setActiveTab('reports')} className="group p-6 md:p-8 bg-white border border-slate-200 rounded-[2rem] md:rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:border-rose-400/50 transition-all cursor-pointer active:scale-[0.98]">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-rose-50 rounded-2xl md:rounded-3xl flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-all">
                    <FileBarChart className="w-8 h-8 md:w-10 md:h-10 text-rose-600" />
                  </div>
                  <h4 className="text-lg md:text-xl font-black mb-1 md:mb-2">Relatórios</h4>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">Análise de rentabilidade e exportação.</p>
                </div>

                <div onClick={() => setActiveTab('info')} className="group p-6 md:p-8 bg-slate-900 border border-slate-800 rounded-[2rem] md:rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all cursor-pointer lg:col-span-2 active:scale-[0.98]">
                   <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center h-full">
                      <div className="w-16 h-16 md:w-24 md:h-24 bg-white/10 rounded-2xl md:rounded-3xl flex items-center justify-center group-hover:scale-110 transition-all">
                        <Info className="w-8 h-8 md:w-12 md:h-12 text-white" />
                      </div>
                      <div className="text-center md:text-left">
                        <h4 className="text-xl md:text-2xl font-black text-white mb-2">Ajuda & Guia</h4>
                        <p className="text-xs md:text-sm text-slate-400 font-medium">Entenda as taxas e a gestão profissional.</p>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Módulos com Botão Voltar Estilizado */}
        {activeTab !== 'home' && (
          <div className="animate-slideUp">
             <button 
              onClick={() => setActiveTab('home')} 
              className="group mb-6 md:mb-10 flex items-center gap-3 px-4 md:px-6 py-2 md:py-3 bg-white border border-slate-200 rounded-xl md:rounded-2xl shadow-sm hover:shadow-lg transition-all active:scale-95"
             >
               <div className="w-6 h-6 md:w-8 md:h-8 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <LayoutDashboard className="w-3 h-3 md:w-4 md:h-4" />
               </div>
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:text-slate-900">Voltar ao Menu</span>
             </button>

             <div className="overflow-hidden rounded-[1.5rem] md:rounded-[3rem] shadow-sm">
                {activeTab === 'calc' && <ImportCalculator maxRate={maxRate} />}
                {activeTab === 'inv' && <InventorySystem />}
                {activeTab === 'bill' && <BillingSystem />}
                {activeTab === 'reports' && <ReportsSystem />}
                {activeTab === 'info' && (
                  <div className="bg-white p-6 md:p-12 border border-slate-200 shadow-2xl animate-fadeIn max-w-3xl mx-auto rounded-[1.5rem] md:rounded-[3rem]">
                    <h2 className="text-2xl md:text-4xl font-black mb-6 md:mb-8 tracking-tighter text-slate-900">Guia de Utilização</h2>
                    <div className="prose prose-slate max-w-none space-y-6 md:space-y-8">
                      <div className="p-6 md:p-8 bg-indigo-50 rounded-2xl md:rounded-3xl border border-indigo-100/50">
                        <h4 className="font-black text-indigo-900 text-xs md:text-sm uppercase mb-4 flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5" /> Integridade dos Dados
                        </h4>
                        <p className="text-xs md:text-sm text-indigo-900/70 font-medium leading-relaxed">
                          O <strong>Tech Import Angola</strong> utiliza o Google Search via Gemini 3 para monitorizar os sites do BAI, BFA, BCI e Atlântico em tempo real.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                          <div className="p-5 md:p-6 bg-slate-50 rounded-2xl border border-slate-100">
                            <h5 className="font-black text-xs uppercase mb-2">1. Calculadora</h5>
                            <p className="text-xs text-slate-500 font-medium">Insira o valor em USD e frete para obter o custo total em Kwanzas.</p>
                          </div>
                          <div className="p-5 md:p-6 bg-slate-50 rounded-2xl border border-slate-100">
                            <h5 className="font-black text-xs uppercase mb-2">2. Inventário</h5>
                            <p className="text-xs text-slate-500 font-medium">Registe cada artigo. O sistema calcula o Custo Total Real.</p>
                          </div>
                      </div>
                    </div>
                  </div>
                )}
             </div>
          </div>
        )}
      </main>

      {/* Navegação Mobile Estilizada (iOS Style) - Apenas ícones com label pequena */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-slate-900/95 backdrop-blur-xl border border-white/10 px-6 py-3 flex justify-between items-center z-50 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 transition-all p-1 ${activeTab === 'home' ? 'text-indigo-400' : 'text-slate-500'}`}>
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[9px] font-bold">Home</span>
        </button>
        <button onClick={() => setActiveTab('calc')} className={`flex flex-col items-center gap-1 transition-all p-1 ${activeTab === 'calc' ? 'text-indigo-400' : 'text-slate-500'}`}>
          <Calculator className="w-5 h-5" />
          <span className="text-[9px] font-bold">Calc</span>
        </button>
        <button onClick={() => setActiveTab('inv')} className={`flex flex-col items-center gap-1 transition-all p-1 ${activeTab === 'inv' ? 'text-amber-400' : 'text-slate-500'}`}>
          <Package className="w-5 h-5" />
          <span className="text-[9px] font-bold">Stock</span>
        </button>
        <button onClick={() => setActiveTab('bill')} className={`flex flex-col items-center gap-1 transition-all p-1 ${activeTab === 'bill' ? 'text-emerald-400' : 'text-slate-500'}`}>
          <ReceiptText className="w-5 h-5" />
          <span className="text-[9px] font-bold">Docs</span>
        </button>
      </nav>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
        .animate-slideUp { animation: slideUp 0.5s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
      `}</style>
    </div>
  );
};

export default App;