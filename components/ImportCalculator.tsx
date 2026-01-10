
import React, { useState, useEffect } from 'react';
import { DollarSign, Truck, Percent, CreditCard, ShoppingBag, PlusCircle, Scale, Calculator } from 'lucide-react';

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
    // Campo 3: Imposto de Importação
    // (F1 * 16% * maxRate) + 14% IVA + 10.000 Kz
    const taxBase = usdValue * 0.16 * maxRate;
    const taxWithVAT = taxBase * 1.14;
    const finalTax = includeImportTax ? (taxWithVAT + 10000) : 0;
    setImportTax(finalTax);

    // Campo 4: Conversão para Kwanza
    // ((F1 + F2) * maxRate) + 1.7%
    const baseKwanza = (usdValue + shippingCost) * maxRate;
    const converted = baseKwanza * 1.017;
    setConversionKwanza(converted);

    // Campo 5: Comissão de Compra + IVA
    // (F4 * 3%) * 1.14
    const pComm = (converted * 0.03) * 1.14;
    setPurchaseCommission(pComm);

    // Campo 6: Valor a Carregar
    // F4 + F5
    const load = converted + pComm;
    setAmountToLoad(load);

    // Campo 7: Comissão de Recarga + IVA
    // (F6 * 2%) * 1.14
    const rComm = (load * 0.02) * 1.14;
    setRechargeCommission(rComm);

    // Campo 9: Custo Total
    // F3 + F7 + F8 + F6
    const total = finalTax + rComm + additionalExpenses + load;
    setTotalCost(total);

  }, [usdValue, shippingCost, includeImportTax, additionalExpenses, maxRate]);

  const formatAOA = (val: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(val);
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-200">
      <div className="flex items-center gap-3 mb-8">
        <Calculator className="w-8 h-8 text-indigo-600" />
        <h2 className="text-2xl font-bold">Cálculo de Custos Estimados</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" /> Consultar em USD
            </label>
            <input 
              type="number" 
              value={usdValue || ''}
              onChange={(e) => setUsdValue(Number(e.target.value))}
              placeholder="0.00"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-500" /> Custo de Envio (USD)
            </label>
            <input 
              type="number" 
              value={shippingCost || ''}
              onChange={(e) => setShippingCost(Number(e.target.value))}
              placeholder="0.00"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={includeImportTax}
                onChange={(e) => setIncludeImportTax(e.target.checked)}
                className="w-5 h-5 rounded text-indigo-600"
              />
              <div>
                <span className="block font-bold text-indigo-900">Imposto de Importação</span>
                <span className="text-xs text-indigo-700">Opcional (16% + 14% IVA + 10k Despachante)</span>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-slate-400" /> Despesas Adicionais (Kwanza)
            </label>
            <input 
              type="number" 
              value={additionalExpenses || ''}
              onChange={(e) => setAdditionalExpenses(Number(e.target.value))}
              placeholder="0.00"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-inner flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-700">
              <span className="text-slate-400 text-xs">Imposto Importação</span>
              <span className="font-bold">{formatAOA(importTax)}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-700">
              <span className="text-slate-400 text-xs">Conversão para Kwanza (1.7%)</span>
              <span className="font-bold">{formatAOA(conversionKwanza)}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-700">
              <span className="text-slate-400 text-xs">Comissão Compra + IVA</span>
              <span className="font-bold">{formatAOA(purchaseCommission)}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-700">
              <span className="text-slate-400 text-xs">Valor a Carregar</span>
              <span className="font-bold text-indigo-400">{formatAOA(amountToLoad)}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-700">
              <span className="text-slate-400 text-xs">Comissão Recarga + IVA</span>
              <span className="font-bold">{formatAOA(rechargeCommission)}</span>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t-2 border-indigo-600">
            <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest">Custo Total</p>
            <h3 className="text-4xl font-black mt-2">{formatAOA(totalCost)}</h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportCalculator;
