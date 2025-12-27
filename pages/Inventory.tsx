import React, { useEffect, useState } from 'react';
import { mockService } from '../services/mockData';
import { Part, Service } from '../types';
import { Search, Plus, Package, Wrench, Pencil, Trash2, AlertTriangle, X, Save, Clock } from 'lucide-react';

type Tab = 'parts' | 'services';

const Inventory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('parts');
  const [parts, setParts] = useState<Part[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState(10);

  // Modal State (Edit/Create)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Partial<Part> | null>(null);
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);

  // Delete Confirmation Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'part' | 'service', name: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [pData, sData, settings] = await Promise.all([
      mockService.getParts(),
      mockService.getServices(),
      mockService.getCompanySettings()
    ]);
    setParts(pData);
    setServices(sData);
    if (settings.lowStockThreshold !== undefined) {
      setLowStockThreshold(settings.lowStockThreshold);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter Logic
  const filteredParts = parts.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Handlers ---

  const handleOpenDelete = (id: string, type: 'part' | 'service', name: string) => {
    setItemToDelete({ id, type, name });
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === 'part') {
        await mockService.deletePart(itemToDelete.id);
      } else {
        await mockService.deleteService(itemToDelete.id);
      }
      await fetchData(); // Refresh list after deletion
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error("Erro ao excluir item:", error);
      alert("Erro ao excluir item. Tente novamente.");
    }
  };

  const handleOpenAdd = () => {
    if (activeTab === 'parts') {
      setEditingPart({ id: '', name: '', sku: '', stock: 0, cost: 0, price: 0 });
      setEditingService(null);
    } else {
      setEditingService({ id: '', name: '', price: 0, estimatedTime: 60 });
      setEditingPart(null);
    }
    setIsModalOpen(true);
  };

  const handleEditPart = (part: Part) => {
    setEditingPart({ ...part });
    setEditingService(null);
    setIsModalOpen(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService({ ...service });
    setEditingPart(null);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (activeTab === 'parts' && editingPart) {
        if(!editingPart.name || !editingPart.sku) return alert("Nome e SKU são obrigatórios");
        await mockService.savePart(editingPart as Part);
    } else if (activeTab === 'services' && editingService) {
        if(!editingService.name) return alert("Nome do serviço é obrigatório");
        await mockService.saveService(editingService as Service);
    }
    setIsModalOpen(false);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Estoque & Serviços</h1>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus size={20} />
          {activeTab === 'parts' ? 'Nova Peça' : 'Novo Serviço'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-white dark:bg-dark-900 p-1 rounded-xl border border-gray-200 dark:border-dark-800 w-fit">
        <button
          onClick={() => setActiveTab('parts')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'parts'
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Package size={18} /> Estoque (Peças)
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'services'
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Wrench size={18} /> Mão de Obra
        </button>
      </div>

      <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 shadow-sm overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-dark-800">
          <div className="relative max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <Search size={18} />
            </span>
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={activeTab === 'parts' ? "Buscar peça por nome ou SKU..." : "Buscar serviço..."}
              className="w-full bg-gray-50 dark:bg-dark-950 border border-gray-200 dark:border-dark-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        {/* --- PARTS TABLE --- */}
        {activeTab === 'parts' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
              <thead className="bg-gray-50 dark:bg-dark-950 text-gray-700 dark:text-gray-300 font-semibold uppercase text-xs">
                <tr>
                  <th className="px-6 py-4">Peça</th>
                  <th className="px-6 py-4">Estoque</th>
                  <th className="px-6 py-4 text-right">Custo Unit.</th>
                  <th className="px-6 py-4 text-right">Venda Unit.</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-dark-800">
                {loading ? (
                    <tr><td colSpan={5} className="p-6 text-center">Carregando...</td></tr>
                ) : filteredParts.length === 0 ? (
                    <tr><td colSpan={5} className="p-6 text-center text-gray-500">Nenhuma peça encontrada.</td></tr>
                ) : (
                  filteredParts.map((part) => (
                    <tr key={part.id} className="hover:bg-gray-50 dark:hover:bg-dark-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                            <span className="font-medium text-gray-900 dark:text-white">{part.name}</span>
                            <span className="text-xs text-gray-500 font-mono">SKU: {part.sku}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                            <span className={`font-medium ${part.stock < lowStockThreshold ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                                {part.stock} unid.
                            </span>
                            {part.stock < lowStockThreshold && (
                                <span title="Estoque Baixo">
                                    <AlertTriangle size={14} className="text-red-500" />
                                </span>
                            )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-500">
                        R$ {part.cost.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">
                        R$ {part.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                             onClick={() => handleEditPart(part)}
                             className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                             title="Editar"
                          >
                             <Pencil size={16} />
                          </button>
                          <button 
                             onClick={() => handleOpenDelete(part.id, 'part', part.name)}
                             className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                             title="Excluir"
                          >
                             <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* --- SERVICES TABLE --- */}
        {activeTab === 'services' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
              <thead className="bg-gray-50 dark:bg-dark-950 text-gray-700 dark:text-gray-300 font-semibold uppercase text-xs">
                <tr>
                  <th className="px-6 py-4">Descrição do Serviço</th>
                  <th className="px-6 py-4">Tempo Estimado</th>
                  <th className="px-6 py-4 text-right">Valor Mão de Obra</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-dark-800">
                {loading ? (
                    <tr><td colSpan={4} className="p-6 text-center">Carregando...</td></tr>
                ) : filteredServices.length === 0 ? (
                    <tr><td colSpan={4} className="p-6 text-center text-gray-500">Nenhum serviço encontrado.</td></tr>
                ) : (
                  filteredServices.map((service) => (
                    <tr key={service.id} className="hover:bg-gray-50 dark:hover:bg-dark-800/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{service.name}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                            <Clock size={14} className="text-gray-400"/>
                            {service.estimatedTime} min
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">
                        R$ {service.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                             onClick={() => handleEditService(service)}
                             className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                             title="Editar"
                          >
                             <Pencil size={16} />
                          </button>
                          <button 
                             onClick={() => handleOpenDelete(service.id, 'service', service.name)}
                             className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                             title="Excluir"
                          >
                             <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- ADD/EDIT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-dark-900 w-full max-w-lg rounded-xl shadow-2xl border border-gray-200 dark:border-dark-700 flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-dark-800">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        {activeTab === 'parts' 
                            ? (editingPart?.id ? <Pencil size={20} className="text-blue-500"/> : <Plus size={20} className="text-primary-500"/>)
                            : (editingService?.id ? <Pencil size={20} className="text-blue-500"/> : <Plus size={20} className="text-primary-500"/>)
                        }
                        {activeTab === 'parts' 
                            ? (editingPart?.id ? 'Editar Peça' : 'Nova Peça') 
                            : (editingService?.id ? 'Editar Serviço' : 'Novo Serviço')
                        }
                    </h2>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {activeTab === 'parts' && editingPart && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome da Peça</label>
                                <input 
                                    type="text" 
                                    value={editingPart.name} 
                                    onChange={e => setEditingPart({...editingPart, name: e.target.value})}
                                    className="w-full bg-gray-50 dark:bg-dark-950 border border-gray-300 dark:border-dark-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SKU / Código</label>
                                    <input 
                                        type="text" 
                                        value={editingPart.sku} 
                                        onChange={e => setEditingPart({...editingPart, sku: e.target.value})}
                                        className="w-full bg-gray-50 dark:bg-dark-950 border border-gray-300 dark:border-dark-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estoque Atual</label>
                                    <input 
                                        type="number" 
                                        value={editingPart.stock} 
                                        onChange={e => setEditingPart({...editingPart, stock: parseInt(e.target.value) || 0})}
                                        className="w-full bg-gray-50 dark:bg-dark-950 border border-gray-300 dark:border-dark-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Custo (R$)</label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        value={editingPart.cost} 
                                        onChange={e => setEditingPart({...editingPart, cost: parseFloat(e.target.value) || 0})}
                                        className="w-full bg-gray-50 dark:bg-dark-950 border border-gray-300 dark:border-dark-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preço de Venda (R$)</label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        value={editingPart.price} 
                                        onChange={e => setEditingPart({...editingPart, price: parseFloat(e.target.value) || 0})}
                                        className="w-full bg-gray-50 dark:bg-dark-950 border border-gray-300 dark:border-dark-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'services' && editingService && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Serviço</label>
                                <input 
                                    type="text" 
                                    value={editingService.name} 
                                    onChange={e => setEditingService({...editingService, name: e.target.value})}
                                    className="w-full bg-gray-50 dark:bg-dark-950 border border-gray-300 dark:border-dark-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tempo Estimado (min)</label>
                                    <input 
                                        type="number" 
                                        value={editingService.estimatedTime} 
                                        onChange={e => setEditingService({...editingService, estimatedTime: parseInt(e.target.value) || 0})}
                                        className="w-full bg-gray-50 dark:bg-dark-950 border border-gray-300 dark:border-dark-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor do Serviço (R$)</label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        value={editingService.price} 
                                        onChange={e => setEditingService({...editingService, price: parseFloat(e.target.value) || 0})}
                                        className="w-full bg-gray-50 dark:bg-dark-950 border border-gray-300 dark:border-dark-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="px-6 py-4 bg-gray-50 dark:bg-dark-950/50 border-t border-gray-200 dark:border-dark-800 rounded-b-xl flex justify-end gap-3">
                    <button 
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSave}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <Save size={18} /> Salvar
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {isDeleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-900 w-full max-w-sm rounded-xl shadow-2xl border border-gray-200 dark:border-dark-700 p-6 flex flex-col items-center text-center animate-in fade-in zoom-in duration-200">
             <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-500 mb-4">
                <AlertTriangle size={24} />
             </div>
             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
               Confirmar Exclusão
             </h3>
             <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
               Tem certeza que deseja excluir <strong>{itemToDelete.name}</strong>? Esta ação não pode ser desfeita.
             </p>
             <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-dark-700 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Sim, Excluir
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;