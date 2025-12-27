import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockService } from '../services/mockData';
import { Client, Budget, Status } from '../types';
import { Phone, Mail, Car, X, Save, Plus, FileText, Calendar, DollarSign, Clock, Pencil, Trash2, AlertTriangle } from 'lucide-react';

const Clients: React.FC = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State (Edit/Create Client)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState<Partial<Client>>({});

  // Delete Confirmation Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<{ id: string, name: string } | null>(null);

  // History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [clientHistory, setClientHistory] = useState<Budget[]>([]);
  const [historyClientName, setHistoryClientName] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const data = await mockService.getClients();
    setClients(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenNewClient = () => {
    setCurrentClient({
      id: '',
      name: '',
      email: '',
      phone: '',
      vehicles: []
    });
    setIsModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setCurrentClient({ ...client });
    setIsModalOpen(true);
  };

  const handleOpenDelete = (client: Client) => {
    setClientToDelete({ id: client.id, name: client.name });
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!clientToDelete) return;
    
    await mockService.deleteClient(clientToDelete.id);
    await fetchData(); // Refresh list
    
    setIsDeleteModalOpen(false);
    setClientToDelete(null);
  };

  const handleCreateBudget = (client: Client) => {
    // Navigate to Budgets page with a query param to open the new budget modal for this client
    navigate(`/budgets?new=true&clientId=${client.id}`);
  };

  const handleViewHistory = async (client: Client) => {
    setHistoryClientName(client.name);
    // Fetch all budgets and filter by this client
    // In a real API, this would likely be an endpoint like /clients/:id/budgets
    const allBudgets = await mockService.getBudgets();
    const history = allBudgets
      .filter(b => b.clientId === client.id)
      .sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()); // Sort desc by date

    setClientHistory(history);
    setIsHistoryModalOpen(true);
  };

  const handleSaveClient = async () => {
    if (!currentClient.name) return alert("Nome obrigatório");

    const clientToSave: Client = {
        id: currentClient.id || '', // Service generates ID if empty
        name: currentClient.name,
        email: currentClient.email || '',
        phone: currentClient.phone || '',
        vehicles: currentClient.vehicles || []
    };

    // Persist to service/backend
    await mockService.saveClient(clientToSave);
    
    // Refresh local list
    await fetchData();

    setIsModalOpen(false);
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case Status.APPROVED: return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case Status.PENDING: return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case Status.IN_PROGRESS: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case Status.COMPLETED: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clientes</h1>
        <button 
          onClick={handleOpenNewClient}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Adicionar Cliente
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
           <p className="text-gray-500">Carregando clientes...</p>
        ) : (
          clients.map((client) => (
            <div key={client.id} className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 p-6 shadow-sm hover:shadow-md transition-shadow relative group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold">
                    {client.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{client.name}</h3>
                    <p className="text-xs text-gray-500">ID: {client.id}</p>
                  </div>
                </div>
                
                {/* Actions Icons */}
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleEditClient(client)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                    title="Editar Cliente"
                  >
                    <Pencil size={18} />
                  </button>
                  <button 
                    onClick={() => handleOpenDelete(client)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                    title="Excluir Cliente"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Phone size={16} />
                  <span>{client.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Mail size={16} />
                  <span>{client.email}</span>
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-dark-800 pt-4">
                <h4 className="text-xs font-semibold uppercase text-gray-500 mb-3 flex items-center gap-1">
                  <Car size={14} /> Veículos
                </h4>
                <div className="space-y-2">
                  {client.vehicles.length > 0 ? (
                    client.vehicles.map(v => (
                      <div key={v.id} className="text-sm bg-gray-50 dark:bg-dark-950 p-2 rounded border border-gray-200 dark:border-dark-800 flex justify-between">
                        <span className="font-medium text-gray-800 dark:text-gray-200">{v.make} {v.model}</span>
                        <span className="text-gray-500 text-xs bg-white dark:bg-dark-900 px-1 rounded border border-gray-100 dark:border-dark-800">{v.plate}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic">Nenhum veículo cadastrado.</p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                 <button 
                    onClick={() => handleViewHistory(client)}
                    className="flex-1 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                 >
                    Histórico
                 </button>
                 <button 
                    onClick={() => handleCreateBudget(client)}
                    className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                 >
                    Orçamento
                 </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Client Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-900 w-full max-w-md rounded-xl shadow-2xl border border-gray-200 dark:border-dark-700 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-dark-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {currentClient.id ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo</label>
                <input 
                  type="text"
                  value={currentClient.name || ''}
                  onChange={(e) => setCurrentClient({...currentClient, name: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-dark-950 border border-gray-300 dark:border-dark-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone / WhatsApp</label>
                <input 
                  type="text"
                  value={currentClient.phone || ''}
                  onChange={(e) => setCurrentClient({...currentClient, phone: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-dark-950 border border-gray-300 dark:border-dark-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input 
                  type="email"
                  value={currentClient.email || ''}
                  onChange={(e) => setCurrentClient({...currentClient, email: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-dark-950 border border-gray-300 dark:border-dark-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              {!currentClient.id && (
                <div className="text-xs text-gray-500 italic mt-2">
                  * Veículos podem ser adicionados na tela de Veículos após salvar o cliente.
                </div>
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
                onClick={handleSaveClient}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Save size={18} /> Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-900 w-full max-w-2xl rounded-xl shadow-2xl border border-gray-200 dark:border-dark-700 flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-dark-800">
              <div className="flex flex-col">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText size={20} className="text-primary-500"/>
                  Histórico de Orçamentos
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">Cliente: {historyClientName}</span>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-0 overflow-y-auto">
              {clientHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Clock size={48} className="text-gray-300 dark:text-dark-700 mb-3" />
                  <p>Nenhum orçamento encontrado para este cliente.</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
                  <thead className="bg-gray-50 dark:bg-dark-950 text-gray-700 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-dark-800">
                    <tr>
                      <th className="px-6 py-3">ID / Data</th>
                      <th className="px-6 py-3">Veículo</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-dark-800">
                    {clientHistory.map((budget) => (
                      <tr key={budget.id} className="hover:bg-gray-50 dark:hover:bg-dark-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-mono font-medium text-gray-900 dark:text-white">#{budget.id.toUpperCase()}</span>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                              <Calendar size={12} />
                              {new Date(budget.dateCreated).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Car size={16} className="text-gray-400" />
                            <span>{budget.vehicleName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(budget.status)}`}>
                            {budget.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 font-medium text-gray-900 dark:text-white">
                             <DollarSign size={14} className="text-gray-400" />
                             {budget.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 dark:bg-dark-950/50 border-t border-gray-200 dark:border-dark-800 rounded-b-xl flex justify-end">
              <button 
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {isDeleteModalOpen && clientToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-900 w-full max-w-sm rounded-xl shadow-2xl border border-gray-200 dark:border-dark-700 p-6 flex flex-col items-center text-center animate-in fade-in zoom-in duration-200">
             <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-500 mb-4">
                <AlertTriangle size={24} />
             </div>
             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
               Confirmar Exclusão
             </h3>
             <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
               Tem certeza que deseja excluir o cliente <strong>{clientToDelete.name}</strong>? Esta ação não pode ser desfeita.
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

export default Clients;