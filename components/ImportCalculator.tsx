
import React, { useState, useEffect } from 'react';
import { DollarSign, Truck, Percent, CreditCard, ShoppingBag, PlusCircle, Scale, Calculator, ArrowDownCircle, Check } from 'lucide-react';

interface Props {
  maxRate: number;
}

const ImportCalculator: React.FC<Props> = ({ maxRate }) => {
  const [usdValue, setUsdValue] = useState<number>(0);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [includeImportTax, setIncludeImportTax] = useState<boolean>(false);
  const [additionalExpenses, setAdditionalExpenses] = useState<number>(0);

  const [importTax, setImportTax] = useState<number>(0);
  const [conversionKwanza, setConversionKwanza] = useState<number>(0);
  const [purchaseCommission, setPurchaseCommission] = useState<number>(0);
  const [amountToLoad, setAmountToLoad] = useState<number>(0);
  const [rechargeCommission, setRechargeCommission] = useState<number>(0);
  const [totalCost, setTotalCost] = useState<number>(0);

  useEffect(() => {
    const taxBase = usdValue * 0.16 * maxRate;
    const taxWithVAT = taxBase * 1.14;
    const finalTax = includeImportTax ? (taxWithVAT + 10000) : 0;
    setImportTax(finalTax);

    const baseKwanza = (usdValue + shippingCost) * maxRate;
    const converted = baseKwanza * 1.017;
    setConversionKwanza(converted);

    const pComm = (converted * 0.03) * 1.14;
    setPurchaseCommission(pComm);

    const load = converted + pComm;
    setAmountToLoad(load);

    const rComm = (load * 0.02) * 1.14;
    setRechargeCommission(rComm);

    const total = finalTax + rComm + additionalExpenses + load;
    setTotalCost(total);

  }, [usdValue, shippingCost, includeImportTax, additionalExpenses, maxRate]);

  const formatAOA = (val: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl border border-slate-200 animate-fadeIn">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 md:mb-12 gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <Calculator className="w-6 h-6 md:w-7 md:h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">Calculadora Estimada</h2>
            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Taxa Máxima: {maxRate.toFixed(2)} Kz</p>
          </div>
        </div>
        
        <div className="flex gap-4">
           <div className="bg-emerald-50 border border-emerald-100 px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-center">
              <p className="text-[7px] md:text-[8px] font-black text-emerald-600 uppercase">Status</p>
              <p className="text-[10px] md:text-xs font-bold text-emerald-900">Online</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16">
        <div className="space-y-6 md:space-y-8">
          <div>
            <label className="block text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 md:mb-3 ml-1">
              Valor do Artigo (USD)
            </label>
            <div className="group relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-focus-within:bg-indigo-600 group-focus-within:text-white transition-all">
                <DollarSign className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <input 
                type="number" 
                value={usdValue || ''}
                onChange={(e) => setUsdValue(Number(e.target.value))}
                placeholder="0.00"
                className="w-full p-4 pl-14 md:p-6 md:pl-16 bg-slate-50 border border-slate-200 rounded-[1.2rem] md:rounded-[1.5rem] focus:ring-4 focus:ring-indigo-100 focus:bg-white focus:border-indigo-600 outline-none transition-all font-extrabold text-lg md:text-xl tracking-tight"
              />
            </div>
          </div>

          <div>
            <label className="block text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 md:mb-3 ml-1">
              Envio / Freight (USD)
            </label>
            <div className="group relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-focus-within:bg-indigo-600 group-focus-within:text-white transition-all">
                <Truck className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <input 
                type="number" 
                value={shippingCost || ''}
                onChange={(e) => setShippingCost(Number(e.target.value))}
                placeholder="0.00"
                className="w-full p-4 pl-14 md:p-6 md:pl-16 bg-slate-50 border border-slate-200 rounded-[1.2rem] md:rounded-[1.5rem] focus:ring-4 focus:ring-indigo-100 focus:bg-white focus:border-indigo-600 outline-none transition-all font-extrabold text-lg md:text-xl tracking-tight"
              />
            </div>
          </div>

          <div 
            onClick={() => setIncludeImportTax(!includeImportTax)}
            className={`p-4 md:p-6 rounded-[1.2rem] md:rounded-[1.5rem] border-2 cursor-pointer transition-all flex items-center justify-between ${includeImportTax ? 'bg-indigo-600 border-indigo-600 shadow-xl shadow-indigo-100' : 'bg-slate-50 border-slate-200 hover:border-indigo-200'}`}
          >
            <div className="flex items-center gap-4 md:gap-5">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center ${includeImportTax ? 'bg-white/20 text-white' : 'bg-white text-indigo-600 shadow-sm'}`}>
                <Scale className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <span className={`block font-black text-xs md:text-sm uppercase tracking-wide ${includeImportTax ? 'text-white' : 'text-slate-900'}`}>Imposto Alfandegário</span>
                <span className={`text-[9px] md:text-[10px] font-bold ${includeImportTax ? 'text-indigo-100' : 'text-slate-400'}`}>16% + IVA + Despachante</span>
              </div>
            </div>
            <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center transition-all ${includeImportTax ? 'bg-white border-white text-indigo-600' : 'border-slate-300 bg-white'}`}>
              {includeImportTax && <Check className="w-3 h-3 md:w-4 md:h-4 font-black" />}
            </div>
          </div>

          <div>
            <label className="block text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 md:mb-3 ml-1">
              Encargos Locais (Kwanza)
            </label>
            <div className="group relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-focus-within:bg-indigo-600 group-focus-within:text-white transition-all">
                <PlusCircle className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <input 
                type="number" 
                value={additionalExpenses || ''}
                onChange={(e) => setAdditionalExpenses(Number(e.target.value))}
                placeholder="0.00"
                className="w-full p-4 pl-14 md:p-6 md:pl-16 bg-slate-50 border border-slate-200 rounded-[1.2rem] md:rounded-[1.5rem] focus:ring-4 focus:ring-indigo-100 focus:bg-white focus:border-indigo-600 outline-none transition-all font-extrabold text-lg md:text-xl tracking-tight"
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] text-white shadow-3xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-[80px] -mr-32 -mt-32"></div>
          
          <div className="relative z-10 space-y-4 md:space-y-6">
            <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-4 md:mb-8">Discriminação de Custos</h4>
            
            <div className="flex justify-between items-center py-3 md:py-4 border-b border-white/5">
              <span className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-wider">Taxas de Importação</span>
              <span className="font-black text-sm md:text-lg">{formatAOA(importTax)}</span>
            </div>
            
            <div className="flex justify-between items-center py-3 md:py-4 border-b border-white/5">
              <span className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-wider">Câmbio + spread (1.7%)</span>
              <span className="font-black text-sm md:text-lg">{formatAOA(conversionKwanza)}</span>
            </div>
            
            <div className="flex justify-between items-center py-3 md:py-4 border-b border-white/5">
              <span className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-wider">Comissão Bancária + IVA</span>
              <span className="font-black text-sm md:text-lg">{formatAOA(purchaseCommission)}</span>
            </div>
            
            <div className="flex justify-between items-center p-4 md:p-6 bg-white/5 rounded-2xl border border-white/10 mt-4 md:mt-8">
              <div>
                <span className="text-indigo-400 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] block mb-1">Valor p/ Carregamento</span>
                <span className="text-xl md:text-2xl font-black">{formatAOA(amountToLoad)}</span>
              </div>
              <ArrowDownCircle className="w-6 h-6 md:w-8 md:h-8 text-indigo-500 opacity-50" />
            </div>
          </div>

          <div className="mt-10 md:mt-16 pt-8 md:pt-10 border-t border-white/10 relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <p className="text-indigo-400 text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em]">Custo Total Estimado</p>
            </div>
            <h3 className="text-3xl md:text-5xl font-[1000] text-white tracking-tighter group-hover:scale-105 transition-transform origin-left duration-500">
              {formatAOA(totalCost)}
            </h3>
            <p className="text-[8px] md:text-[10px] text-slate-500 mt-3 md:mt-4 font-bold uppercase italic">Cálculo gerado com base na cotação comercial máxima do dia.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportCalculator;