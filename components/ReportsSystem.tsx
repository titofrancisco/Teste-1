
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
  AlertTriangle
} from 'lucide-react';

const ReportsSystem: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chaves persistentes (v4)
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

  const stats = useMemo(() => {
    const finalInvoices = invoices.filter(i => i.isFinal);
    const proformas = invoices.filter(i => !i.isFinal);
    
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

    return {
      totalRevenue,
      totalProfit,
      totalProforma: proformas.reduce((acc, curr) => acc + curr.adjustedPrice, 0),
      stockValue,
      itemsAvailable,
      contractDist,
      topBrands
    };
  }, [invoices, inventory]);

  const formatAOA = (val: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(val);
  };

  const getPercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  const handlePrint = () => {
    window.print();
  };

  // Funções de Backup e Restauro
  const exportBackup = () => {
    const data = {
      inventory: JSON.parse(localStorage.getItem(INV_KEY) || '[]'),
      invoices: JSON.parse(localStorage.getItem(BILL_KEY) || '[]'),
      exportDate: new Date().toISOString(),
      version: '4.0'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_import_angola_${new Date().toLocaleDateString('pt-PT').replace(/\//g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.inventory && data.invoices) {
          if (confirm('Aviso: Isso irá substituir todos os dados actuais pelos do ficheiro de backup. Continuar?')) {
            localStorage.setItem(INV_KEY, JSON.stringify(data.inventory));
            localStorage.setItem(BILL_KEY, JSON.stringify(data.invoices));
            window.location.reload(); // Recarregar para aplicar mudanças
          }
        } else {
          alert('Ficheiro de backup inválido.');
        }
      } catch (err) {
        alert('Erro ao ler o ficheiro de backup.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div id="reports-container" className="space-y-8 pb-10 print:p-8 print:bg-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Painel Executivo</h2>
          <p className="text-slate-500 font-medium">Performance Financeira e Gestão de Stock.</p>
        </div>
        <div className="flex gap-2 print:hidden">
           <button 
            onClick={handlePrint} 
            className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-900 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-200 transition-all"
          >
            <Printer className="w-4 h-4" /> PDF
          </button>
          <button 
            onClick={exportBackup} 
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
          >
            <Download className="w-4 h-4" /> Exportar Backup
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-50 transition-all"
          >
            <Upload className="w-4 h-4" /> Importar
          </button>
          <input type="file" ref={fileInputRef} onChange={importBackup} className="hidden" accept=".json" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print:grid-cols-2">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm print:shadow-none">
          <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4 print:hidden">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Faturação Total</p>
          <h3 className="text-2xl font-black text-slate-900">{formatAOA(stats.totalRevenue)}</h3>
          <div className="mt-2 text-[10px] font-bold text-emerald-600 uppercase flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> Receita Líquida
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm print:shadow-none">
          <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4 print:hidden">
            <DollarSign className="w-6 h-6 text-indigo-600" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Lucro Operacional</p>
          <h3 className="text-2xl font-black text-indigo-600">{formatAOA(stats.totalProfit)}</h3>
          <div className="mt-2 text-[10px] font-bold text-indigo-400 uppercase flex items-center gap-1">
            <History className="w-3 h-3" /> Margem Bruta
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm print:shadow-none">
          <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mb-4 print:hidden">
            <Package className="w-6 h-6 text-amber-600" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Valor em Stock</p>
          <h3 className="text-2xl font-black text-slate-900">{formatAOA(stats.stockValue)}</h3>
          <div className="mt-2 text-[10px] font-bold text-amber-600 uppercase flex items-center gap-1">
            <Info className="w-3 h-3" /> {stats.itemsAvailable} Artigos Livres
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm print:shadow-none">
          <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center mb-4 print:hidden">
            <FileText className="w-6 h-6 text-rose-600" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Cotações (Proforma)</p>
          <h3 className="text-2xl font-black text-slate-900">{formatAOA(stats.totalProforma)}</h3>
          <div className="mt-2 text-[10px] font-bold text-rose-400 uppercase">Potencial de Venda</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:grid-cols-1">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm print:shadow-none">
          <div className="flex items-center gap-3 mb-8">
            <PieChart className="w-6 h-6 text-indigo-600" />
            <h3 className="font-black text-sm uppercase">Distribuição de Contratos</h3>
          </div>
          <div className="space-y-6">
            {Object.entries(stats.contractDist).map(([type, count]) => {
              const perc = getPercentage(count as number, invoices.filter(i => i.isFinal).length);
              return (
                <div key={type}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-600 uppercase">{type}</span>
                    <span className="text-xs font-black text-slate-900">{perc}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600" style={{ width: `${perc}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm print:shadow-none">
          <div className="flex items-center gap-3 mb-8">
            <BarChart3 className="w-6 h-6 text-emerald-600" />
            <h3 className="font-black text-sm uppercase">Marcas Mais Vendidas</h3>
          </div>
          <div className="space-y-4">
            {stats.topBrands.map(([brand, sales], i) => (
              <div key={brand} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border">
                <span className="font-black text-slate-900 uppercase text-sm">{i+1}. {brand}</span>
                <span className="font-black text-emerald-600 text-sm">{sales} Uni.</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden print:shadow-none">
        <div className="p-8 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-rose-600" />
            <h3 className="font-black text-sm uppercase">Histórico de Vendas Recentes</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
              <tr><th className="p-6">Data</th><th className="p-6">Cliente</th><th className="p-6">Artigo</th><th className="p-6 text-right">Valor Final</th></tr>
            </thead>
            <tbody className="divide-y">
              {invoices.filter(i => i.isFinal).slice(0, 10).map(inv => (
                <tr key={inv.timestamp}>
                  <td className="p-6 text-xs font-bold">{inv.date}</td>
                  <td className="p-6 font-black text-slate-900 text-sm uppercase">{inv.customerName}</td>
                  <td className="p-6 text-xs font-bold uppercase">{inv.productDetails?.brand} {inv.productDetails?.model}</td>
                  <td className="p-6 text-right font-black text-emerald-600">{formatAOA(inv.adjustedPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-amber-50 rounded-3xl p-8 border border-amber-200 print:hidden">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0">
            <Database className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h4 className="font-black text-slate-900 uppercase text-sm mb-2">Dica de Segurança</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Para garantir que os seus dados estão seguros mesmo se o navegador for limpo ou o dispositivo trocado, utilize o botão <strong>Exportar Backup</strong> semanalmente. Guarde o ficheiro JSON num local seguro (Google Drive, Pen Drive, etc.).
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #reports-container, #reports-container * { visibility: visible !important; }
          #reports-container { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; margin: 0 !important; }
          .print\:hidden { display: none !important; }
          .rounded-3xl { border-radius: 0 !important; border: 1px solid #e2e8f0 !important; }
          .bg-white { background: white !important; }
        }
      `}</style>
    </div>
  );
};

export default ReportsSystem;
