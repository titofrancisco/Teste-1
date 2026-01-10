
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Invoice, InventoryItem, ContractType } from '../types';
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
  Clock
} from 'lucide-react';

const ReportsSystem: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [filterType, setFilterType] = useState<'invoiceDate' | 'dueDate'>('invoiceDate');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const INV_KEY = 'angola_inv_v4';
  const BILL_KEY = 'angola_invoices_final_v1';

  useEffect(() => {
    const load = () => {
      const savedInvoices = localStorage.getItem(BILL_KEY);
      const savedInventory = localStorage.getItem(INV_KEY);
      if (savedInvoices) setInvoices(JSON.parse(savedInvoices));
      if (savedInventory) setInventory(JSON.parse(savedInventory));
    };
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, []);

  // Helpers de Data
  const parseDate = (dStr: string) => {
    const [d, m, y] = dStr.split('/').map(Number);
    return new Date(y, m - 1, d);
  };

  const addDays = (dateStr: string, days: number) => {
    const [day, month, year] = dateStr.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString('pt-PT');
  };

  const getFinalDueDate = (dateStr: string, type: ContractType) => {
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
    const stockValue = inventory.filter(i => !i.isSold).reduce((acc, curr) => acc + curr.totalCost, 0);
    const itemsAvailable = inventory.filter(i => !i.isSold).length;

    const contractDist = {
      [ContractType.ORDER]: finalInvoices.filter(i => i.contractType === ContractType.ORDER).length,
      [ContractType.TWO_INSTALLMENTS]: finalInvoices.filter(i => i.contractType === ContractType.TWO_INSTALLMENTS).length,
      [ContractType.THREE_INSTALLMENTS]: finalInvoices.filter(i => i.contractType === ContractType.THREE_INSTALLMENTS).length,
    };

    const brandSales: Record<string, number> = {};
    finalInvoices.forEach(inv => {
      const brand = inv.productDetails?.brand || 'Desconhecido';
      brandSales[brand] = (brandSales[brand] || 0) + 1;
    });

    const topBrands = Object.entries(brandSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { totalRevenue, totalProfit, stockValue, itemsAvailable, contractDist, topBrands };
  }, [invoices, inventory]);

  const formatAOA = (val: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(val);
  };

  const handleExportCSV = () => {
    if (filteredSales.length === 0) {
      alert("Não há dados para exportar no período selecionado.");
      return;
    }

    const headers = ["Nº Factura", "Data Factura", "Vencimento Final", "Cliente", "BI", "Artigo", "Modalidade", "Valor (AOA)"];
    const rows = filteredSales.map(inv => [
      inv.invoiceNumber,
      inv.date,
      getFinalDueDate(inv.date, inv.contractType),
      inv.customerName,
      inv.idNumber,
      `${inv.productDetails?.brand} ${inv.productDetails?.model}`,
      inv.contractType,
      inv.adjustedPrice
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `vendas_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportBackup = () => {
    const data = {
      inventory: JSON.parse(localStorage.getItem(INV_KEY) || '[]'),
      invoices: JSON.parse(localStorage.getItem(BILL_KEY) || '[]'),
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `backup_import_angola_${Date.now()}.json`;
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
          window.location.reload();
        }
      } catch (err) { alert('Erro ao importar backup.'); }
    };
    reader.readAsText(file);
  };

  return (
    <div id="reports-container" className="space-y-8 pb-10 print:p-8 print:bg-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Painel Executivo</h2>
          <p className="text-slate-500 font-medium">Análise de Performance e Gestão.</p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-3 bg-slate-100 text-slate-900 rounded-2xl font-black text-[10px] uppercase"><Printer className="w-4 h-4" /> PDF</button>
          <button onClick={exportBackup} className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase"><Download className="w-4 h-4" /> Backup</button>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase"><Upload className="w-4 h-4" /> Importar</button>
          <input type="file" ref={fileInputRef} onChange={importBackup} className="hidden" accept=".json" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print:grid-cols-2">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Faturação Total</p>
          <h3 className="text-2xl font-black text-slate-900">{formatAOA(stats.totalRevenue)}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Lucro Estimado</p>
          <h3 className="text-2xl font-black text-indigo-600">{formatAOA(stats.totalProfit)}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Stock em Mão</p>
          <h3 className="text-2xl font-black text-slate-900">{formatAOA(stats.stockValue)}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Itens Disponíveis</p>
          <h3 className="text-2xl font-black text-emerald-600">{stats.itemsAvailable} Uni.</h3>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 print:hidden">
          <div className="flex items-center gap-3">
            <Filter className="w-6 h-6 text-indigo-600" />
            <div>
              <h3 className="font-black text-sm uppercase">Filtros de Vendas</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Exportação e Consulta por Período</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black uppercase text-slate-400">Filtrar por</label>
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value as any)}
                className="p-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold outline-none"
              >
                <option value="invoiceDate">Data da Factura</option>
                <option value="dueDate">Data de Vencimento</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black uppercase text-slate-400">Início</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="p-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black uppercase text-slate-400">Fim</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="p-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold" />
            </div>
            <div className="flex items-end self-end">
              <button 
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all"
              >
                <FileSpreadsheet className="w-4 h-4" /> Exportar CSV
              </button>
            </div>
          </div>
        </div>

        <div className="p-8 flex items-center gap-3 border-b">
           <ShoppingBag className="w-6 h-6 text-rose-600" />
           <h3 className="font-black text-sm uppercase">Histórico de Vendas ({filteredSales.length})</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
              <tr>
                <th className="p-6">Factura</th>
                <th className="p-6">Vencimento Final</th>
                <th className="p-6">Cliente</th>
                <th className="p-6">Artigo</th>
                <th className="p-6 text-right">Valor Final</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredSales.map(inv => (
                <tr key={inv.timestamp} className="hover:bg-slate-50 transition-colors">
                  <td className="p-6">
                    <div className="text-xs font-bold">#{inv.invoiceNumber}</div>
                    <div className="text-[9px] text-slate-400">{inv.date}</div>
                  </td>
                  <td className="p-6">
                    <div className="text-[10px] font-black text-indigo-600 flex items-center gap-1">
                       <Clock className="w-3 h-3" /> {getFinalDueDate(inv.date, inv.contractType)}
                    </div>
                  </td>
                  <td className="p-6 font-black text-slate-900 text-sm uppercase">{inv.customerName}</td>
                  <td className="p-6">
                    <div className="text-[10px] font-bold uppercase">{inv.productDetails?.brand} {inv.productDetails?.model}</div>
                    <div className="text-[9px] text-slate-400">{inv.contractType}</div>
                  </td>
                  <td className="p-6 text-right font-black text-emerald-600">{formatAOA(inv.adjustedPrice)}</td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr><td colSpan={5} className="p-20 text-center text-slate-300 font-bold uppercase text-xs tracking-widest">Nenhuma venda encontrada para o período selecionado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #reports-container, #reports-container * { visibility: visible !important; }
          #reports-container { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; margin: 0 !important; }
          .print\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default ReportsSystem;
