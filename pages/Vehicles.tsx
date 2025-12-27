import React, { useEffect, useState, useRef } from 'react';
import { mockService } from '../services/mockData';
import { Vehicle, Client, VehicleDamage } from '../types';
import { Search, Plus, Car, PenTool, Trash2, X, Save, User, Camera, Image as ImageIcon, AlertTriangle, CheckCircle2 } from 'lucide-react';

// Extended interface for display purposes
interface VehicleDisplay extends Vehicle {
  clientName: string;
}

const Vehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<VehicleDisplay[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState<Partial<Vehicle>>({});
  
  // Delete Confirmation Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<{ id: string, clientId: string, plate: string } | null>(null);

  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setLoading(true);
    const [vData, cData] = await Promise.all([
      mockService.getVehicles(),
      mockService.getClients()
    ]);
    setVehicles(vData);
    setClients(cData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenNewVehicle = () => {
    setCurrentVehicle({
      id: '',
      clientId: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      plate: '',
      mileage: 0,
      damages: []
    });
    setIsModalOpen(true);
  };

  const handleEditVehicle = (vehicle: VehicleDisplay) => {
    setCurrentVehicle({ ...vehicle, damages: vehicle.damages || [] });
    setIsModalOpen(true);
  };

  const handleOpenDelete = (vehicle: VehicleDisplay) => {
    setVehicleToDelete({ id: vehicle.id, clientId: vehicle.clientId, plate: vehicle.plate });
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!vehicleToDelete) return;
    
    await mockService.deleteVehicle(vehicleToDelete.id, vehicleToDelete.clientId);
    await fetchData(); // Refresh list
    
    setIsDeleteModalOpen(false);
    setVehicleToDelete(null);
  };

  const validatePlate = (plate: string) => {
    // Remove hyphen and spaces
    const clean = plate.replace(/[^A-Z0-9]/g, '').toUpperCase();
    
    // Check Old Format: 3 Letters + 4 Numbers (ABC1234)
    const isOld = /^[A-Z]{3}[0-9]{4}$/.test(clean);
    
    // Check Mercosul Format: 3 Letters + 1 Number + 1 Letter + 2 Numbers (ABC1D23)
    const isMercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(clean);

    return isOld || isMercosul;
  };

  const handleSaveVehicle = async () => {
    if (!currentVehicle.clientId) return alert("Selecione um cliente.");
    if (!currentVehicle.model) return alert("Modelo é obrigatório.");
    if (!currentVehicle.plate) return alert("Placa é obrigatória.");

    if (!validatePlate(currentVehicle.plate)) {
      return alert("Placa inválida. Certifique-se de usar o formato Padrão (ABC-1234) ou Mercosul (ABC1D23).");
    }

    await mockService.saveVehicle(currentVehicle as Vehicle);
    setIsModalOpen(false);
    fetchData(); // Refresh list
  };

  // --- Image Upload Logic ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const newDamage: VehicleDamage = {
          id: Math.random().toString(36).substr(2, 9),
          imageUrl: base64String,
          description: '',
          dateAdded: new Date().toISOString()
        };
        
        setCurrentVehicle(prev => ({
          ...prev,
          damages: [...(prev.damages || []), newDamage]
        }));
      };
      reader.readAsDataURL(file);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveDamage = (damageId: string) => {
    setCurrentVehicle(prev => ({
      ...prev,
      damages: (prev.damages || []).filter(d => d.id !== damageId)
    }));
  };

  const handleDescriptionChange = (damageId: string, newDescription: string) => {
    setCurrentVehicle(prev => ({
      ...prev,
      damages: (prev.damages || []).map(d => 
        d.id === damageId ? { ...d, description: newDescription } : d
      )
    }));
  };

  const getPlateStyle = (plate: string) => {
    // Simple check to style Mercosul differently in UI if needed, currently just returns style
    const clean = plate.replace(/[^A-Z0-9]/g, '').toUpperCase();
    const isMercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(clean);
    
    if (isMercosul) {
      return "bg-white border-blue-600 text-blue-700 dark:bg-dark-900 dark:text-blue-400 dark:border-blue-500";
    }
    return "bg-gray-100 text-gray-700 dark:bg-dark-800 dark:text-gray-300 dark:border-dark-700";
  };

  const filteredVehicles = vehicles.filter(v => 
    v.plate.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Veículos</h1>
        <button 
          onClick={handleOpenNewVehicle}
          className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus size={20} />
          Novo Veículo
        </button>
      </div>

      <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 shadow-sm overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200 dark:border-dark-800">
          <div className="relative max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <Search size={18} />
            </span>
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por placa, modelo ou cliente..." 
              className="w-full bg-gray-50 dark:bg-dark-950 border border-gray-200 dark:border-dark-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
            <thead className="bg-gray-50 dark:bg-dark-950 text-gray-700 dark:text-gray-300 font-semibold uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Veículo</th>
                <th className="px-6 py-4">Placa</th>
                <th className="px-6 py-4">Cliente (Proprietário)</th>
                <th className="px-6 py-4">Quilometragem</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-dark-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Carregando veículos...</td>
                </tr>
              ) : filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Nenhum veículo encontrado.</td>
                </tr>
              ) : (
                filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-gray-50 dark:hover:bg-dark-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                          <Car size={20} />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{vehicle.make} {vehicle.model}</div>
                          <div className="text-xs text-gray-500">Ano: {vehicle.year}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded border font-mono font-medium text-xs ${getPlateStyle(vehicle.plate)}`}>
                        {vehicle.plate}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <User size={14} className="text-gray-400"/>
                          <span className="text-gray-900 dark:text-white">{vehicle.clientName}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">{vehicle.mileage.toLocaleString('pt-BR')} km</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleEditVehicle(vehicle)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors" 
                          title="Editar"
                        >
                          <PenTool size={16} />
                        </button>
                        <button 
                          onClick={() => handleOpenDelete(vehicle)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" 
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
      </div>

      {/* --- Vehicle Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-900 w-full max-w-3xl rounded-xl shadow-2xl border border-gray-200 dark:border-dark-700 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-dark-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {currentVehicle.id ? <PenTool size={20} className="text-blue-500"/> : <Plus size={20} className="text-primary-500"/>}
                {currentVehicle.id ? 'Editar Veículo' : 'Novo Veículo'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Form Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Basic Info Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-dark-800 pb-2">
                  Dados do Veículo
                </h3>

                {/* Client Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Proprietário (Cliente)</label>
                  <select 
                    value={currentVehicle.clientId || ''}
                    onChange={(e) => setCurrentVehicle({ ...currentVehicle, clientId: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-dark-950 border border-gray-300 dark:border-dark-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Selecione um cliente...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name} - ID: {c.id.substring(0,8)}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Marca</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Honda"
                      value={currentVehicle.make || ''}
                      onChange={(e) => setCurrentVehicle({ ...currentVehicle, make: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-dark-950 border border-gray-300 dark:border-dark-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Modelo</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Civic"
                      value={currentVehicle.model || ''}
                      onChange={(e) => setCurrentVehicle({ ...currentVehicle, model: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-dark-950 border border-gray-300 dark:border-dark-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ano</label>
                    <input 
                      type="number" 
                      value={currentVehicle.year || ''}
                      onChange={(e) => setCurrentVehicle({ ...currentVehicle, year: parseInt(e.target.value) })}
                      className="w-full bg-gray-50 dark:bg-dark-950 border border-gray-300 dark:border-dark-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Placa (Antiga ou Mercosul)</label>
                    <input 
                      type="text" 
                      placeholder="ABC-1234 ou ABC1D23"
                      maxLength={8}
                      value={currentVehicle.plate || ''}
                      onChange={(e) => {
                        // Allow uppercase, alphanumeric and hyphen only
                        const val = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
                        setCurrentVehicle({ ...currentVehicle, plate: val });
                      }}
                      className="w-full bg-gray-50 dark:bg-dark-950 border border-gray-300 dark:border-dark-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                    />
                    <p className="text-xs text-gray-500 mt-1">Ex: <strong>ABC-1234</strong> (Padrão) ou <strong>ABC1D23</strong> (Mercosul)</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quilometragem Atual (km)</label>
                  <input 
                    type="number" 
                    value={currentVehicle.mileage || ''}
                    onChange={(e) => setCurrentVehicle({ ...currentVehicle, mileage: parseInt(e.target.value) })}
                    className="w-full bg-gray-50 dark:bg-dark-950 border border-gray-300 dark:border-dark-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Damage Photos Section */}
              <div className="space-y-4">
                 <div className="flex items-center justify-between border-b border-gray-200 dark:border-dark-800 pb-2">
                    <h3 className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">
                      Registro de Avarias / Fotos
                    </h3>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-dark-800 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors"
                    >
                       <Camera size={14} /> Adicionar Foto
                    </button>
                    {/* Hidden File Input */}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      capture="environment" // Enables camera on mobile
                      onChange={handleImageUpload}
                    />
                 </div>

                 {(!currentVehicle.damages || currentVehicle.damages.length === 0) ? (
                    <div className="text-center py-8 bg-gray-50 dark:bg-dark-950 rounded-lg border border-dashed border-gray-300 dark:border-dark-700">
                       <ImageIcon size={32} className="mx-auto text-gray-400 mb-2"/>
                       <p className="text-sm text-gray-500">Nenhuma foto de avaria registrada.</p>
                       <p className="text-xs text-gray-400">Clique em "Adicionar Foto" para documentar o estado do veículo.</p>
                    </div>
                 ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {currentVehicle.damages.map((damage) => (
                          <div key={damage.id} className="bg-gray-50 dark:bg-dark-950 p-3 rounded-lg border border-gray-200 dark:border-dark-800 flex flex-col gap-3">
                             <div className="relative aspect-video bg-black/5 rounded overflow-hidden group">
                                <img src={damage.imageUrl} alt="Avaria" className="w-full h-full object-cover" />
                                <button 
                                  onClick={() => handleRemoveDamage(damage.id)}
                                  className="absolute top-2 right-2 p-1.5 bg-red-600/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Remover Foto"
                                >
                                   <Trash2 size={14} />
                                </button>
                             </div>
                             <div>
                                <input 
                                  type="text" 
                                  placeholder="Descrição da avaria (ex: arranhão porta direita)" 
                                  value={damage.description}
                                  onChange={(e) => handleDescriptionChange(damage.id, e.target.value)}
                                  className="w-full text-xs bg-white dark:bg-dark-900 border border-gray-300 dark:border-dark-700 rounded px-2 py-1.5 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                                />
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-dark-950/50 border-t border-gray-200 dark:border-dark-800 rounded-b-xl flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveVehicle}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Save size={18} /> Salvar Veículo
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {isDeleteModalOpen && vehicleToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-900 w-full max-w-sm rounded-xl shadow-2xl border border-gray-200 dark:border-dark-700 p-6 flex flex-col items-center text-center animate-in fade-in zoom-in duration-200">
             <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-500 mb-4">
                <AlertTriangle size={24} />
             </div>
             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
               Confirmar Exclusão
             </h3>
             <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
               Tem certeza que deseja excluir o veículo <strong>{vehicleToDelete.plate}</strong>? Esta ação não pode ser desfeita.
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

export default Vehicles;