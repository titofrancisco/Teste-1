
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Invoice, InventoryItem, ContractType, PaymentReceipt } from '../types';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  DollarSign, 
  Package, 
  ShoppingBag, 
  Printer, 
  ArrowUpRight,
  History,
  Info,
  FileText,
  Download,
  Upload,
  Database,
  Calendar,
  Filter,
  FileSpreadsheet,
  Clock,
  ChevronDown,
  ArrowDownCircle,
  AlertTriangle,
  CheckCircle2,
  // Fix: Added missing ShieldCheck import
  ShieldCheck
} from 'lucide-react';

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
      const dateToCompareStr = filterType === 'invoiceDate' 
        ? inv.date 
        : getFinalDueDate(inv.date, inv.contractType);
      
      const compareDate = parseDate(dateToCompareStr);
      return (!start || compareDate >= start) && (!end || compareDate <= end);
    });
  }, [invoices, startDate, endDate, filterType]);

  const stats = useMemo(() => {
    const finalInvoices = invoices.filter(i => i.isFinal);
    const totalRevenue = finalInvoices.reduce((acc, curr) => acc + curr.adjustedPrice, 0);
    const totalCostSold = finalInvoices.reduce((acc, curr) => acc + (curr.productDetails?.totalCost || 0), 0);
    const totalProfit = totalRevenue - totalCostSold;
    
    // Novo cálculo: Valor Pago baseado nos recibos
    const totalPaid = receipts.reduce((acc, curr) => acc + curr.amount, 0);
    const totalDebt = Math.max(0, totalRevenue - totalPaid);
    
    const stockValue = inventory.filter(i => !i.isSold).reduce((acc, curr) => acc + curr.totalCost, 0);
    const itemsAvailable = inventory.filter(i => !i.isSold).length;

    return { totalRevenue, totalProfit, totalPaid, totalDebt, stockValue, itemsAvailable };
  }, [invoices, inventory, receipts]);

  const formatAOA = (val: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(val);
  };

  const handleExportCSV = () => {
    if (filteredSales.length === 0) {
      alert("Não há dados para exportar.");
      return;
    }
    const headers = ["Nº Factura", "Data", "Cliente", "Artigo", "Valor (AOA)"];
    const rows = filteredSales.map(inv => [
      inv.invoiceNumber,
      inv.date,
      inv.customerName,
      `${inv.productDetails?.brand} ${inv.productDetails?.model}`,
      inv.adjustedPrice
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vendas_techimport_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportBackup = () => {
    const data = {
      inventory: JSON.parse(localStorage.getItem(INV_KEY) || '[]'),
      invoices: JSON.parse(localStorage.getItem(BILL_KEY) || '[]'),
      receipts: JSON.parse(localStorage.getItem(REC_KEY) || '[]'),
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `backup_techimport_${Date.now()}.json`;
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
    <div id="reports-container" className="space-y-8 pb-10 print:p-8 print:bg-white animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
             <BarChart3 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Gestão Executiva</h2>
            <p className="text-indigo-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Tech Import Angola • Auditoria Financeira
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black text-[10px] uppercase shadow-sm hover:shadow-md transition-all"><Printer className="w-4 h-4" /> PDF</button>
          <button onClick={exportBackup} className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase hover:bg-black transition-all shadow-lg"><Download className="w-4 h-4" /> Exportar Backup</button>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-5 py-3 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-2xl font-black text-[10px] uppercase hover:bg-indigo-100 transition-all"><Upload className="w-4 h-4" /> Importar</button>
          <input type="file" ref={fileInputRef} onChange={importBackup} className="hidden" accept=".json" />
        </div>
      </div>

      {/* Grid Principal de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-[0.2em]">Faturação Total (Avenças)</p>
          <h3 className="text-4xl font-[1000] tracking-tighter mb-4">{formatAOA(stats.totalRevenue)}</h3>
          <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full w-fit">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span className="text-[9px] font-black uppercase text-slate-300">Volume Total de Vendas</span>
          </div>
        </div>

        <div className="bg-emerald-600 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <p className="text-[10px] font-black text-emerald-100 uppercase mb-2 tracking-[0.2em]">Valor Recebido (Liquidez)</p>
          <h3 className="text-4xl font-[1000] tracking-tighter mb-4">{formatAOA(stats.totalPaid)}</h3>
          <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full w-fit">
            <CheckCircle2 className="w-3 h-3 text-white" />
            <span className="text-[9px] font-black uppercase text-white">Total em Caixa</span>
          </div>
        </div>

        <div className="bg-amber-500 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <p className="text-[10px] font-black text-amber-100 uppercase mb-2 tracking-[0.2em]">Valor em Dívida (A receber)</p>
          <h3 className="text-4xl font-[1000] tracking-tighter mb-4">{formatAOA(stats.totalDebt)}</h3>
          <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full w-fit">
            <AlertTriangle className="w-3 h-3 text-white" />
            <span className="text-[9px] font-black uppercase text-white">Prestações Pendentes</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
             <ShoppingBag className="w-6 h-6" />
           </div>
           <div>
             <p className="text-[10px] font-black text-slate-400 uppercase">Lucro Bruto Estimado</p>
             <h4 className="text-xl font-black text-indigo-600">{formatAOA(stats.totalProfit)}</h4>
           </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-600">
             <Database className="w-6 h-6" />
           </div>
           <div>
             <p className="text-[10px] font-black text-slate-400 uppercase">Investimento em Stock</p>
             <h4 className="text-xl font-black text-slate-900">{formatAOA(stats.stockValue)}</h4>
           </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
             <Package className="w-6 h-6" />
           </div>
           <div>
             <p className="text-[10px] font-black text-slate-400 uppercase">Unidades no Inventário</p>
             <h4 className="text-xl font-black text-emerald-600">{stats.itemsAvailable} Uni.</h4>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-8 border-b bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 print:hidden">
          <div className="flex items-center gap-3">
            <Filter className="w-6 h-6 text-indigo-600" />
            <div>
              <h3 className="font-black text-sm uppercase">Filtragem de Dados</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Ajuste o período para análise específica</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex bg-white p-1 rounded-xl border border-slate-200">
               <button onClick={() => setFilterType('invoiceDate')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${filterType === 'invoiceDate' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>Emissão</button>
               <button onClick={() => setFilterType('dueDate')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${filterType === 'dueDate' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>Vencimento</button>
            </div>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="p-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="p-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
            <button onClick={handleExportCSV} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all"><FileSpreadsheet className="w-4 h-4" /> Exportar CSV</button>
          </div>
        </div>

        <div className="p-8 flex items-center justify-between border-b">
           <div className="flex items-center gap-3">
              <ShoppingBag className="w-6 h-6 text-rose-600" />
              <h3 className="font-black text-sm uppercase tracking-widest">Listagem Geral de Facturação ({filteredSales.length})</h3>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
              <tr><th className="p-6">Factura</th><th className="p-6">Cliente</th><th className="p-6">Artigo</th><th className="p-6 text-right">Valor Final</th><th className="p-6 text-center">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.map(inv => {
                const isFullyPaid = receipts.filter(r => r.invoiceTimestamp === inv.timestamp).reduce((acc, c) => acc + c.amount, 0) >= inv.adjustedPrice;
                return (
                  <tr key={inv.timestamp} className="hover:bg-slate-50 transition-colors">
                    <td className="p-6"><div className="text-xs font-bold text-slate-900">#{inv.invoiceNumber}</div><div className="text-[9px] text-slate-400 uppercase">{inv.date}</div></td>
                    <td className="p-6 font-black text-slate-900 text-sm uppercase">{inv.customerName}</td>
                    <td className="p-6"><div className="text-[10px] font-bold uppercase text-slate-700">{inv.productDetails?.brand} {inv.productDetails?.model}</div></td>
                    <td className="p-6 text-right font-black text-slate-900">{formatAOA(inv.adjustedPrice)}</td>
                    <td className="p-6 text-center">
                       <span className={`text-[8px] font-black px-2 py-1 rounded-full ${isFullyPaid ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                         {isFullyPaid ? 'LIQUIDADO' : 'PENDENTE'}
                       </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredSales.length === 0 && (
            <div className="p-20 text-center flex flex-col items-center gap-4 text-slate-300">
               <History className="w-12 h-12 opacity-20" />
               <p className="text-xs font-black uppercase tracking-widest">Sem registos no período selecionado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsSystem;
