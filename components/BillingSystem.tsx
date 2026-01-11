
import React, { useState, useEffect, useMemo } from 'react';
import { Invoice, ContractType, InventoryItem, PaymentInstallment, PaymentReceipt } from '../types';
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
  Edit2,
  Clock,
  CheckCircle2,
  FileCheck,
  FileText
} from 'lucide-react';

const BillingSystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'record' | 'consult'>('record');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);
  const [proformaToFinalize, setProformaToFinalize] = useState<Invoice | null>(null);
  const [showConfirmIssue, setShowConfirmIssue] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

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

  const availableProducts = useMemo(() => {
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

  const addDays = (dateStr: string, days: number) => {
    const [day, month, year] = dateStr.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString('pt-PT');
  };

  const generateInstallmentsList = (total: number, type: ContractType, baseDate: string): PaymentInstallment[] => {
    let initial = 0, p1 = 0, p2 = 0, final = 0;
    if (type === ContractType.ORDER) {
      initial = total * 0.8;
      final = total * 0.2;
    } else if (type === ContractType.TWO_INSTALLMENTS) {
      initial = total * 0.2;
      p1 = total * 0.4;
      final = total * 0.4;
    } else if (type === ContractType.THREE_INSTALLMENTS) {
      initial = total * 0.25;
      p1 = total * 0.25;
      p2 = total * 0.25;
      final = total * 0.25;
    }

    const list: PaymentInstallment[] = [];
    list.push({ number: 1, label: 'Pagamento Inicial', amount: initial, dueDate: baseDate, status: 'Pendente' });
    
    if (type === ContractType.ORDER) {
      list.push({ number: 2, label: 'Pagamento Final', amount: final, dueDate: addDays(baseDate, 30), status: 'Pendente' });
    } else if (type === ContractType.TWO_INSTALLMENTS) {
      list.push({ number: 2, label: '1ª Prestação', amount: p1, dueDate: addDays(baseDate, 30), status: 'Pendente' });
      list.push({ number: 3, label: 'Pagamento Final', amount: final, dueDate: addDays(baseDate, 60), status: 'Pendente' });
    } else if (type === ContractType.THREE_INSTALLMENTS) {
      list.push({ number: 2, label: '1ª Prestação', amount: p1, dueDate: addDays(baseDate, 30), status: 'Pendente' });
      list.push({ number: 3, label: '2ª Prestação', amount: p2, dueDate: addDays(baseDate, 60), status: 'Pendente' });
      list.push({ number: 4, label: 'Pagamento Final', amount: final, dueDate: addDays(baseDate, 90), status: 'Pendente' });
    }
    return list;
  };

  const commercialSummary = useMemo(() => {
    const base = formData.sellingPrice;
    let multiplier = 1;
    if (formData.contractType === ContractType.TWO_INSTALLMENTS) multiplier = 1.07;
    if (formData.contractType === ContractType.THREE_INSTALLMENTS) multiplier = 1.15;
    const priceWithContract = base * multiplier;
    const totalToPay = Math.max(0, priceWithContract - formData.discount);
    return { totalToPay };
  }, [formData.sellingPrice, formData.contractType, formData.discount]);

  const getNextDocumentNumber = (isFinal: boolean, currentInvoices: Invoice[]) => {
    const filtered = currentInvoices.filter(inv => inv.isFinal === isFinal);
    if (filtered.length === 0) return 1;
    const maxNum = Math.max(...filtered.map(inv => inv.invoiceNumber));
    return maxNum + 1;
  };

  const executeIssue = () => {
    const product = inventory.find(p => p.timestamp === formData.productTimestamp);
    let updatedInvoices = [...invoices];
    let updatedInventory = [...inventory];
    const today = new Date().toLocaleDateString('pt-PT');

    if (editingInvoice) {
      updatedInvoices = invoices.map(inv => {
        if (inv.timestamp === editingInvoice.timestamp) {
          let newInvoiceNumber = inv.invoiceNumber;
          if (!inv.isFinal && formData.isFinal) {
            newInvoiceNumber = getNextDocumentNumber(true, invoices);
          }
          return {
            ...inv,
            ...formData,
            invoiceNumber: newInvoiceNumber,
            productDetails: product || {},
            adjustedPrice: commercialSummary.totalToPay,
            installments: generateInstallmentsList(commercialSummary.totalToPay, formData.contractType, today)
          };
        }
        return inv;
      });
    } else {
      const docNumber = getNextDocumentNumber(formData.isFinal, invoices);
      const newInvoice: Invoice = {
        id: Date.now(),
        invoiceNumber: docNumber,
        ...formData,
        productDetails: product || {},
        adjustedPrice: commercialSummary.totalToPay,
        installments: generateInstallmentsList(commercialSummary.totalToPay, formData.contractType, today),
        date: today,
        timestamp: Date.now(),
        isConverted: false
      };
      updatedInvoices = [newInvoice, ...invoices];
    }

    if (formData.isFinal) {
      updatedInventory = inventory.map(p => p.timestamp === formData.productTimestamp ? { ...p, isSold: true } : p);
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
    const nextFinalNum = getNextDocumentNumber(true, invoices);
    const today = new Date().toLocaleDateString('pt-PT');
    
    const newFinalInvoice: Invoice = {
      ...proformaToFinalize,
      id: Date.now(),
      timestamp: Date.now(),
      isFinal: true,
      isConverted: false,
      invoiceNumber: nextFinalNum,
      date: today,
      installments: generateInstallmentsList(proformaToFinalize.adjustedPrice, proformaToFinalize.contractType, today)
    };

    const updatedInvoices = [newFinalInvoice, ...invoices.map(inv => 
      inv.timestamp === proformaToFinalize.timestamp 
      ? { ...inv, isConverted: true } 
      : inv
    )];
    
    const updatedInventory = inventory.map(p => p.timestamp === proformaToFinalize.productTimestamp ? { ...p, isSold: true } : p);
    
    setInvoices(updatedInvoices);
    setInventory(updatedInventory);
    localStorage.setItem(BILL_KEY, JSON.stringify(updatedInvoices));
    localStorage.setItem(INV_KEY, JSON.stringify(updatedInventory));
    setProformaToFinalize(null);
    window.dispatchEvent(new Event('storage'));
  };

  const confirmPayment = (invTimestamp: number, instNumber: number) => {
    const today = new Date().toLocaleDateString('pt-PT');
    let generatedReceipt: PaymentReceipt | null = null;

    const updatedInvoices = invoices.map(inv => {
      if (inv.timestamp === invTimestamp) {
        // Fix: Explicitly type updatedInsts as PaymentInstallment[] and use 'as const' for status
        const updatedInsts: PaymentInstallment[] = inv.installments.map(inst => {
          if (inst.number === instNumber) {
            const receiptID = `REC-${inv.invoiceNumber}-${inst.number}`;
            generatedReceipt = {
              id: Date.now(),
              receiptNumber: receiptID,
              customerName: inv.customerName,
              idNumber: inv.idNumber,
              phoneNumber: inv.phoneNumber,
              amount: inst.amount,
              date: today,
              timestamp: Date.now(),
              invoiceNumber: inv.invoiceNumber,
              invoiceTimestamp: inv.timestamp,
              installmentNumber: inst.number,
              installmentLabel: inst.label,
              productInfo: `${inv.productDetails?.brand} ${inv.productDetails?.model}`
            };
            return { ...inst, status: 'Pago' as const, paymentDate: today, receiptNumber: receiptID };
          }
          return inst;
        });
        const updatedInv = { ...inv, installments: updatedInsts };
        if (selectedInvoice && selectedInvoice.timestamp === invTimestamp) {
          setSelectedInvoice(updatedInv);
        }
        return updatedInv;
      }
      return inv;
    });

    if (generatedReceipt) {
      const updatedReceipts = [generatedReceipt, ...receipts];
      setReceipts(updatedReceipts);
      localStorage.setItem(REC_KEY, JSON.stringify(updatedReceipts));
    }

    setInvoices(updatedInvoices);
    localStorage.setItem(BILL_KEY, JSON.stringify(updatedInvoices));
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

  const handleDeleteInvoice = (inv: Invoice) => {
    if (confirm(`AVISO: Eliminar permanentemente o documento #${inv.invoiceNumber}?`)) {
      const updatedInvoices = invoices.filter(i => i.timestamp !== inv.timestamp);
      if (inv.isFinal) {
        const updatedInventory = inventory.map(p => p.timestamp === inv.productTimestamp ? { ...p, isSold: false } : p);
        setInventory(updatedInventory);
        localStorage.setItem(INV_KEY, JSON.stringify(updatedInventory));
      }
      setInvoices(updatedInvoices);
      localStorage.setItem(BILL_KEY, JSON.stringify(updatedInvoices));
      window.dispatchEvent(new Event('storage'));
    }
  };

  const handleDeleteReceipt = (rec: PaymentReceipt) => {
    if (confirm(`AVISO: Eliminar o recibo ${rec.receiptNumber}? O pagamento correspondente será reaberto na fatura de origem.`)) {
      // 1. Remover o recibo
      const updatedReceipts = receipts.filter(r => r.timestamp !== rec.timestamp);
      
      // 2. Reverter o status do pagamento na fatura original
      const updatedInvoices = invoices.map(inv => {
        if (inv.timestamp === rec.invoiceTimestamp) {
          // Fix: Explicitly type updatedInsts as PaymentInstallment[] and use 'as const' for status
          const updatedInsts: PaymentInstallment[] = inv.installments.map(inst => {
            if (inst.number === rec.installmentNumber) {
              return { ...inst, status: 'Pendente' as const, paymentDate: undefined, receiptNumber: undefined };
            }
            return inst;
          });
          const updatedInv = { ...inv, installments: updatedInsts };
          // Se a fatura estiver aberta na modal, atualizar ela também
          if (selectedInvoice && selectedInvoice.timestamp === rec.invoiceTimestamp) {
            setSelectedInvoice(updatedInv);
          }
          return updatedInv;
        }
        return inv;
      });

      setReceipts(updatedReceipts);
      setInvoices(updatedInvoices);
      localStorage.setItem(REC_KEY, JSON.stringify(updatedReceipts));
      localStorage.setItem(BILL_KEY, JSON.stringify(updatedInvoices));
      window.dispatchEvent(new Event('storage'));
    }
  };

  const combinedList = useMemo(() => {
    const list = [
      ...invoices.map(inv => ({ ...inv, docType: inv.isFinal ? 'FACTURA' : 'PROFORMA', displayDate: inv.date })),
      ...receipts.map(rec => ({ ...rec, docType: 'RECIBO', displayDate: rec.date, invoiceNumber: rec.invoiceNumber }))
    ];
    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [invoices, receipts]);

  const formatAOA = (val: number) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(val);

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden min-h-[600px]">
      <div className="flex border-b border-slate-200 bg-slate-50 print:hidden">
        <button onClick={() => { setActiveTab('record'); if(!editingInvoice) setFormData({ customerName: '', idNumber: '', phoneNumber: '', productTimestamp: 0, contractType: ContractType.ORDER, sellingPrice: 0, discount: 0, isFinal: false }); }} className={`flex-1 py-5 font-bold text-xs tracking-widest transition-all ${activeTab === 'record' ? 'bg-white text-indigo-600 border-b-4 border-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}>
          {editingInvoice ? 'EDITAR DOCUMENTO' : 'EMITIR DOCUMENTO'}
        </button>
        <button onClick={() => setActiveTab('consult')} className={`flex-1 py-5 font-bold text-xs tracking-widest transition-all ${activeTab === 'consult' ? 'bg-white text-indigo-600 border-b-4 border-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}>CONSULTAR LISTA</button>
      </div>

      <div className="p-6 md:p-10">
        {activeTab === 'record' ? (
          <form onSubmit={e => { 
            e.preventDefault(); 
            if (formData.productTimestamp === 0) { alert('Erro: Selecione um produto.'); return; }
            setShowConfirmIssue(true); 
          }} className="space-y-8 animate-fadeIn print:hidden">
            {editingInvoice && (
              <div className="flex justify-between items-center bg-amber-50 p-4 rounded-2xl border border-amber-100">
                <p className="text-xs font-black text-amber-600 uppercase tracking-widest flex items-center gap-2"><Edit2 className="w-4 h-4" /> Editando: {editingInvoice.isFinal ? 'Factura' : 'Proforma'} #{editingInvoice.invoiceNumber}</p>
                <button type="button" onClick={() => { setEditingInvoice(null); setFormData({ customerName: '', idNumber: '', phoneNumber: '', productTimestamp: 0, contractType: ContractType.ORDER, sellingPrice: 0, discount: 0, isFinal: false }); }} className="text-amber-600 hover:text-amber-800 flex items-center gap-1 text-[10px] font-bold uppercase"><X className="w-4 h-4" /> Cancelar</button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <input type="text" placeholder="Nome do Cliente" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                <input type="text" placeholder="B.I. (14 Caracteres)" maxLength={14} value={formData.idNumber} onChange={e => setFormData({...formData, idNumber: e.target.value.toUpperCase()})} required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono" />
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Telefone (9xx-xxx-xxx)" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: formatPhone(e.target.value)})} required className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
              </div>
              <div className="space-y-4">
                <select value={formData.productTimestamp} onChange={e => setFormData({...formData, productTimestamp: Number(e.target.value)})} required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <option value={0}>Selecione Artigo em Stock...</option>
                  {availableProducts.map(p => <option key={p.timestamp} value={p.timestamp}>{p.brand} {p.model} - {p.storage}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="Preço Base (Kz)" value={formData.sellingPrice || ''} onChange={e => setFormData({...formData, sellingPrice: Number(e.target.value)})} required className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold" />
                  <div className="relative">
                    <TicketPercent className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400" />
                    <input type="number" placeholder="Desconto (Kz)" value={formData.discount || ''} onChange={e => setFormData({...formData, discount: Number(e.target.value)})} className="w-full p-4 pl-12 bg-white border border-slate-200 rounded-xl font-bold" />
                  </div>
                </div>
                <select value={formData.contractType} onChange={e => setFormData({...formData, contractType: e.target.value as ContractType})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                  {Object.values(ContractType).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-4 p-2 bg-slate-100 rounded-2xl">
              <button type="button" onClick={() => setFormData({...formData, isFinal: false})} className={`flex-1 py-4 rounded-xl font-bold text-xs uppercase tracking-widest ${!formData.isFinal ? 'bg-white shadow-sm' : 'text-slate-400'}`}>PROFORMA</button>
              <button type="button" onClick={() => setFormData({...formData, isFinal: true})} className={`flex-1 py-4 rounded-xl font-bold text-xs uppercase tracking-widest ${formData.isFinal ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400'}`}>FACTURA FINAL</button>
            </div>
            <button type="submit" className="w-full p-6 bg-slate-900 text-white rounded-3xl font-black text-lg tracking-widest uppercase">{editingInvoice ? 'SALVAR ALTERAÇÕES' : 'GERAR DOCUMENTO'}</button>
          </form>
        ) : (
          <div className="animate-fadeIn">
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left">
                <thead className="bg-slate-900 text-[10px] font-black uppercase text-slate-400">
                  <tr>
                    <th className="p-4">Doc / Data</th>
                    <th className="p-4">Tipo</th>
                    <th className="p-4">Cliente / Tel</th>
                    <th className="p-4 text-right">Valor</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {combinedList.map((doc: any) => (
                    <tr key={doc.timestamp} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-sm">#{doc.invoiceNumber || doc.receiptNumber}</div>
                        <div className="text-[10px] text-slate-400">{doc.displayDate}</div>
                      </td>
                      <td className="p-4">
                        <span className={`text-[9px] font-black px-2 py-1 rounded-full ${
                          doc.docType === 'RECIBO' ? 'bg-indigo-50 text-indigo-600' : 
                          doc.docType === 'FACTURA' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'
                        }`}>
                          {doc.docType}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900 text-sm">{doc.customerName}</div>
                        <div className="text-[10px] text-slate-400">{doc.phoneNumber}</div>
                      </td>
                      <td className="p-4 text-right font-black text-slate-900 text-sm">
                        {formatAOA(doc.adjustedPrice || doc.amount)}
                      </td>
                      <td className="p-4 flex justify-end gap-2">
                        {doc.docType === 'RECIBO' ? (
                          <>
                            <button onClick={() => setSelectedReceipt(doc)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"><Printer className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteReceipt(doc)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => setSelectedInvoice(doc)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"><Printer className="w-4 h-4" /></button>
                            <button onClick={() => handleEditClick(doc)} className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-600 hover:text-white transition-all"><Edit2 className="w-4 h-4" /></button>
                            {doc.docType === 'PROFORMA' && (
                              <button 
                                onClick={() => !doc.isConverted && setProformaToFinalize(doc)} 
                                className={`p-2 rounded-lg transition-all ${doc.isConverted ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'}`}
                                disabled={doc.isConverted}
                              >
                                <ArrowRightCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button onClick={() => handleDeleteInvoice(doc)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                          </>
                        )}
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
            <button onClick={() => window.print()} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black shadow-xl flex items-center gap-2"><Printer className="w-5 h-5" /> IMPRIMIR PDF</button>
            <button onClick={() => setSelectedInvoice(null)} className="bg-red-600 text-white p-3 rounded-xl shadow-xl"><X className="w-6 h-6" /></button>
          </div>
          <div id="invoice-to-print" className="bg-white w-full max-w-4xl min-h-screen p-10 md:p-20 shadow-2xl print:shadow-none print:m-0 print:p-10">
             <div className="flex justify-between items-center border-b-8 border-indigo-600 pb-10 mb-10">
               <div><h1 className="text-4xl font-[1000] uppercase tracking-tighter text-indigo-600">TECHIMPORT</h1><p className="text-[12px] font-black text-slate-900 uppercase tracking-[0.5em] mt-1">ANGOLA</p></div>
               <div className="text-right">
                 <h2 className={`text-3xl font-black uppercase ${selectedInvoice.isFinal ? 'text-emerald-600' : 'text-slate-400'}`}>{selectedInvoice.isFinal ? 'Factura Final' : 'Factura Proforma'}</h2>
                 <p className="text-sm font-black uppercase">Nº DOC: {selectedInvoice.invoiceNumber}</p>
               </div>
             </div>
             
             <div className="grid grid-cols-2 gap-20 mb-10">
               <div><h4 className="text-[10px] font-black text-slate-400 uppercase border-b pb-1 mb-2">Cliente</h4><p className="text-xl font-black uppercase">{selectedInvoice.customerName}</p><p className="text-sm">BI: {selectedInvoice.idNumber}</p><p className="text-sm">Tel: {selectedInvoice.phoneNumber}</p></div>
               <div className="text-right"><h4 className="text-[10px] font-black text-slate-400 uppercase border-b pb-1 mb-2">Artigo</h4><p className="text-xl font-black uppercase">{selectedInvoice.productDetails?.brand} {selectedInvoice.productDetails?.model}</p><p className="text-sm uppercase">{selectedInvoice.productDetails?.storage} • {selectedInvoice.productDetails?.color}</p><p className="text-sm font-bold mt-2 text-indigo-600">Emissão: {selectedInvoice.date}</p></div>
             </div>

             {selectedInvoice.installments && selectedInvoice.installments.length > 0 && (
               <div className="mt-8 bg-slate-50 p-6 rounded-3xl border border-slate-200">
                 <h4 className="text-[10px] font-black text-slate-900 uppercase mb-4 tracking-widest flex items-center gap-2"><Clock className="w-4 h-4" /> Plano de Prestações</h4>
                 <div className="space-y-2">
                   {selectedInvoice.installments.map((inst) => (
                     <div key={inst.number} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] ${inst.status === 'Pago' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                            {inst.status === 'Pago' ? <CheckCircle2 className="w-5 h-5" /> : inst.number}
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase text-slate-900">{inst.label}</p>
                            <p className="text-[9px] text-slate-400 uppercase">Vencimento: {inst.dueDate}</p>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-6">
                           <div>
                              <p className="text-sm font-black text-slate-900">{formatAOA(inst.amount)}</p>
                              <p className={`text-[8px] font-black uppercase ${inst.status === 'Pago' ? 'text-emerald-600' : 'text-amber-500'}`}>
                                {inst.status === 'Pago' ? `Pago em ${inst.paymentDate}` : 'Pendente'}
                              </p>
                           </div>
                           <div className="print:hidden">
                              {inst.status === 'Pago' ? (
                                <span className="text-[10px] font-black text-emerald-600 uppercase flex items-center gap-1">
                                  <FileText className="w-3 h-3" /> Liquidado
                                </span>
                              ) : (
                                <button onClick={() => confirmPayment(selectedInvoice.timestamp, inst.number)} className="bg-emerald-600 text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase flex items-center gap-1 hover:bg-emerald-700">
                                  <FileCheck className="w-3.5 h-3.5" /> Confirmar Pagamento
                                </button>
                              )}
                           </div>
                        </div>
                     </div>
                   ))}
                 </div>
               </div>
             )}

             <div className="mt-10 pt-10 border-t-4 border-slate-900 flex justify-between items-end">
               <div><p className="text-[10px] font-black uppercase text-slate-400">Total Líquido do Contrato</p><p className="text-4xl font-black">{formatAOA(selectedInvoice.adjustedPrice)}</p></div>
             </div>
             <div className="mt-32 grid grid-cols-2 gap-40 text-center">
               <div className="border-t-2 border-slate-900 pt-4 font-black uppercase text-xs">Assinatura Cliente</div>
               <div className="border-t-2 border-slate-900 pt-4 font-black uppercase text-xs">Tech Import Angola</div>
             </div>
          </div>
        </div>
      )}

      {selectedReceipt && (
        <div className="fixed inset-0 bg-white md:bg-slate-900/90 z-[1000] flex items-start justify-center overflow-y-auto p-0 md:p-10">
          <div className="absolute top-4 right-4 print:hidden z-[1001] flex gap-2">
            <button onClick={() => window.print()} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black shadow-xl flex items-center gap-2"><Printer className="w-5 h-5" /> IMPRIMIR RECIBO</button>
            <button onClick={() => setSelectedReceipt(null)} className="bg-red-600 text-white p-3 rounded-xl shadow-xl"><X className="w-6 h-6" /></button>
          </div>
          <div id="invoice-to-print" className="bg-white w-full max-w-4xl min-h-screen p-10 md:p-20 shadow-2xl print:shadow-none print:m-0 print:p-10">
             <div className="flex justify-between items-center border-b-8 border-indigo-600 pb-10 mb-10">
               <div><h1 className="text-4xl font-[1000] uppercase tracking-tighter text-indigo-600">TECHIMPORT</h1><p className="text-[12px] font-black text-slate-900 uppercase tracking-[0.5em] mt-1">ANGOLA</p></div>
               <div className="text-right">
                 <h2 className="text-3xl font-black uppercase text-indigo-600 tracking-widest">Recibo de Pagamento</h2>
                 <p className="text-sm font-black uppercase">Nº: {selectedReceipt.receiptNumber}</p>
               </div>
             </div>
             
             <div className="bg-slate-50 p-10 rounded-3xl border border-slate-200 mb-10 leading-relaxed">
                <p className="text-lg font-medium text-slate-600">
                  Recebemos do(a) Sr(a). <strong className="text-slate-900 uppercase">{selectedReceipt.customerName}</strong>, 
                  portador do BI <strong className="text-slate-900">{selectedReceipt.idNumber}</strong>, a importância de 
                  <strong className="text-indigo-600 text-xl font-black mx-2">{formatAOA(selectedReceipt.amount)}</strong>, 
                  referente ao pagamento da <strong className="uppercase text-slate-900">{selectedReceipt.installmentLabel}</strong> 
                  do artigo <strong className="uppercase text-slate-900">{selectedReceipt.productInfo}</strong>, 
                  vinculado à Factura Final #{selectedReceipt.invoiceNumber}.
                </p>
             </div>

             <div className="grid grid-cols-2 gap-10 mt-20">
               <div className="p-8 bg-slate-50 rounded-3xl border border-slate-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Data do Pagamento</p>
                  <p className="text-xl font-black">{selectedReceipt.date}</p>
               </div>
               <div className="p-8 bg-indigo-600 rounded-3xl text-white">
                  <p className="text-[10px] font-black text-indigo-200 uppercase mb-2 tracking-widest">Valor Liquidado</p>
                  <p className="text-3xl font-[1000]">{formatAOA(selectedReceipt.amount)}</p>
               </div>
             </div>

             <div className="mt-40 grid grid-cols-2 gap-40 text-center">
               <div className="border-t-2 border-slate-900 pt-4 font-black uppercase text-[10px]">Assinatura do Cliente</div>
               <div className="border-t-2 border-slate-900 pt-4 font-black uppercase text-[10px]">Tech Import Angola - Tesouraria</div>
             </div>
             
             <div className="mt-20 pt-10 border-t border-slate-100 text-center">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">Este recibo serve como prova de quitação parcial do contrato.</p>
             </div>
          </div>
        </div>
      )}

      {proformaToFinalize && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[500] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 text-center shadow-2xl">
             <ShieldCheck className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
             <h3 className="text-xl font-black uppercase mb-2">Finalizar Venda?</h3>
             <p className="text-slate-500 text-sm mb-6">A Proforma será mantida e uma nova Factura Final será gerada com o plano de prestações activo.</p>
             <div className="flex flex-col gap-2">
               <button onClick={finalizeProforma} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black">CONFIRMAR E GERAR FACTURA</button>
               <button onClick={() => setProformaToFinalize(null)} className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold">CANCELAR</button>
             </div>
          </div>
        </div>
      )}

      {showConfirmIssue && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[500] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 text-center shadow-2xl">
             <AlertCircle className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
             <h3 className="text-xl font-black uppercase mb-2">Confirmar Acção?</h3>
             <p className="text-sm text-slate-500 mb-6">Deseja emitir este documento {formData.isFinal ? 'como Factura Final' : 'como Proforma'}?</p>
             <div className="flex flex-col gap-2">
               <button onClick={executeIssue} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black">CONFIRMAR</button>
               <button onClick={() => setShowConfirmIssue(false)} className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold">VOLTAR</button>
             </div>
          </div>
        </div>
      )}

      <style>{`
        @page {
          size: A4;
          margin: 0;
        }
        @media print {
          html, body {
            width: 210mm;
            height: 297mm;
            background: #fff !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden;
          }
          body * { 
            visibility: hidden !important; 
          }
          #invoice-to-print, #invoice-to-print * { 
            visibility: visible !important; 
          }
          #invoice-to-print { 
            position: fixed !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 210mm !important; 
            min-height: 297mm !important;
            margin: 0 !important; 
            padding: 20mm !important;
            border: none !important;
            box-shadow: none !important;
            z-index: 9999 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .fixed, .absolute, .print\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default BillingSystem;
