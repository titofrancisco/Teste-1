
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Invoice, InventoryItem, ContractType, PaymentReceipt } from '../types';
import { TrendingUp, BarChart3, Package, ShoppingBag, Printer, History, Download, Upload, Database, Filter, FileSpreadsheet, AlertTriangle, ShieldCheck, Wallet, FileText, Check } from 'lucide-react';

const ReportsSystem: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [filterType, setFilterType] = useState<'invoiceDate' | 'dueDate'>('invoiceDate');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const INV_KEY = 'angola_inv_v4';
  const BILL_KEY = 'angola_invoices_final_v1';
  const REC_KEY = 'angola_receipts_v1';

  useEffect(() => {
    const load = () => {
      const savedInvoices = localStorage.getItem(BILL_KEY);
      const savedInventory = localStorage.getItem(INV_KEY);
      const savedReceipts = localStorage.getItem(REC_KEY);
      if (savedInvoices) setInvoices(JSON.parse(savedInvoices));
      if (savedInventory) setInventory(JSON.parse(savedInventory));
      if (savedReceipts) setReceipts(JSON.parse(savedReceipts));
    };
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, []);

  const parseDate = (dStr: string) => {
    const [d, m, y] = dStr.split('/').map(Number);
    return new Date(y, m - 1, d);
  };

  const getFinalDueDate = (dateStr: string, type: ContractType) => {
    const addDays = (ds: string, days: number) => {
      const [day, month, year] = ds.split('/').map(Number);
      const date = new Date(year, month - 1, day);
      date.setDate(date.getDate() + days);
      return date.toLocaleDateString('pt-PT');
    };
    if (type === ContractType.ORDER) return addDays(dateStr, 30);
    if (type === ContractType.TWO_INSTALLMENTS) return addDays(dateStr, 60);
    if (type === ContractType.THREE_INSTALLMENTS) return addDays(dateStr, 90);
    return dateStr;
  };

  const filteredSales = useMemo(() => {
    const finalInvoices = invoices.filter(i => i.isFinal);
    if (!startDate && !endDate) return finalInvoices;
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(23, 59, 59, 999);
    return finalInvoices.filter(inv => {
      const dateToCompareStr = filterType === 'invoiceDate' ? inv.date : getFinalDueDate(inv.date, inv.contractType);
      const compareDate = parseDate(dateToCompareStr);
      return (!start || compareDate >= start) && (!end || compareDate <= end);
    });
  }, [invoices, startDate, endDate, filterType]);

  const stats = useMemo(() => {
    const finalInvoices = invoices.filter(i => i.isFinal);
    const totalRevenue = finalInvoices.reduce((acc, curr) => acc + curr.adjustedPrice, 0);
    const totalCostSold = finalInvoices.reduce((acc, curr) => acc + (curr.productDetails?.totalCost || 0), 0);
    const totalProfit = totalRevenue - totalCostSold;
    const totalPaid = receipts.reduce((acc, curr) => acc + curr.amount, 0);
    const totalDebt = Math.max(0, totalRevenue - totalPaid);
    const stockValue = inventory.filter(i => !i.isSold).reduce((acc, curr) => acc + curr.totalCost, 0);
    const itemsAvailable = inventory.filter(i => !i.isSold).length;
    return { totalRevenue, totalProfit, totalPaid, totalDebt, stockValue, itemsAvailable };
  }, [invoices, inventory, receipts]);

  const contractStats = useMemo(() => {
    const data = {
      [ContractType.ORDER]: { count: 0, total: 0 },
      [ContractType.TWO_INSTALLMENTS]: { count: 0, total: 0 },
      [ContractType.THREE_INSTALLMENTS]: { count: 0, total: 0 }
    };
    
    filteredSales.forEach(inv => {
       if (data[inv.contractType]) {
         data[inv.contractType].count += 1;
         data[inv.contractType].total += inv.adjustedPrice;
       }
    });

    return Object.entries(data).map(([key, val]) => ({
      type: key,
      ...val,
      average: val.count > 0 ? val.total / val.count : 0
    }));
  }, [filteredSales]);

  const formatAOA = (val: number) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(val);

  const handleExportCSV = () => {
    if (filteredSales.length === 0) { alert("Sem dados."); return; }
    const headers = ["Nº Factura", "Data", "Cliente", "Artigo", "Valor (AOA)"];
    const rows = filteredSales.map(inv => [inv.invoiceNumber, inv.date, inv.customerName, `${inv.productDetails?.brand} ${inv.productDetails?.model}`, inv.adjustedPrice]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `vendas_techimport_${new Date().toISOString().split('T')[0]}.csv`; link.click();
  };

  const exportBackup = () => {
    const data = { inventory: JSON.parse(localStorage.getItem(INV_KEY) || '[]'), invoices: JSON.parse(localStorage.getItem(BILL_KEY) || '[]'), receipts: JSON.parse(localStorage.getItem(REC_KEY) || '[]'), exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `backup_${Date.now()}.json`;
    link.click();
  };

  const importBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.inventory && data.invoices) {
          localStorage.setItem(INV_KEY, JSON.stringify(data.inventory));
          localStorage.setItem(BILL_KEY, JSON.stringify(data.invoices));
          if (data.receipts) localStorage.setItem(REC_KEY, JSON.stringify(data.receipts));
          window.location.reload();
        }
      } catch (err) { alert('Erro ao importar.'); }
    };
    reader.readAsText(file);
  };

  return (
    <div id="reports-container" className="space-y-6 md:space-y-8 pb-10 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 md:w-14 md:h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl"><BarChart3 className="w-6 h-6 md:w-8 md:h-8" /></div>
          <div><h2 className="text-xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter">Relatório</h2><p className="text-indigo-600 font-black text-[9px] md:text-[10px] uppercase tracking-widest flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Financeiro</p></div>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button onClick={() => window.print()} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black text-[10px] uppercase shadow-sm"><Printer className="w-4 h-4" /> PDF</button>
          <button onClick={exportBackup} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg"><Download className="w-4 h-4" /> Backup</button>
          <button onClick={() => fileInputRef.current?.click()} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-2xl font-black text-[10px] uppercase"><Upload className="w-4 h-4" /> Import</button>
          <input type="file" ref={fileInputRef} onChange={importBackup} className="hidden" accept=".json" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-slate-900 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="relative z-10">
            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase mb-2 tracking-[0.2em]">Faturação Bruta</p>
            <h3 className="text-3xl md:text-4xl font-[1000] tracking-tighter mb-4">{formatAOA(stats.totalRevenue)}</h3>
            <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full w-fit"><TrendingUp className="w-3 h-3 text-emerald-400" /><span className="text-[9px] font-black uppercase text-slate-300">Venda Total</span></div>
          </div>
        </div>
        <div className="bg-emerald-600 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="relative z-10">
            <p className="text-[9px] md:text-[10px] font-black text-emerald-100 uppercase mb-2 tracking-[0.2em]">Liquidez</p>
            <h3 className="text-3xl md:text-4xl font-[1000] tracking-tighter mb-4">{formatAOA(stats.totalPaid)}</h3>
            <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full w-fit"><Wallet className="w-3 h-3 text-white" /><span className="text-[9px] font-black uppercase text-white">Em Caixa</span></div>
          </div>
        </div>
        <div className="bg-rose-500 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="relative z-10">
            <p className="text-[9px] md:text-[10px] font-black text-rose-100 uppercase mb-2 tracking-[0.2em]">Pendente</p>
            <h3 className="text-3xl md:text-4xl font-[1000] tracking-tighter mb-4">{formatAOA(stats.totalDebt)}</h3>
            <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full w-fit"><AlertTriangle className="w-3 h-3 text-white" /><span className="text-[9px] font-black uppercase text-white">A Receber</span></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4"><div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600"><ShoppingBag className="w-5 h-5 md:w-6 md:h-6" /></div><div><p className="text-[9px] font-black text-slate-400 uppercase">Lucro Est.</p><h4 className="text-lg md:text-xl font-black text-indigo-600">{formatAOA(stats.totalProfit)}</h4></div></div>
        <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4"><div className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-600"><Database className="w-5 h-5 md:w-6 md:h-6" /></div><div><p className="text-[9px] font-black text-slate-400 uppercase">Investido</p><h4 className="text-lg md:text-xl font-black text-slate-900">{formatAOA(stats.stockValue)}</h4></div></div>
        <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4"><div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600"><Package className="w-5 h-5 md:w-6 md:h-6" /></div><div><p className="text-[9px] font-black text-slate-400 uppercase">Disponível</p><h4 className="text-lg md:text-xl font-black text-emerald-600">{stats.itemsAvailable} Uni.</h4></div></div>
      </div>

      <div className="space-y-4">
        <h3 className="font-black text-sm uppercase flex items-center gap-2 text-slate-400"><FileText className="w-4 h-4" /> Análise de Contratos</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {contractStats.map((stat, idx) => (
            <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
               <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl -mr-12 -mt-12 opacity-50 ${idx === 0 ? 'bg-indigo-200' : idx === 1 ? 'bg-amber-200' : 'bg-purple-200'}`}></div>
               <div className="relative z-10">
                 <p className="text-[9px] font-black uppercase text-slate-400 mb-1">{stat.type}</p>
                 <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-3xl font-[1000] text-slate-900">{stat.count}</span>
                    <span className="text-[10px] font-bold text-slate-400">contratos</span>
                 </div>
                 <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-600">
                      <span>Total</span>
                      <span>{formatAOA(stat.total)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                      <span>Média</span>
                      <span>{formatAOA(stat.average)}</span>
                    </div>
                 </div>
               </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-4 md:p-8 border-b bg-slate-50/50 flex flex-col gap-4">
          <div className="flex items-center gap-3"><Filter className="w-5 h-5 text-indigo-600" /><div><h3 className="font-black text-sm uppercase">Filtros</h3></div></div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-white p-1 rounded-xl border border-slate-200"><button onClick={() => setFilterType('invoiceDate')} className={`px-3 py-1.5 rounded-lg text-[8px] md:text-[9px] font-black uppercase transition-all ${filterType === 'invoiceDate' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>Emissão</button><button onClick={() => setFilterType('dueDate')} className={`px-3 py-1.5 rounded-lg text-[8px] md:text-[9px] font-black uppercase transition-all ${filterType === 'dueDate' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>Vencimento</button></div>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="p-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold outline-none" />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="p-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold outline-none" />
            <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase"><FileSpreadsheet className="w-3.5 h-3.5" /> CSV</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400"><tr><th className="p-4 md:p-6">Factura</th><th className="p-4 md:p-6">Cliente</th><th className="p-4 md:p-6">Artigo</th><th className="p-4 md:p-6 text-right">Valor</th><th className="p-4 md:p-6 text-center">Status</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.map(inv => {
                const totalPaidForInv = receipts.filter(r => r.invoiceTimestamp === inv.timestamp).reduce((acc, c) => acc + c.amount, 0);
                const isFullyPaid = totalPaidForInv >= inv.adjustedPrice;
                return (
                  <tr key={inv.timestamp} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 md:p-6"><div className="text-xs font-bold text-slate-900">#{inv.invoiceNumber}</div><div className="text-[9px] text-slate-400 uppercase">{inv.date}</div></td>
                    <td className="p-4 md:p-6 font-black text-slate-900 text-sm uppercase">{inv.customerName}</td>
                    <td className="p-4 md:p-6 text-[10px] font-bold uppercase text-slate-700">{inv.productDetails?.brand} {inv.productDetails?.model}</td>
                    <td className="p-4 md:p-6 text-right font-black text-slate-900">{formatAOA(inv.adjustedPrice)}</td>
                    <td className="p-4 md:p-6 text-center"><span className={`text-[8px] font-black px-2 py-1 rounded-full ${isFullyPaid ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>{isFullyPaid ? 'LIQUIDADO' : 'PENDENTE'}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredSales.length === 0 && <div className="p-10 text-center flex flex-col items-center gap-4 text-slate-300"><History className="w-10 h-10 opacity-20" /><p className="text-xs font-black uppercase tracking-widest">Sem registos</p></div>}
        </div>
      </div>
    </div>
  );
};

export default ReportsSystem;