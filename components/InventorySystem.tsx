
import React, { useState, useEffect, useMemo } from 'react';
import { InventoryItem, DeviceCondition, SuggestionStore } from '../types';
import { 
  Package, 
  Plus, 
  Search, 
  Trash2, 
  Smartphone,
  Hash,
  Tag,
  Layers,
  Palette,
  Info,
  DollarSign,
  CheckCircle2,
  Truck,
  ShieldAlert,
  PlusCircle,
  Box,
  Eye,
  Edit2,
  XCircle
} from 'lucide-react';

const InventorySystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'record' | 'consult'>('record');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  const INV_KEY = 'angola_inv_v4';
  const SUGG_KEY = 'angola_sugg_v4';

  const [suggestions, setSuggestions] = useState<SuggestionStore>({
    deviceTypes: [],
    brands: {},
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
    purchasePrice: 0,
    freight: 0,
    customsExpenses: 0,
    additionalExpenses: 0
  });

  useEffect(() => {
    const saved = localStorage.getItem(INV_KEY);
    const savedSugg = localStorage.getItem(SUGG_KEY);
    if (saved) setItems(JSON.parse(saved));
    if (savedSugg) setSuggestions(JSON.parse(savedSugg));
  }, []);

  // Lógica de cálculo solicitada (Campo 10 e 12)
  const calculateFees = (base: number) => {
    if (!base || base <= 0) return 0;
    const comm1 = base * 0.03;
    const iva1 = comm1 * 0.14;
    const subtotal = base + comm1 + iva1;
    const comm2 = subtotal * 0.02;
    const iva2 = comm2 * 0.14;
    return subtotal + comm2 + iva2;
  };

  const totalPurchasePrice = useMemo(() => calculateFees(formData.purchasePrice), [formData.purchasePrice]);
  const totalFreight = useMemo(() => calculateFees(formData.freight), [formData.freight]);
  const finalTotalCost = totalPurchasePrice + totalFreight + formData.customsExpenses + formData.additionalExpenses;

  const updateSuggestions = (data: typeof formData) => {
    const newSugg = { ...suggestions };
    if (data.deviceType && !newSugg.deviceTypes.includes(data.deviceType)) newSugg.deviceTypes.push(data.deviceType);
    if (data.deviceType && data.brand) {
      if (!newSugg.brands[data.deviceType]) newSugg.brands[data.deviceType] = [];
      if (!newSugg.brands[data.deviceType].includes(data.brand)) newSugg.brands[data.deviceType].push(data.brand);
    }
    if (data.brand && data.model) {
      if (!newSugg.models[data.brand]) newSugg.models[data.brand] = [];
      if (!newSugg.models[data.brand].includes(data.model)) newSugg.models[data.brand].push(data.model);
    }
    if (data.storage && !newSugg.storages.includes(data.storage)) newSugg.storages.push(data.storage);
    if (data.color && !newSugg.colors.includes(data.color)) newSugg.colors.push(data.color);
    setSuggestions(newSugg);
    localStorage.setItem(SUGG_KEY, JSON.stringify(newSugg));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingItem) {
      const updatedItems = items.map(item => 
        item.timestamp === editingItem.timestamp 
        ? { 
            ...item, 
            ...formData, 
            totalPurchasePrice, 
            totalFreight, 
            totalCost: finalTotalCost 
          } 
        : item
      );
      setItems(updatedItems);
      localStorage.setItem(INV_KEY, JSON.stringify(updatedItems));
      setEditingItem(null);
    } else {
      const nextId = items.length + 1;
      const newItem: InventoryItem = {
        id: nextId,
        ...formData,
        totalPurchasePrice,
        totalFreight,
        totalCost: finalTotalCost,
        timestamp: Date.now(),
        dateStr: new Date().toLocaleDateString('pt-PT'),
        isSold: false
      };
      const updated = [...items, newItem];
      setItems(updated);
      localStorage.setItem(INV_KEY, JSON.stringify(updated));
    }

    updateSuggestions(formData);
    resetForm();
    setActiveTab('consult');
  };

  const resetForm = () => {
    setFormData({
      deviceType: '', brand: '', model: '', condition: DeviceCondition.NEW,
      storage: '', color: '', specs: '', purchasePrice: 0,
      freight: 0, customsExpenses: 0, additionalExpenses: 0
    });
    setEditingItem(null);
  };

  const handleEditClick = (item: InventoryItem) => {
    setFormData({
      deviceType: item.deviceType,
      brand: item.brand,
      model: item.model,
      condition: item.condition,
      storage: item.storage,
      color: item.color,
      specs: item.specs,
      purchasePrice: item.purchasePrice,
      freight: item.freight,
      customsExpenses: item.customsExpenses,
      additionalExpenses: item.additionalExpenses
    });
    setEditingItem(item);
    setActiveTab('record');
  };

  const handleDelete = (timestamp: number) => {
    if (confirm('Deseja eliminar este registo? A numeração será reajustada.')) {
      const filtered = items.filter(i => i.timestamp !== timestamp);
      const reindexed = filtered.map((item, idx) => ({ ...item, id: idx + 1 }));
      setItems(reindexed);
      localStorage.setItem(INV_KEY, JSON.stringify(reindexed));
    }
  };

  const formatAOA = (val: number) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(val);

  return (
    <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
      <div className="flex border-b border-slate-200 bg-slate-50 print:hidden">
        <button 
          onClick={() => { setActiveTab('record'); if(!editingItem) resetForm(); }} 
          className={`flex-1 py-5 font-black text-[11px] tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'record' ? 'bg-white text-indigo-600 border-b-4 border-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          <Plus className="w-4 h-4" /> {editingItem ? 'EDITAR ARTIGO' : '1. REGISTAR NOVO ARTIGO'}
        </button>
        <button 
          onClick={() => setActiveTab('consult')} 
          className={`flex-1 py-5 font-black text-[11px] tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'consult' ? 'bg-white text-indigo-600 border-b-4 border-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          <Search className="w-4 h-4" /> 2. CONSULTAR STOCK
        </button>
      </div>

      <div className="p-8">
        {activeTab === 'record' ? (
          <form onSubmit={handleSave} className="space-y-8 animate-fadeIn">
            {editingItem && (
              <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                <p className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                  <Edit2 className="w-4 h-4" /> Editando: {editingItem.brand} {editingItem.model} (#{editingItem.id})
                </p>
                <button type="button" onClick={resetForm} className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-[10px] font-bold uppercase">
                  <XCircle className="w-4 h-4" /> Cancelar Edição
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <div className="relative">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">2. Tipo de Dispositivo</label>
                <div className="flex items-center bg-white border border-slate-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                  <Smartphone className="w-4 h-4 text-slate-400 mr-3" />
                  <input list="l-types" value={formData.deviceType} onChange={e => setFormData({...formData, deviceType: e.target.value})} placeholder="Ex: iPhone" className="bg-transparent w-full outline-none text-sm font-semibold" required />
                  <datalist id="l-types">{suggestions.deviceTypes.map(t => <option key={t} value={t} />)}</datalist>
                </div>
              </div>

              <div className="relative">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">3. Marca</label>
                <div className="flex items-center bg-white border border-slate-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                  <Tag className="w-4 h-4 text-slate-400 mr-3" />
                  <input list="l-brands" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} placeholder="Ex: Apple" className="bg-transparent w-full outline-none text-sm font-semibold" required />
                  <datalist id="l-brands">{suggestions.brands[formData.deviceType]?.map(b => <option key={b} value={b} />)}</datalist>
                </div>
              </div>

              <div className="relative">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">4. Modelo</label>
                <div className="flex items-center bg-white border border-slate-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                  <Layers className="w-4 h-4 text-slate-400 mr-3" />
                  <input list="l-models" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} placeholder="Ex: 15 Pro Max" className="bg-transparent w-full outline-none text-sm font-semibold" required />
                  <datalist id="l-models">{suggestions.models[formData.brand]?.map(m => <option key={m} value={m} />)}</datalist>
                </div>
              </div>

              <div className="relative">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">5. Condição</label>
                <select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value as DeviceCondition})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none text-sm font-semibold appearance-none">
                  {Object.values(DeviceCondition).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="relative">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">6. Armazenamento</label>
                <div className="flex items-center bg-white border border-slate-200 rounded-xl px-4 py-3">
                  <Hash className="w-4 h-4 text-slate-400 mr-3" />
                  <input list="l-storages" value={formData.storage} onChange={e => setFormData({...formData, storage: e.target.value})} placeholder="Ex: 256GB" className="bg-transparent w-full outline-none text-sm font-semibold" />
                  <datalist id="l-storages">{suggestions.storages.map(s => <option key={s} value={s} />)}</datalist>
                </div>
              </div>

              <div className="relative">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">7. Cor</label>
                <div className="flex items-center bg-white border border-slate-200 rounded-xl px-4 py-3">
                  <Palette className="w-4 h-4 text-slate-400 mr-3" />
                  <input list="l-colors" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} placeholder="Ex: Titânio" className="bg-transparent w-full outline-none text-sm font-semibold" />
                  <datalist id="l-colors">{suggestions.colors.map(c => <option key={c} value={c} />)}</datalist>
                </div>
              </div>
            </div>

            <div className="relative">
              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">8. Outras Especificações (Máx. 500)</label>
              <div className="flex items-start bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
                <Info className="w-4 h-4 text-slate-400 mr-3 mt-1" />
                <textarea value={formData.specs} onChange={e => setFormData({...formData, specs: e.target.value.substring(0, 500)})} placeholder="IMEI, Estado da Bateria, etc..." className="bg-transparent w-full outline-none text-sm font-medium h-20 resize-none" />
              </div>
              <p className="text-[10px] text-right text-slate-400 mt-1 font-bold">{formData.specs.length}/500</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-6 bg-indigo-50/30 rounded-3xl border border-indigo-100 space-y-6">
                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> Custos de Aquisição
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">9. Preço de Compra (Kz)</label>
                    <input type="number" value={formData.purchasePrice || ''} onChange={e => setFormData({...formData, purchasePrice: Number(e.target.value)})} placeholder="0.00" className="w-full p-3 bg-white border border-indigo-200 rounded-xl text-sm font-bold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-indigo-500 block mb-1">10. Preço Total de Compra (Auto)</label>
                    <div className="w-full p-3 bg-indigo-100/50 border border-indigo-200 rounded-xl text-sm font-black text-indigo-900">
                      {formatAOA(totalPurchasePrice)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-blue-50/30 rounded-3xl border border-blue-100 space-y-6">
                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                  <Truck className="w-4 h-4" /> Custos de Logística
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">11. Frete Bruto (Kz)</label>
                    <input type="number" value={formData.freight || ''} onChange={e => setFormData({...formData, freight: Number(e.target.value)})} placeholder="0.00" className="w-full p-3 bg-white border border-blue-200 rounded-xl text-sm font-bold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-blue-500 block mb-1">12. Frete Total (Auto)</label>
                    <div className="w-full p-3 bg-blue-100/50 border border-blue-200 rounded-xl text-sm font-black text-blue-900">
                      {formatAOA(totalFreight)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">13. Despesas Alfandegárias (Kz)</label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                  <ShieldAlert className="w-4 h-4 text-rose-500 mr-3" />
                  <input type="number" value={formData.customsExpenses || ''} onChange={e => setFormData({...formData, customsExpenses: Number(e.target.value)})} placeholder="0.00" className="bg-transparent w-full outline-none text-sm font-semibold" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">14. Despesas Adicionais (Kz)</label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                  <PlusCircle className="w-4 h-4 text-amber-500 mr-3" />
                  <input type="number" value={formData.additionalExpenses || ''} onChange={e => setFormData({...formData, additionalExpenses: Number(e.target.value)})} placeholder="0.00" className="bg-transparent w-full outline-none text-sm font-semibold" />
                </div>
              </div>
              <div className="bg-indigo-900 rounded-2xl p-4 text-white shadow-lg ring-4 ring-indigo-100">
                <label className="text-[9px] font-black uppercase text-indigo-300 mb-1 block">15. Custo Total Real</label>
                <div className="text-xl font-black">{formatAOA(finalTotalCost)}</div>
              </div>
            </div>

            <button type="submit" className={`w-full p-6 ${editingItem ? 'bg-indigo-800' : 'bg-indigo-600'} hover:opacity-90 text-white rounded-3xl font-black text-lg shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95`}>
              <Box className="w-6 h-6" /> {editingItem ? 'ATUALIZAR REGISTO DE INVENTÁRIO' : 'FINALIZAR REGISTO DE INVENTÁRIO'}
            </button>
          </form>
        ) : (
          <div className="animate-fadeIn space-y-6">
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-black text-sm text-slate-400 uppercase tracking-widest">Stock Ativo ({items.length})</h3>
               <button onClick={() => window.print()} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider">Exportar Lista</button>
            </div>
            
            <div className="overflow-x-auto rounded-3xl border border-slate-100 shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-900 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  <tr>
                    <th className="p-5">Nº</th>
                    <th className="p-5">Artigo</th>
                    <th className="p-5">Especificações</th>
                    <th className="p-5 text-center">Estado</th>
                    <th className="p-5 text-right">C. Total Real</th>
                    <th className="p-5 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.length > 0 ? items.map(item => (
                    <tr key={item.timestamp} className="hover:bg-slate-50 transition-colors">
                      <td className="p-5 font-black text-indigo-600 text-sm">#{item.id}</td>
                      <td className="p-5">
                        <div className="font-black text-slate-900 text-sm uppercase">{item.brand} {item.model}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">{item.deviceType} • {item.storage} • {item.color}</div>
                      </td>
                      <td className="p-5">
                        <div className="text-[10px] font-medium text-slate-600 max-w-[200px] truncate" title={item.specs}>{item.specs || 'Nenhuma especificação'}</div>
                      </td>
                      <td className="p-5 text-center">
                        <span className={`text-[9px] font-black px-2 py-1 rounded-full ${item.isSold ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {item.isSold ? 'INDISPONÍVEL' : 'DISPONÍVEL'}
                        </span>
                      </td>
                      <td className="p-5 text-right">
                        <div className="font-black text-indigo-600 text-sm">{formatAOA(item.totalCost)}</div>
                      </td>
                      <td className="p-5 text-center flex items-center justify-center gap-2">
                        <button onClick={() => handleEditClick(item)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Editar">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(item.timestamp)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Eliminar">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="p-20 text-center text-slate-300 font-bold uppercase text-xs tracking-widest">Sem itens em stock</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventorySystem;
