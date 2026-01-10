
import React, { useState, useEffect } from 'react';
import { fetchExchangeRates } from './geminiService';
import { BankRate } from './types';
import Header from './components/Header';
import ExchangeRateCard from './components/ExchangeRateCard';
import ImportCalculator from './components/ImportCalculator';
import InventorySystem from './components/InventorySystem';
import BillingSystem from './components/BillingSystem';
import ReportsSystem from './components/ReportsSystem';
// Fixed: Added ShieldCheck to the imports from lucide-react
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
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <Header />
      
      <main className="max-w-6xl mx-auto px-6 py-10 pb-32">
        {activeTab === 'home' && (
          <section className="space-y-10 animate-fadeIn">
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-2xl shadow-slate-200/50 flex flex-col lg:flex-row justify-between items-center gap-8 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full">Mercado Financeiro</span>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]'}`}></span>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Monitorização em Tempo Real</p>
                  </div>
                </div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">Taxas de Câmbio <br/><span className="text-indigo-600">USD para Kwanza</span></h2>
                <p className="text-sm text-slate-500 mt-4 font-medium max-w-md">Dados extraídos diretamente dos portais oficiais dos principais bancos comerciais angolanos via Gemini AI.</p>
              </div>

              <div className="flex flex-col gap-3 w-full lg:w-auto relative z-10">
                <button 
                  onClick={loadRates}
                  className="group relative flex items-center justify-center gap-3 px-8 py-5 bg-slate-900 text-white rounded-2xl hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-50 overflow-hidden"
                  disabled={loading}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                  <span className="text-xs font-black uppercase tracking-widest">{loading ? 'Sincronizando...' : 'Atualizar Cotações'}</span>
                </button>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
                   <p className="text-[10px] text-slate-400 font-black uppercase flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" /> Última Verificação
                  </p>
                  <span className="text-xs font-black text-slate-900">{lastSync || '--:--'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {loading && rates.length === 0 ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="h-40 bg-white border border-slate-200 rounded-3xl animate-pulse shadow-sm"></div>
                ))
              ) : (
                rates.map((rate) => (
                  <ExchangeRateCard key={rate.bank} rate={rate} isHighest={rate.rate === maxRate} />
                ))
              )}
            </div>

            <div className="pt-10">
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8 flex items-center gap-4">
                Módulos de Gestão <div className="h-px bg-slate-200 flex-1"></div>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div onClick={() => setActiveTab('calc')} className="group p-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:border-indigo-400/50 transition-all cursor-pointer relative overflow-hidden">
                  <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <Calculator className="w-10 h-10 text-indigo-600" />
                  </div>
                  <h4 className="text-xl font-black mb-2">Calculadora Estimada</h4>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">Cálculo rigoroso de taxas alfandegárias e comissões bancárias.</p>
                  <div className="mt-8 flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    Aceder agora <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                <div onClick={() => setActiveTab('inv')} className="group p-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:border-amber-400/50 transition-all cursor-pointer relative overflow-hidden">
                  <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
                    <Package className="w-10 h-10 text-amber-600" />
                  </div>
                  <h4 className="text-xl font-black mb-2">Controlo de Stock</h4>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">Gestão centralizada de inventário com histórico de custos reais.</p>
                  <div className="mt-8 flex items-center gap-2 text-amber-600 font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    Aceder agora <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                <div onClick={() => setActiveTab('bill')} className="group p-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:border-emerald-400/50 transition-all cursor-pointer relative overflow-hidden">
                  <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <ReceiptText className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h4 className="text-xl font-black mb-2">Facturação Inteligente</h4>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">Emissão de Proformas e Facturas Finais com planos de pagamento.</p>
                  <div className="mt-8 flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    Aceder agora <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
                
                <div onClick={() => setActiveTab('reports')} className="group p-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:border-rose-400/50 transition-all cursor-pointer">
                  <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all">
                    <FileBarChart className="w-10 h-10 text-rose-600" />
                  </div>
                  <h4 className="text-xl font-black mb-2">Relatórios Executivos</h4>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">Análise de rentabilidade e exportação de dados em tempo real.</p>
                </div>

                <div onClick={() => setActiveTab('info')} className="group p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all cursor-pointer lg:col-span-2">
                   <div className="flex flex-col md:flex-row gap-8 items-center h-full">
                      <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-all">
                        <Info className="w-12 h-12 text-white" />
                      </div>
                      <div className="text-center md:text-left">
                        <h4 className="text-2xl font-black text-white mb-2">Centro de Ajuda & Guia</h4>
                        <p className="text-sm text-slate-400 font-medium">Entenda como as taxas são aplicadas e como gerir o seu negócio de importação de forma profissional.</p>
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
              className="group mb-10 flex items-center gap-3 px-6 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-lg transition-all"
             >
               <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <LayoutDashboard className="w-4 h-4" />
               </div>
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:text-slate-900">Dashboard Principal</span>
             </button>

             {activeTab === 'calc' && <ImportCalculator maxRate={maxRate} />}
             {activeTab === 'inv' && <InventorySystem />}
             {activeTab === 'bill' && <BillingSystem />}
             {activeTab === 'reports' && <ReportsSystem />}
             {activeTab === 'info' && (
               <div className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-2xl animate-fadeIn max-w-3xl mx-auto">
                 <h2 className="text-4xl font-black mb-8 tracking-tighter text-slate-900">Guia de Utilização</h2>
                 <div className="prose prose-slate max-w-none space-y-8">
                   <div className="p-8 bg-indigo-50 rounded-3xl border border-indigo-100/50">
                     <h4 className="font-black text-indigo-900 text-sm uppercase mb-4 flex items-center gap-2">
                       <ShieldCheck className="w-5 h-5" /> Integridade dos Dados
                     </h4>
                     <p className="text-sm text-indigo-900/70 font-medium leading-relaxed">
                       O <strong>Tech Import Angola</strong> utiliza o Google Search via Gemini 3 para monitorizar os sites do BAI, BFA, BCI e Atlântico em tempo real. Não dependemos de APIs de terceiros que podem estar desatualizadas.
                     </p>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <h5 className="font-black text-xs uppercase mb-2">1. Calculadora</h5>
                        <p className="text-xs text-slate-500 font-medium">Insira o valor em USD e os custos de envio para obter o custo total em Kwanzas incluindo taxas bancárias de 1.7% e comissões.</p>
                      </div>
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <h5 className="font-black text-xs uppercase mb-2">2. Inventário</h5>
                        <p className="text-xs text-slate-500 font-medium">Registe cada artigo. O sistema calcula automaticamente o Custo Total Real considerando frete, despesas alfandegárias e encargos extras.</p>
                      </div>
                   </div>
                 </div>
               </div>
             )}
          </div>
        )}
      </main>

      {/* Navegação Mobile Estilizada (iOS Style) */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-slate-900/90 backdrop-blur-xl border border-white/10 px-8 py-4 flex justify-between items-center z-50 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'home' ? 'text-indigo-400 scale-110' : 'text-slate-500'}`}>
          <LayoutDashboard className="w-6 h-6" />
        </button>
        <button onClick={() => setActiveTab('calc')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'calc' ? 'text-indigo-400 scale-110' : 'text-slate-500'}`}>
          <Calculator className="w-6 h-6" />
        </button>
        <button onClick={() => setActiveTab('inv')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'inv' ? 'text-amber-400 scale-110' : 'text-slate-500'}`}>
          <Package className="w-6 h-6" />
        </button>
        <button onClick={() => setActiveTab('bill')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'bill' ? 'text-emerald-400 scale-110' : 'text-slate-500'}`}>
          <ReceiptText className="w-6 h-6" />
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
