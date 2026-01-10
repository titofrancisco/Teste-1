
import React, { useState, useEffect, useMemo } from 'react';
import { InventoryItem, DeviceCondition, SuggestionStore, Invoice } from '../types';
import { 
  Package, 
  Plus, 
  Search, 
  Trash2, 
  X, 
  Printer, 
  Smartphone,
  Hash,
  Tag,
  Layers,
  Palette,
  Info,
  DollarSign,
  CheckCircle2
} from 'lucide-react';

const InventorySystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'record' | 'consult'>('record');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  
  const INV_KEY = 'angola_inv_v3';
  const SUGG_KEY = 'angola_sugg_v3';
  const BILL_KEY = 'angola_invoices_final_v1';

  const [suggestions, setSuggestions] = useState<SuggestionStore>({
    deviceTypes: [],
    brands: {}, // Note: although types say brands is Record<string, string[]>, we'll simplify to string[] for global suggestions as requested
    models: {},
    storages: [],
    colors: []
  });

  const [formData, setFormData] = useState({
    deviceType: '',
    brand: '',
    model: '',
    condition: DeviceCondition.NEW,
    storage: '',
    color: '',
    specs: '',
    purchasePrice: 0
  });

  useEffect(() => {
    const load = () => {
      const saved = localStorage.getItem(INV_KEY);
      const savedSugg = localStorage.getItem(SUGG_KEY);
      const savedBills = localStorage.getItem(BILL_KEY);
      if (saved) setItems(JSON.parse(saved));
      if (savedSugg) setSuggestions(JSON.parse(savedSugg));
      if (savedBills) setInvoices(JSON.parse(savedBills));
    };
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, []);

  // Lógica de cálculo conforme solicitado:
  // Preço Compra (P9) * 3% (Comissão) * 1.14 (IVA)
  // Soma isso ao P9, multiplica por 2% (Recarga) * 1.14 (IVA)
  // Soma tudo.
  const calculateTotalPrice = (base: number) => {
    if (!base || base <= 0) return 0;
    
    const purchaseComm = base * 0.03;
    const vatOnPurchaseComm = purchaseComm * 0.14;
    const subtotal1 = base + purchaseComm + vatOnPurchaseComm;
    
    const rechargeComm = subtotal1 * 0.02;
    const vatOnRechargeComm = rechargeComm * 0.14;
    
    return subtotal1 + rechargeComm + vatOnRechargeComm;
  };

  const totalPrice = calculateTotalPrice(formData.purchasePrice);

  const updateSuggestions = (newData: typeof formData) => {
    const newSugg = { ...suggestions };
    
    if (newData.deviceType && !newSugg.deviceTypes.includes(newData.deviceType)) 
      newSugg.deviceTypes.push(newData.deviceType);
    
    // Simplificando lógica de sugestão conforme o prompt original
    if (newData.brand && !Object.keys(newSugg.brands).includes(newData.brand))
      newSugg.brands[newData.brand] = [];
      
    if (newData.storage && !newSugg.storages.includes(newData.storage))
      newSugg.storages.push(newData.storage);
      
    if (newData.color && !newSugg.colors.includes(newData.color))
      newSugg.colors.push(newData.color);

    setSuggestions(newSugg);
    localStorage.setItem(SUGG_KEY, JSON.stringify(newSugg));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newItem: InventoryItem = {
      id: items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1,
      ...formData,
      totalPurchasePrice: totalPrice,
      freight: 0, // Campos do prompt inicial focados nestes
      totalFreight: 0,
      customsExpenses: 0,
      additionalExpenses: 0,
      totalCost: totalPrice, // O custo total do inventário aqui é o preço de compra total calculado
      timestamp: Date.now(),
      dateStr: new Date().toLocaleDateString('pt-PT'),
      isSold: false
    };

    const updated = [newItem, ...items];
    setItems(updated);
    localStorage.setItem(INV_KEY, JSON.stringify(updated));
    updateSuggestions(formData);
    
    // Reset form
    setFormData({
      deviceType: '', brand: '', model: '', condition: DeviceCondition.NEW,
      storage: '', color: '', specs: '', purchasePrice: 0
    });
    
    setActiveTab('consult');
  };

  const handleDelete = (id: number) => {
    if (confirm('Tem a certeza que deseja eliminar este registo?')) {
      const updated = items.filter(i => i.id !== id);
      // Re-ordenar IDs para preencher lacunas conforme solicitado "retorna ao número anterior quando apagado"
      const reordered = updated.sort((a,b) => a.timestamp - b.timestamp).map((item, index) => ({
        ...item,
        id: index + 1
      })).reverse();
      
      setItems(reordered);
      localStorage.setItem(INV_KEY, JSON.stringify(reordered));
    }
  };

  const getItemStatus = (item: InventoryItem) => {
    if (item.isSold) return { label: 'Vendido', color: 'text-rose-600', bg: 'bg-rose-50' };
    const hasProforma = invoices.some(inv => inv.productTimestamp === item.timestamp && !inv.isFinal);
    if (hasProforma) return { label: 'Reserva', color: 'text-amber-600', bg: 'bg-amber-50' };
    return { label: 'Disponível', color: 'text-emerald-600', bg: 'bg-emerald-50' };
  };

  const formatAOA = (val: number) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(val);

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden min-h-[700px]">
      <div className="flex border-b border-slate-200 bg-slate-50 print:hidden">
        <button 
          onClick={() => setActiveTab('record')} 
          className={`flex-1 py-5 font-bold text-xs tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'record' ? 'bg-white text-amber-600 border-b-4 border-amber-600' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          <Plus className="w-4 h-4" /> REGISTAR ARTIGO
        </button>
        <button 
          onClick={() => setActiveTab('consult')} 
          className={`flex-1 py-5 font-bold text-xs tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'consult' ? 'bg-white text-amber-600 border-b-4 border-amber-600' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          <Search className="w-4 h-4" /> CONSULTAR STOCK
        </button>
      </div>

      <div className="p-6 md:p-10">
        {activeTab === 'record' ? (
          <form onSubmit={handleSave} className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Tipo de Dispositivo */}
              <div className="relative">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Tipo de Dispositivo</label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-amber-500 transition-all">
                  <Smartphone className="w-4 h-4 text-slate-400 mr-3" />
                  <input 
                    list="deviceTypes"
                    value={formData.deviceType}
                    onChange={e => setFormData({...formData, deviceType: e.target.value})}
                    placeholder="Ex: iPhone, Portátil"
                    className="bg-transparent w-full outline-none text-sm font-semibold"
                    required
                  />
                  <datalist id="deviceTypes">
                    {suggestions.deviceTypes.map(t => <option key={t} value={t} />)}
                  </datalist>
                </div>
              </div>

              {/* Marca */}
              <div className="relative">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Marca</label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-amber-500 transition-all">
                  <Tag className="w-4 h-4 text-slate-400 mr-3" />
                  <input 
                    list="brands"
                    value={formData.brand}
                    onChange={e => setFormData({...formData, brand: e.target.value})}
                    placeholder="Ex: Apple, Samsung"
                    className="bg-transparent w-full outline-none text-sm font-semibold"
                    required
                  />
                  <datalist id="brands">
                    {Object.keys(suggestions.brands).map(b => <option key={b} value={b} />)}
                  </datalist>
                </div>
              </div>

              {/* Modelo */}
              <div className="relative">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Modelo</label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-amber-500 transition-all">
                  <Layers className="w-4 h-4 text-slate-400 mr-3" />
                  <input 
                    value={formData.model}
                    onChange={e => setFormData({...formData, model: e.target.value})}
                    placeholder="Ex: 15 Pro Max"
                    className="bg-transparent w-full outline-none text-sm font-semibold"
                    required
                  />
                </div>
              </div>

              {/* Condição */}
              <div className="relative">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Condição</label>
                <select 
                  value={formData.condition}
                  onChange={e => setFormData({...formData, condition: e.target.value as DeviceCondition})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none text-sm font-semibold appearance-none"
                >
                  {Object.values(DeviceCondition).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Armazenamento */}
              <div className="relative">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Capacidade</label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                  <Hash className="w-4 h-4 text-slate-400 mr-3" />
                  <input 
                    list="storages"
                    value={formData.storage}
                    onChange={e => setFormData({...formData, storage: e.target.value})}
                    placeholder="Ex: 256GB"
                    className="bg-transparent w-full outline-none text-sm font-semibold"
                  />
                  <datalist id="storages">
                    {suggestions.storages.map(s => <option key={s} value={s} />)}
                  </datalist>
                </div>
              </div>

              {/* Cor */}
              <div className="relative">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Cor</label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                  <Palette className="w-4 h-4 text-slate-400 mr-3" />
                  <input 
                    list="colors"
                    value={formData.color}
                    onChange={e => setFormData({...formData, color: e.target.value})}
                    placeholder="Ex: Titânio Natural"
                    className="bg-transparent w-full outline-none text-sm font-semibold"
                  />
                  <datalist id="colors">
                    {suggestions.colors.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
              </div>

              {/* Preço de Compra */}
              <div className="relative">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Preço de Compra (Kz)</label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 ring-2 ring-amber-100">
                  <DollarSign className="w-4 h-4 text-amber-600 mr-3" />
                  <input 
                    type="number"
                    value={formData.purchasePrice || ''}
                    onChange={e => setFormData({...formData, purchasePrice: Number(e.target.value)})}
                    placeholder="0.00"
                    className="bg-transparent w-full outline-none text-sm font-bold text-amber-900"
                    required
                  />
                </div>
              </div>

              {/* Preço de Compra Total (Visualização) */}
              <div className="relative">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Total com Taxas (Auto)</label>
                <div className="flex items-center bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 mr-3" />
                  <span className="text-sm font-black text-amber-900">{formatAOA(totalPrice)}</span>
                </div>
              </div>
            </div>

            {/* Outras especificações */}
            <div className="relative">
              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Outras Especificações (Máx. 500 carateres)</label>
              <div className="flex items-start bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <Info className="w-4 h-4 text-slate-400 mr-3 mt-1" />
                <textarea 
                  value={formData.specs}
                  onChange={e => setFormData({...formData, specs: e.target.value.substring(0, 500)})}
                  placeholder="Introduza detalhes adicionais como IMEI, nº de série ou estado da bateria..."
                  className="bg-transparent w-full outline-none text-sm font-medium h-24 resize-none"
                />
              </div>
              <p className="text-[10px] text-right text-slate-400 mt-1 font-bold">{formData.specs.length}/500</p>
            </div>

            <button 
              type="submit" 
              className="w-full p-5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-amber-100 transition-all flex items-center justify-center gap-3"
            >
              <Package className="w-6 h-6" /> ADICIONAR AO INVENTÁRIO
            </button>
          </form>
        ) : (
          <div id="stock-report-area" className="space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 print:hidden">
              <button 
                onClick={() => window.print()} 
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-xs hover:bg-black transition-all"
              >
                <Printer className="w-4 h-4" /> EXPORTAR PDF DE STOCK
              </button>
              
              <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-xl border border-slate-200">
                 <div className="flex items-center gap-1.5 px-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div><span className="text-[10px] font-black text-slate-500 uppercase">Livre</span></div>
                 <div className="flex items-center gap-1.5 px-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div><span className="text-[10px] font-black text-slate-500 uppercase">Reserva</span></div>
                 <div className="flex items-center gap-1.5 px-2"><div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div><span className="text-[10px] font-black text-slate-500 uppercase">Vendido</span></div>
              </div>
            </div>

            <div className="print:block hidden border-b-4 border-slate-900 pb-4 mb-8">
              <h2 className="text-2xl font-black uppercase tracking-tighter">Relatório Consolidado de Inventário</h2>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">IMPORT ANGOLA PRO • {new Date().toLocaleDateString('pt-PT')}</p>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-slate-100 shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-900 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  <tr>
                    <th className="p-5">No.</th>
                    <th className="p-5">Estado</th>
                    <th className="p-5">Dispositivo</th>
                    <th className="p-5">Especificações</th>
                    <th className="p-5 text-right">Custo Stock</th>
                    <th className="p-5 text-center print:hidden">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {items.length > 0 ? items.map(item => {
                    const status = getItemStatus(item);
                    return (
                      <tr key={item.timestamp} className="hover:bg-slate-50 transition-colors">
                        <td className="p-5 font-bold text-slate-400 text-sm">#{item.id}</td>
                        <td className="p-5">
                          <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase border ${status.bg} ${status.color} border-current opacity-80`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="p-5">
                          <div className="font-black text-slate-900 text-sm uppercase tracking-tight">{item.brand} {item.model}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">{item.deviceType}</div>
                        </td>
                        <td className="p-5">
                          <div className="text-[10px] font-black text-slate-700 uppercase">{item.storage} • {item.color}</div>
                          <div className="text-[9px] text-slate-400 font-medium truncate max-w-[200px]">{item.condition} • {item.specs || 'Sem notas'}</div>
                        </td>
                        <td className="p-5 text-right">
                          <div className="font-black text-amber-600 text-sm">{formatAOA(item.totalPurchasePrice)}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Preço Final</div>
                        </td>
                        <td className="p-5 text-center print:hidden">
                          <button 
                            onClick={() => handleDelete(item.id)} 
                            className="p-3 text-rose-500 hover:bg-rose-50 hover:text-rose-700 rounded-2xl transition-all"
                            title="Eliminar Registo"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={6} className="p-20 text-center">
                        <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-black uppercase tracking-widest text-sm">O inventário está vazio</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #stock-report-area, #stock-report-area * { visibility: visible !important; }
          #stock-report-area { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; margin: 0 !important; padding: 40px !important; }
          .print\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default InventorySystem;
