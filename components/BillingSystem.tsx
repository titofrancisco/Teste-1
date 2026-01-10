
import React, { useState, useEffect, useMemo } from 'react';
import { Invoice, ContractType, InventoryItem } from '../types';
import { 
  ReceiptText, 
  Trash2, 
  Printer, 
  X, 
  ArrowRightCircle,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

const BillingSystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'record' | 'consult'>('record');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [proformaToFinalize, setProformaToFinalize] = useState<Invoice | null>(null);
  const [showConfirmIssue, setShowConfirmIssue] = useState(false);

  // Syncing with InventorySystem.tsx v4 key
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

  const availableProducts = useMemo(() => {
    return inventory.filter(item => !item.isSold);
  }, [inventory]);

  const [formData, setFormData] = useState({
    customerName: '',
    idNumber: '',
    phoneNumber: '',
    productTimestamp: 0,
    contractType: ContractType.ORDER,
    sellingPrice: 0,
    isFinal: false
  });

  const cleanOtherProformas = (allInvoices: Invoice[], prodId: number, currentDocId: number) => {
    return allInvoices.filter(inv => 
      inv.productTimestamp !== prodId || inv.isFinal || inv.timestamp === currentDocId
    );
  };

  const executeIssue = () => {
    const product = inventory.find(p => p.timestamp === formData.productTimestamp);
    const adjPrice = formData.sellingPrice * (formData.contractType === ContractType.TWO_INSTALLMENTS ? 1.07 : formData.contractType === ContractType.THREE_INSTALLMENTS ? 1.15 : 1);
    
    const newInvoice: Invoice = {
      id: invoices.length + 1,
      invoiceNumber: invoices.length + 1,
      ...formData,
      productDetails: product || {},
      adjustedPrice: adjPrice,
      installments: [],
      date: new Date().toLocaleDateString('pt-PT'),
      timestamp: Date.now()
    };

    let updatedInvoices = [newInvoice, ...invoices];
    let updatedInventory = [...inventory];

    if (formData.isFinal) {
      updatedInventory = inventory.map(p => p.timestamp === formData.productTimestamp ? { ...p, isSold: true } : p);
      updatedInvoices = cleanOtherProformas(updatedInvoices, formData.productTimestamp, newInvoice.timestamp);
    }

    setInvoices(updatedInvoices);
    setInventory(updatedInventory);
    localStorage.setItem(BILL_KEY, JSON.stringify(updatedInvoices));
    localStorage.setItem(INV_KEY, JSON.stringify(updatedInventory));
    
    setFormData({ customerName: '', idNumber: '', phoneNumber: '', productTimestamp: 0, contractType: ContractType.ORDER, sellingPrice: 0, isFinal: false });
    setShowConfirmIssue(false);
    setActiveTab('consult');
    window.dispatchEvent(new Event('storage'));
  };

  const finalizeProforma = () => {
    if (!proformaToFinalize) return;

    const updatedInvoices = cleanOtherProformas(
      invoices.map(inv => inv.timestamp === proformaToFinalize.timestamp ? { ...inv, isFinal: true } : inv),
      proformaToFinalize.productTimestamp,
      proformaToFinalize.timestamp
    );

    const updatedInventory = inventory.map(p => 
      p.timestamp === proformaToFinalize.productTimestamp ? { ...p, isSold: true } : p
    );

    setInvoices(updatedInvoices);
    setInventory(updatedInventory);
    localStorage.setItem(BILL_KEY, JSON.stringify(updatedInvoices));
    localStorage.setItem(INV_KEY, JSON.stringify(updatedInventory));
    setProformaToFinalize(null);
    window.dispatchEvent(new Event('storage'));
  };

  const handlePrint = () => {
    window.print();
  };

  const formatAOA = (val: number) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(val);

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden min-h-[600px]">
      <div className="flex border-b border-slate-200 bg-slate-50 print:hidden">
        <button onClick={() => setActiveTab('record')} className={`flex-1 py-5 font-bold text-xs tracking-widest transition-all ${activeTab === 'record' ? 'bg-white text-emerald-600 border-b-4 border-emerald-600' : 'text-slate-500 hover:bg-slate-100'}`}>EMITIR DOCUMENTO</button>
        <button onClick={() => setActiveTab('consult')} className={`flex-1 py-5 font-bold text-xs tracking-widest transition-all ${activeTab === 'consult' ? 'bg-white text-emerald-600 border-b-4 border-emerald-600' : 'text-slate-500 hover:bg-slate-100'}`}>CONSULTAR LISTA</button>
      </div>

      <div className="p-6 md:p-10">
        {activeTab === 'record' ? (
          <form onSubmit={e => { e.preventDefault(); setShowConfirmIssue(true); }} className="space-y-6 animate-fadeIn print:hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input type="text" placeholder="Nome do Cliente" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" />
              <input type="text" placeholder="B.I. (14 Caracteres)" maxLength={14} value={formData.idNumber} onChange={e => setFormData({...formData, idNumber: e.target.value.toUpperCase()})} required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono" />
              <select value={formData.productTimestamp} onChange={e => setFormData({...formData, productTimestamp: Number(e.target.value)})} required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <option value={0}>Selecione Artigo em Stock...</option>
                {availableProducts.map(p => <option key={p.timestamp} value={p.timestamp}>{p.brand} {p.model} - {p.storage}</option>)}
              </select>
              <input type="number" placeholder="Preço Base (Kz)" value={formData.sellingPrice || ''} onChange={e => setFormData({...formData, sellingPrice: Number(e.target.value)})} required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
            </div>
            <div className="flex gap-4 p-2 bg-slate-100 rounded-2xl">
              <button type="button" onClick={() => setFormData({...formData, isFinal: false})} className={`flex-1 py-3 rounded-xl font-bold text-xs ${!formData.isFinal ? 'bg-white shadow-sm' : 'text-slate-400'}`}>PROFORMA</button>
              <button type="button" onClick={() => setFormData({...formData, isFinal: true})} className={`flex-1 py-3 rounded-xl font-bold text-xs ${formData.isFinal ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400'}`}>FACTURA FINAL</button>
            </div>
            <button type="submit" className="w-full p-5 bg-slate-900 text-white rounded-2xl font-black">GERAR DOCUMENTO</button>
          </form>
        ) : (
          <div className="animate-fadeIn">
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left">
                <thead className="bg-slate-900 text-[10px] font-black uppercase text-slate-400">
                  <tr><th className="p-4">Nº Doc</th><th className="p-4">Tipo</th><th className="p-4">Cliente</th><th className="p-4 text-right">Ações</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map(inv => (
                    <tr key={inv.timestamp} className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-sm">#{inv.invoiceNumber}</td>
                      <td className="p-4"><span className={`text-[9px] font-black px-2 py-1 rounded-full ${inv.isFinal ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'}`}>{inv.isFinal ? 'FINAL' : 'PROFORMA'}</span></td>
                      <td className="p-4 font-bold text-slate-900 text-sm">{inv.customerName}</td>
                      <td className="p-4 flex justify-end gap-2">
                        <button onClick={() => setSelectedInvoice(inv)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"><Printer className="w-4 h-4" /></button>
                        {!inv.isFinal && <button onClick={() => setProformaToFinalize(inv)} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"><ArrowRightCircle className="w-4 h-4" /></button>}
                        <button onClick={() => { if(confirm('Anular documento?')) { const updated = invoices.filter(i => i.timestamp !== inv.timestamp); setInvoices(updated); localStorage.setItem(BILL_KEY, JSON.stringify(updated)); }}} className="p-2 bg-red-50 text-red-600 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {selectedInvoice && (
        <div className="fixed inset-0 bg-white md:bg-slate-900/90 z-[1000] flex items-start justify-center overflow-y-auto p-0 md:p-10">
          <div className="absolute top-4 right-4 print:hidden z-[1001] flex gap-2">
            <button onClick={handlePrint} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black shadow-xl flex items-center gap-2">
              <Printer className="w-5 h-5" /> IMPRIMIR PDF
            </button>
            <button onClick={() => setSelectedInvoice(null)} className="bg-red-600 text-white p-3 rounded-xl shadow-xl">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div id="invoice-to-print" className="bg-white w-full max-w-4xl min-h-screen p-10 md:p-20 shadow-2xl print:shadow-none print:m-0 print:p-8">
             <div className="flex justify-between items-center border-b-8 border-slate-900 pb-10 mb-10">
               <div>
                 <h1 className="text-4xl font-black uppercase tracking-tighter">Import Angola Pro</h1>
                 <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Gestão de Importações e Vendas</p>
               </div>
               <div className="text-right">
                 <h2 className={`text-3xl font-black uppercase ${selectedInvoice.isFinal ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {selectedInvoice.isFinal ? 'Factura Final' : 'Factura Proforma'}
                 </h2>
                 <p className="text-sm font-black uppercase">Nº DOC: {selectedInvoice.invoiceNumber}</p>
               </div>
             </div>
             
             <div className="grid grid-cols-2 gap-20 mb-10">
               <div>
                 <h4 className="text-[10px] font-black text-slate-400 uppercase border-b pb-1 mb-2">Cliente</h4>
                 <p className="text-xl font-black">{selectedInvoice.customerName}</p>
                 <p className="text-sm">BI: {selectedInvoice.idNumber}</p>
                 <p className="text-sm">Tel: {selectedInvoice.phoneNumber}</p>
               </div>
               <div className="text-right">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase border-b pb-1 mb-2">Artigo</h4>
                 <p className="text-xl font-black">{selectedInvoice.productDetails?.brand} {selectedInvoice.productDetails?.model}</p>
                 <p className="text-sm uppercase">{selectedInvoice.productDetails?.storage} • {selectedInvoice.productDetails?.color}</p>
                 <p className="text-sm font-bold mt-2">Data: {selectedInvoice.date}</p>
               </div>
             </div>

             <div className="mt-20 pt-10 border-t-4 border-slate-900 flex justify-between items-end">
               <div>
                 <p className="text-[10px] font-black uppercase text-slate-400">Modalidade de Pagamento</p>
                 <p className="text-lg font-black uppercase">{selectedInvoice.contractType}</p>
               </div>
               <div className="text-right">
                 <p className="text-sm font-bold uppercase text-slate-400">Total Geral do Documento</p>
                 <p className="text-4xl font-black">{formatAOA(selectedInvoice.adjustedPrice)}</p>
               </div>
             </div>

             <div className="mt-32 grid grid-cols-2 gap-40 text-center">
               <div className="border-t-2 border-slate-900 pt-4 font-black uppercase text-xs">Assinatura Cliente</div>
               <div className="border-t-2 border-slate-900 pt-4 font-black uppercase text-xs">Import Angola Pro</div>
             </div>
          </div>
        </div>
      )}

      {proformaToFinalize && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[500] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 text-center shadow-2xl">
             <ShieldCheck className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
             <h3 className="text-xl font-black uppercase mb-2">Finalizar Venda?</h3>
             <p className="text-slate-500 text-sm mb-6">Ao finalizar, o stock será bloqueado e todas as outras proformas deste produto serão eliminadas automaticamente.</p>
             <div className="flex flex-col gap-2">
               <button onClick={finalizeProforma} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black">CONFIRMAR E LIMPAR STOCK</button>
               <button onClick={() => setProformaToFinalize(null)} className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold">CANCELAR</button>
             </div>
          </div>
        </div>
      )}

      {showConfirmIssue && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[500] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 text-center shadow-2xl">
             <AlertCircle className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
             <h3 className="text-xl font-black uppercase mb-2">{formData.isFinal ? 'Emitir Factura Final?' : 'Guardar Proforma?'}</h3>
             <div className="flex flex-col gap-2">
               <button onClick={executeIssue} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black">CONFIRMAR</button>
               <button onClick={() => setShowConfirmIssue(false)} className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold">REVISAR</button>
             </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #invoice-to-print, #invoice-to-print * { visibility: visible !important; }
          #invoice-to-print { 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100% !important; 
            margin: 0 !important; 
            padding: 40px !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default BillingSystem;
