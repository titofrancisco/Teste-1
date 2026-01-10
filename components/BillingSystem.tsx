
import React, { useState, useEffect, useMemo } from 'react';
import { Invoice, ContractType, InventoryItem } from '../types';
import { 
  ReceiptText, 
  Trash2, 
  Printer, 
  X, 
  ArrowRightCircle,
  ShieldCheck,
  AlertCircle,
  Phone,
  TicketPercent,
  Calculator,
  Calendar,
  Edit2
} from 'lucide-react';

const BillingSystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'record' | 'consult'>('record');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [proformaToFinalize, setProformaToFinalize] = useState<Invoice | null>(null);
  const [showConfirmIssue, setShowConfirmIssue] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

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
    // Se estiver editando, o produto da fatura atual deve aparecer como disponível na lista para seleção
    return inventory.filter(item => !item.isSold || (editingInvoice && item.timestamp === editingInvoice.productTimestamp));
  }, [inventory, editingInvoice]);

  const [formData, setFormData] = useState({
    customerName: '',
    idNumber: '',
    phoneNumber: '',
    productTimestamp: 0,
    contractType: ContractType.ORDER,
    sellingPrice: 0,
    discount: 0,
    isFinal: false
  });

  const formatPhone = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})$/);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;
    return cleaned.slice(0, 9);
  };

  const commercialSummary = useMemo(() => {
    const base = formData.sellingPrice;
    let multiplier = 1;
    if (formData.contractType === ContractType.TWO_INSTALLMENTS) multiplier = 1.07;
    if (formData.contractType === ContractType.THREE_INSTALLMENTS) multiplier = 1.15;

    const priceWithContract = base * multiplier;
    const totalToPay = Math.max(0, priceWithContract - formData.discount);

    let initial = 0, p1 = 0, p2 = 0, final = 0;

    if (formData.contractType === ContractType.ORDER) {
      initial = totalToPay * 0.8;
      final = totalToPay * 0.2;
    } else if (formData.contractType === ContractType.TWO_INSTALLMENTS) {
      initial = totalToPay * 0.2;
      p1 = totalToPay * 0.4;
      final = totalToPay * 0.4;
    } else if (formData.contractType === ContractType.THREE_INSTALLMENTS) {
      initial = totalToPay * 0.25;
      p1 = totalToPay * 0.25;
      p2 = totalToPay * 0.25;
      final = totalToPay * 0.25;
    }

    return { totalToPay, initial, p1, p2, final };
  }, [formData.sellingPrice, formData.contractType, formData.discount]);

  const cleanOtherProformas = (allInvoices: Invoice[], prodId: number, currentDocId: number) => {
    return allInvoices.filter(inv => 
      inv.productTimestamp !== prodId || inv.isFinal || inv.timestamp === currentDocId
    );
  };

  const executeIssue = () => {
    const product = inventory.find(p => p.timestamp === formData.productTimestamp);
    
    let updatedInvoices = [...invoices];
    let updatedInventory = [...inventory];

    if (editingInvoice) {
      // Caso de Edição
      updatedInvoices = invoices.map(inv => {
        if (inv.timestamp === editingInvoice.timestamp) {
          return {
            ...inv,
            ...formData,
            productDetails: product || {},
            adjustedPrice: commercialSummary.totalToPay
          };
        }
        return inv;
      });

      // Se mudou o estado de final ou o produto, precisamos atualizar o stock
      if (formData.isFinal) {
        updatedInventory = inventory.map(p => p.timestamp === formData.productTimestamp ? { ...p, isSold: true } : p);
        updatedInvoices = cleanOtherProformas(updatedInvoices, formData.productTimestamp, editingInvoice.timestamp);
      }
    } else {
      // Caso de Novo Registo
      const newInvoice: Invoice = {
        id: invoices.length + 1,
        invoiceNumber: invoices.length + 1,
        ...formData,
        productDetails: product || {},
        adjustedPrice: commercialSummary.totalToPay,
        installments: [],
        date: new Date().toLocaleDateString('pt-PT'),
        timestamp: Date.now()
      };

      updatedInvoices = [newInvoice, ...invoices];

      if (formData.isFinal) {
        updatedInventory = inventory.map(p => p.timestamp === formData.productTimestamp ? { ...p, isSold: true } : p);
        updatedInvoices = cleanOtherProformas(updatedInvoices, formData.productTimestamp, newInvoice.timestamp);
      }
    }

    setInvoices(updatedInvoices);
    setInventory(updatedInventory);
    localStorage.setItem(BILL_KEY, JSON.stringify(updatedInvoices));
    localStorage.setItem(INV_KEY, JSON.stringify(updatedInventory));
    
    setFormData({ customerName: '', idNumber: '', phoneNumber: '', productTimestamp: 0, contractType: ContractType.ORDER, sellingPrice: 0, discount: 0, isFinal: false });
    setEditingInvoice(null);
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
    const updatedInventory = inventory.map(p => p.timestamp === proformaToFinalize.productTimestamp ? { ...p, isSold: true } : p);
    setInvoices(updatedInvoices);
    setInventory(updatedInventory);
    localStorage.setItem(BILL_KEY, JSON.stringify(updatedInvoices));
    localStorage.setItem(INV_KEY, JSON.stringify(updatedInventory));
    setProformaToFinalize(null);
    window.dispatchEvent(new Event('storage'));
  };

  const handleEditClick = (inv: Invoice) => {
    setFormData({
      customerName: inv.customerName,
      idNumber: inv.idNumber,
      phoneNumber: inv.phoneNumber,
      productTimestamp: inv.productTimestamp,
      contractType: inv.contractType,
      sellingPrice: inv.sellingPrice,
      discount: inv.discount || 0,
      isFinal: inv.isFinal
    });
    setEditingInvoice(inv);
    setActiveTab('record');
  };

  const handleDelete = (inv: Invoice) => {
    if (confirm(`Tem a certeza que deseja eliminar o documento #${inv.invoiceNumber} de ${inv.customerName}? Esta ação é irreversível.`)) {
      const updated = invoices.filter(i => i.timestamp !== inv.timestamp);
      
      // Se era uma factura final, opcionalmente devolver o item ao stock? 
      // Manteremos a lógica simples: apenas remover o documento.
      
      setInvoices(updated);
      localStorage.setItem(BILL_KEY, JSON.stringify(updated));
      alert('Documento excluído com sucesso do sistema.');
      window.dispatchEvent(new Event('storage'));
    }
  };

  const handlePrint = () => { window.print(); };

  const formatAOA = (val: number) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(val);

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden min-h-[600px]">
      <div className="flex border-b border-slate-200 bg-slate-50 print:hidden">
        <button onClick={() => { setActiveTab('record'); if(!editingInvoice) setFormData({ customerName: '', idNumber: '', phoneNumber: '', productTimestamp: 0, contractType: ContractType.ORDER, sellingPrice: 0, discount: 0, isFinal: false }); }} className={`flex-1 py-5 font-bold text-xs tracking-widest transition-all ${activeTab === 'record' ? 'bg-white text-emerald-600 border-b-4 border-emerald-600' : 'text-slate-500 hover:bg-slate-100'}`}>
          {editingInvoice ? 'EDITAR DOCUMENTO' : 'EMITIR DOCUMENTO'}
        </button>
        <button onClick={() => setActiveTab('consult')} className={`flex-1 py-5 font-bold text-xs tracking-widest transition-all ${activeTab === 'consult' ? 'bg-white text-emerald-600 border-b-4 border-emerald-600' : 'text-slate-500 hover:bg-slate-100'}`}>CONSULTAR LISTA</button>
      </div>

      <div className="p-6 md:p-10">
        {activeTab === 'record' ? (
          <form onSubmit={e => { 
            e.preventDefault(); 
            if (formData.productTimestamp === 0) {
              alert('ERRO: Por favor, selecione primeiro um artigo em stock.');
              return;
            }
            setShowConfirmIssue(true); 
          }} className="space-y-8 animate-fadeIn print:hidden">
            {editingInvoice && (
              <div className="flex justify-between items-center bg-amber-50 p-4 rounded-2xl border border-amber-100">
                <p className="text-xs font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                  <Edit2 className="w-4 h-4" /> Editando Documento #{editingInvoice.invoiceNumber}
                </p>
                <button type="button" onClick={() => { setEditingInvoice(null); setFormData({ customerName: '', idNumber: '', phoneNumber: '', productTimestamp: 0, contractType: ContractType.ORDER, sellingPrice: 0, discount: 0, isFinal: false }); }} className="text-amber-600 hover:text-amber-800 flex items-center gap-1 text-[10px] font-bold uppercase">
                  <X className="w-4 h-4" /> Cancelar Edição
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <input type="text" placeholder="Nome do Cliente" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
                <input type="text" placeholder="B.I. (14 Caracteres)" maxLength={14} value={formData.idNumber} onChange={e => setFormData({...formData, idNumber: e.target.value.toUpperCase()})} required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono outline-none focus:ring-2 focus:ring-emerald-500" />
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Telefone (9xx-xxx-xxx)" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: formatPhone(e.target.value)})} required className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div className="space-y-4">
                <select value={formData.productTimestamp} onChange={e => setFormData({...formData, productTimestamp: Number(e.target.value)})} required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value={0}>Selecione Artigo em Stock...</option>
                  {availableProducts.map(p => <option key={p.timestamp} value={p.timestamp}>{p.brand} {p.model} - {p.storage}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="Preço Base (Kz)" value={formData.sellingPrice || ''} onChange={e => setFormData({...formData, sellingPrice: Number(e.target.value)})} required className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500" />
                  <div className="relative">
                    <TicketPercent className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400" />
                    <input type="number" placeholder="Desconto (Kz)" value={formData.discount || ''} onChange={e => setFormData({...formData, discount: Number(e.target.value)})} className="w-full p-4 pl-12 bg-white border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-rose-500" />
                  </div>
                </div>
                <select value={formData.contractType} onChange={e => setFormData({...formData, contractType: e.target.value as ContractType})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500">
                  {Object.values(ContractType).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black text-emerald-900 uppercase tracking-widest flex items-center gap-2"><Calculator className="w-4 h-4" /> Resumo Financeiro</h3>
                <div className="text-right">
                  <span className="text-[10px] font-black text-emerald-600 uppercase block">Valor Total a Pagar</span>
                  <span className="text-2xl font-black text-emerald-900">{formatAOA(commercialSummary.totalToPay)}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-3 rounded-2xl border border-emerald-100 shadow-sm">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Pag. Inicial</p>
                  <p className="text-xs font-black text-slate-900">{formatAOA(commercialSummary.initial)}</p>
                </div>
                {commercialSummary.p1 > 0 && (
                  <div className="bg-white p-3 rounded-2xl border border-emerald-100 shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">1ª Prestação</p>
                    <p className="text-xs font-black text-slate-900">{formatAOA(commercialSummary.p1)}</p>
                  </div>
                )}
                {commercialSummary.p2 > 0 && (
                  <div className="bg-white p-3 rounded-2xl border border-emerald-100 shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">2ª Prestação</p>
                    <p className="text-xs font-black text-slate-900">{formatAOA(commercialSummary.p2)}</p>
                  </div>
                )}
                <div className="bg-slate-900 p-3 rounded-2xl shadow-lg">
                  <p className="text-[9px] font-black text-emerald-400 uppercase mb-1">Valor Final</p>
                  <p className="text-xs font-black text-white">{formatAOA(commercialSummary.final)}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 p-2 bg-slate-100 rounded-2xl">
              <button type="button" onClick={() => setFormData({...formData, isFinal: false})} className={`flex-1 py-4 rounded-xl font-bold text-xs uppercase tracking-widest ${!formData.isFinal ? 'bg-white shadow-sm' : 'text-slate-400'}`}>PROFORMA</button>
              <button type="button" onClick={() => setFormData({...formData, isFinal: true})} className={`flex-1 py-4 rounded-xl font-bold text-xs uppercase tracking-widest ${formData.isFinal ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400'}`}>FACTURA FINAL</button>
            </div>
            <button type="submit" className="w-full p-6 bg-slate-900 text-white rounded-3xl font-black text-lg tracking-widest uppercase hover:opacity-90 transition-opacity">
              {editingInvoice ? 'SALVAR ALTERAÇÕES' : 'GERAR DOCUMENTO'}
            </button>
          </form>
        ) : (
          <div className="animate-fadeIn">
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left">
                <thead className="bg-slate-900 text-[10px] font-black uppercase text-slate-400">
                  <tr><th className="p-4">Nº Doc</th><th className="p-4">Tipo</th><th className="p-4">Cliente / Tel</th><th className="p-4 text-right">Valor Total</th><th className="p-4 text-right">Ações</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map(inv => (
                    <tr key={inv.timestamp} className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-sm">#{inv.invoiceNumber}</td>
                      <td className="p-4"><span className={`text-[9px] font-black px-2 py-1 rounded-full ${inv.isFinal ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'}`}>{inv.isFinal ? 'FINAL' : 'PROFORMA'}</span></td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900 text-sm">{inv.customerName}</div>
                        <div className="text-[10px] text-slate-400">{inv.phoneNumber}</div>
                      </td>
                      <td className="p-4 text-right font-black text-emerald-600 text-sm">{formatAOA(inv.adjustedPrice)}</td>
                      <td className="p-4 flex justify-end gap-2">
                        <button onClick={() => setSelectedInvoice(inv)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all" title="Ver/Imprimir"><Printer className="w-4 h-4" /></button>
                        <button onClick={() => handleEditClick(inv)} className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-600 hover:text-white transition-all" title="Editar"><Edit2 className="w-4 h-4" /></button>
                        {!inv.isFinal && <button onClick={() => setProformaToFinalize(inv)} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all" title="Finalizar Venda"><ArrowRightCircle className="w-4 h-4" /></button>}
                        <button onClick={() => handleDelete(inv)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                  {invoices.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">Nenhum documento emitido até ao momento</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {selectedInvoice && (
        <div className="fixed inset-0 bg-white md:bg-slate-900/90 z-[1000] flex items-start justify-center overflow-y-auto p-0 md:p-10">
          <div className="absolute top-4 right-4 print:hidden z-[1001] flex gap-2">
            <button onClick={handlePrint} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black shadow-xl flex items-center gap-2"><Printer className="w-5 h-5" /> IMPRIMIR PDF</button>
            <button onClick={() => setSelectedInvoice(null)} className="bg-red-600 text-white p-3 rounded-xl shadow-xl"><X className="w-6 h-6" /></button>
          </div>
          <div id="invoice-to-print" className="bg-white w-full max-w-4xl min-h-screen p-10 md:p-20 shadow-2xl print:shadow-none print:m-0 print:p-8">
             <div className="flex justify-between items-center border-b-8 border-slate-900 pb-10 mb-10">
               <div><h1 className="text-4xl font-black uppercase tracking-tighter">Import Angola Pro</h1><p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Gestão de Importações e Vendas</p></div>
               <div className="text-right">
                 <h2 className={`text-3xl font-black uppercase ${selectedInvoice.isFinal ? 'text-emerald-600' : 'text-slate-400'}`}>{selectedInvoice.isFinal ? 'Factura Final' : 'Factura Proforma'}</h2>
                 <p className="text-sm font-black uppercase">Nº DOC: {selectedInvoice.invoiceNumber}</p>
               </div>
             </div>
             <div className="grid grid-cols-2 gap-20 mb-10">
               <div><h4 className="text-[10px] font-black text-slate-400 uppercase border-b pb-1 mb-2">Cliente</h4><p className="text-xl font-black">{selectedInvoice.customerName}</p><p className="text-sm">BI: {selectedInvoice.idNumber}</p><p className="text-sm">Tel: {selectedInvoice.phoneNumber}</p></div>
               <div className="text-right"><h4 className="text-[10px] font-black text-slate-400 uppercase border-b pb-1 mb-2">Artigo</h4><p className="text-xl font-black">{selectedInvoice.productDetails?.brand} {selectedInvoice.productDetails?.model}</p><p className="text-sm uppercase">{selectedInvoice.productDetails?.storage} • {selectedInvoice.productDetails?.color}</p><p className="text-sm font-bold mt-2">Data: {selectedInvoice.date}</p></div>
             </div>
             <div className="border-t-2 border-slate-100 py-6 space-y-2">
               <h4 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Detalhes do Contrato</h4>
               <div className="flex justify-between font-black text-sm uppercase"><span>Modalidade</span><span>{selectedInvoice.contractType}</span></div>
               <div className="flex justify-between font-bold text-sm"><span>Preço Unitário</span><span>{formatAOA(selectedInvoice.sellingPrice)}</span></div>
               {selectedInvoice.discount && selectedInvoice.discount > 0 && <div className="flex justify-between font-bold text-sm text-rose-500"><span>Desconto Aplicado</span><span>- {formatAOA(selectedInvoice.discount)}</span></div>}
             </div>
             <div className="mt-10 pt-10 border-t-4 border-slate-900 flex justify-between items-end">
               <div><p className="text-[10px] font-black uppercase text-slate-400">Total Geral do Documento</p><p className="text-4xl font-black">{formatAOA(selectedInvoice.adjustedPrice)}</p></div>
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
             <h3 className="text-xl font-black uppercase mb-2">{formData.isFinal ? (editingInvoice ? 'Actualizar Factura Final?' : 'Emitir Factura Final?') : (editingInvoice ? 'Actualizar Proforma?' : 'Guardar Proforma?')}</h3>
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
