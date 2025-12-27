import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { mockService } from '../services/mockData';
import { Budget, Status, Client, Part, Service, BudgetLineItem } from '../types';
import { Plus, Search, Filter, Eye, Printer, Trash2, X, Save, Car, User, Pencil, CheckCircle2, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const Budgets: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Data for Dropdowns
  const [clients, setClients] = useState<Client[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [currentBudget, setCurrentBudget] = useState<Partial<Budget>>({ items: [] });
  
  // New Item State (inside modal)
  const [newItemType, setNewItemType] = useState<'PART' | 'SERVICE'>('SERVICE');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);

  // PDF Generation State
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfStatus, setPdfStatus] = useState<'generating' | 'success'>('generating');

  // Delete Confirmation Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<{ id: string, clientName: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [bData, cData, pData, sData] = await Promise.all([
      mockService.getBudgets(),
      mockService.getClients(),
      mockService.getParts(),
      mockService.getServices()
    ]);
    setBudgets(bData);
    setClients(cData);
    setParts(pData);
    setServices(sData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    // Check for URL params to auto-open modal (e.g. coming from Clients page)
    const isNew = searchParams.get('new') === 'true';
    const clientIdParam = searchParams.get('clientId');

    if (isNew && !loading) {
      // Logic handled after data load, but we can't depend on loading here directly in effect deps easily without loop
      // Simplified: We assume data is loaded fast enough or check loading state inside
    }
  }, []); 

  // Secondary effect to handle params when data is ready
  useEffect(() => {
    if (!loading) {
      const isNew = searchParams.get('new') === 'true';
      const clientIdParam = searchParams.get('clientId');

      if (isNew) {
        const initialBudget = {
          id: '',
          clientId: '',
          clientName: '',
          vehicleId: '',
          vehicleName: '',
          status: Status.PENDING,
          dateCreated: new Date().toISOString(),
          totalAmount: 0,
          items: [],
          notes: ''
        };

        if (clientIdParam) {
          const preSelectedClient = clients.find(c => c.id === clientIdParam);
          if (preSelectedClient) {
            initialBudget.clientId = preSelectedClient.id;
            initialBudget.clientName = preSelectedClient.name;
          }
        }

        setCurrentBudget(initialBudget);
        setIsViewOnly(false);
        setIsModalOpen(true);
        setSearchParams({});
      }
    }
  }, [loading, clients, searchParams, setSearchParams]);

  const getStatusColor = (status: Status) => {
    switch (status) {
      case Status.APPROVED: return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
      case Status.PENDING: return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case Status.IN_PROGRESS: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case Status.COMPLETED: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredBudgets = budgets.filter(budget => {
    const matchesSearch = 
      budget.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      budget.vehicleName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || budget.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // --- Handlers ---

  const handleOpenDelete = (budget: Budget) => {
    setBudgetToDelete({ id: budget.id, clientName: budget.clientName });
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!budgetToDelete) return;
    
    await mockService.deleteBudget(budgetToDelete.id);
    await fetchData(); // Refresh list
    
    setIsDeleteModalOpen(false);
    setBudgetToDelete(null);
  };

  const handlePrint = async (budget: Budget) => {
    setPdfModalOpen(true);
    setPdfStatus('generating');

    // Small delay to allow UI to render the modal before heavy processing
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const companySettings = await mockService.getCompanySettings();
      const doc = new jsPDF();
      
      // --- Header (Aligned with Reports.tsx style) ---
      
      // Logo Processing
      if (companySettings.logoUrl) {
        try {
          const imgProps = await new Promise<{width: number, height: number, format: string}>((resolve) => {
               const img = new Image();
               img.src = companySettings.logoUrl!;
               img.onload = () => {
                   let format = 'PNG';
                   const mimeType = companySettings.logoUrl!.split(';')[0];
                   if (mimeType.includes('jpeg') || mimeType.includes('jpg')) format = 'JPEG';
                   else if (mimeType.includes('webp')) format = 'WEBP';
                   
                   resolve({ width: img.width, height: img.height, format });
               };
               img.onerror = () => resolve({ width: 0, height: 0, format: 'PNG' });
          });

          if (imgProps.width > 0) {
              const maxW = 30;
              const maxH = 30;
              const aspect = imgProps.width / imgProps.height;
              
              let w = maxW;
              let h = maxH;

              if (aspect > 1) {
                  // Image is wider than tall
                  h = maxW / aspect;
              } else {
                  // Image is taller than wide or square
                  w = maxH * aspect;
              }
              
              doc.addImage(companySettings.logoUrl, imgProps.format, 14, 10, w, h);
          }
        } catch (e) {
          console.warn('Could not add logo', e);
        }
      }

      // Company Info (Standardized position matching Reports)
      const textX = companySettings.logoUrl ? 50 : 14;
      
      doc.setFontSize(16);
      doc.setTextColor(40);
      doc.setFont("helvetica", "bold");
      doc.text(companySettings.name || "AutoFix CRM", textX, 20);

      doc.setFontSize(9);
      doc.setTextColor(80);
      doc.setFont("helvetica", "normal");
      
      let currentY = 26;
      if (companySettings.address) {
        const splitAddress = doc.splitTextToSize(companySettings.address, 100);
        doc.text(splitAddress, textX, currentY);
        currentY += (splitAddress.length * 4);
      }
      
      if (companySettings.phone) {
          doc.text(`Tel: ${companySettings.phone}`, textX, currentY);
          currentY += 4;
      }
      
      if (companySettings.email) {
          doc.text(`Email: ${companySettings.email}`, textX, currentY);
      }

      // --- Document Title & Details (Vertical flow like Reports) ---
      const titleY = companySettings.logoUrl ? 50 : currentY + 10;

      doc.setFontSize(18);
      doc.setTextColor(0);
      doc.setFont("helvetica", "bold");
      doc.text("ORÇAMENTO", 14, titleY);
      
      doc.setFontSize(10);
      doc.setTextColor(80);
      doc.setFont("helvetica", "normal");
      
      doc.text(`Nº: #${budget.id.toUpperCase()}`, 14, titleY + 6);
      doc.text(`Data: ${new Date(budget.dateCreated).toLocaleDateString('pt-BR')}`, 14, titleY + 11);
      doc.text(`Status: ${budget.status}`, 14, titleY + 16);

      let finalY = titleY + 25;

      // --- Client Box ---
      doc.setDrawColor(200);
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(14, finalY, 182, 25, 2, 2, 'FD');
      
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.setFont("helvetica", "bold");
      doc.text("Dados do Cliente", 18, finalY + 7);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Nome: ${budget.clientName}`, 18, finalY + 13);
      doc.text(`Veículo: ${budget.vehicleName}`, 18, finalY + 19);

      // --- Table ---
      const tableColumn = ["Tipo", "Descrição", "Qtd", "Preço Unit.", "Total"];
      const tableRows = budget.items.map(item => [
        item.type === 'PART' ? 'Peça' : 'Serviço',
        item.name,
        item.quantity,
        `R$ ${item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `R$ ${item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      ]);

      autoTable(doc, {
        startY: finalY + 30,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 15, halign: 'center' },
          3: { cellWidth: 30, halign: 'right' },
          4: { cellWidth: 30, halign: 'right' }
        },
        foot: [['', '', '', 'TOTAL', `R$ ${budget.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]],
        footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'right' }
      });

      const tableEnd = (doc as any).lastAutoTable.finalY + 20;

      // Signature area
      doc.setDrawColor(0);
      doc.line(14, tableEnd + 20, 90, tableEnd + 20); // Client Line
      doc.line(110, tableEnd + 20, 186, tableEnd + 20); // Workshop Line
      
      doc.setFontSize(8);
      doc.text("Assinatura do Cliente", 14, tableEnd + 25);
      doc.text(companySettings.responsibleName ? `Assinatura: ${companySettings.responsibleName}` : "Assinatura do Responsável", 110, tableEnd + 25);

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text("Documento gerado eletronicamente por AutoFix CRM", 105, 290, { align: "center" });

      doc.save(`Orcamento_${budget.id}.pdf`);
      
      setPdfStatus('success');

      // Auto close after 2 seconds
      setTimeout(() => {
        setPdfModalOpen(false);
      }, 2500);

    } catch (error) {
      console.error("Erro ao gerar PDF", error);
      setPdfModalOpen(false);
      alert("Erro ao gerar PDF");
    }
  };

  // --- Modal Handlers ---

  const handleOpenNewBudget = () => {
    setCurrentBudget({
      id: '',
      clientId: '',
      clientName: '',
      vehicleId: '',
      vehicleName: '',
      status: Status.PENDING,
      dateCreated: new Date().toISOString(),
      totalAmount: 0,
      items: [],
      notes: ''
    });
    setIsViewOnly(false);
    setIsModalOpen(true);
  };

  const handleOpenViewBudget = (budget: Budget) => {
    setCurrentBudget({ ...budget });
    setIsViewOnly(true);
    setIsModalOpen(true);
  };

  const handleEditBudget = (budget: Budget) => {
    setCurrentBudget({ ...budget });
    setIsViewOnly(false);
    setIsModalOpen(true);
  };

  const handleClientChange = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setCurrentBudget(prev => ({
        ...prev,
        clientId: client.id,
        clientName: client.name,
        vehicleId: '', // reset vehicle
        vehicleName: ''
      }));
    }
  };

  const handleVehicleChange = (vehicleId: string) => {
    const client = clients.find(c => c.id === currentBudget.clientId);
    const vehicle = client?.vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      setCurrentBudget(prev => ({
        ...prev,
        vehicleId: vehicle.id,
        vehicleName: `${vehicle.make} ${vehicle.model} (${vehicle.year})`
      }));
    }
  };

  const handleAddItem = () => {
    if (!selectedItemId) return;

    let item: Part | Service | undefined;
    let newItem: BudgetLineItem;

    if (newItemType === 'PART') {
      item = parts.find(p => p.id === selectedItemId);
    } else {
      item = services.find(s => s.id === selectedItemId);
    }

    if (item) {
      newItem = {
        id: Math.random().toString(36).substr(2, 9),
        type: newItemType,
        name: item.name,
        quantity: newItemQty,
        unitPrice: item.price,
        total: item.price * newItemQty
      };

      setCurrentBudget(prev => {
        const updatedItems = [...(prev.items || []), newItem];
        const newTotal = updatedItems.reduce((acc, curr) => acc + curr.total, 0);
        return { ...prev, items: updatedItems, totalAmount: newTotal };
      });
    }

    // Reset item selection
    setSelectedItemId('');
    setNewItemQty(1);
  };

  const handleRemoveItem = (itemId: string) => {
    if (isViewOnly) return;
    setCurrentBudget(prev => {
      const updatedItems = (prev.items || []).filter(i => i.id !== itemId);
      const newTotal = updatedItems.reduce((acc, curr) => acc + curr.total, 0);
      return { ...prev, items: updatedItems, totalAmount: newTotal };
    });
  };

  const handleSaveBudget = async () => {
    if (!currentBudget.clientId || !currentBudget.vehicleId) {
      alert("Selecione um cliente e um veículo.");
      return;
    }

    try {
      // Create a copy to save. If it's new (id is empty string), Supabase will generate UUID.
      // Do NOT generate client-side ID to avoid UUID format errors.
      const budgetToSave = { ...currentBudget } as Budget;
      
      const isNew = !budgetToSave.id;

      // Perform upsert via service
      const savedBudget = await mockService.createBudget(budgetToSave);

      if (isNew) {
        setBudgets(prev => [savedBudget, ...prev]);
      } else {
        // Update existing item in state
        setBudgets(prev => prev.map(b => b.id === savedBudget.id ? savedBudget : b));
      }
      
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erro ao salvar orçamento:", error);
      alert("Erro ao salvar. Verifique se os dados estão corretos.");
    }
  };

  // Helper to get vehicles for selected client
  const availableVehicles = currentBudget.clientId 
    ? clients.find(c => c.id === currentBudget.clientId)?.vehicles || []
    : [];

  // Helper for Modal Title
  const getModalTitle = () => {
    if (isViewOnly) return `Visualizar Orçamento #${currentBudget.id?.toUpperCase()}`;
    if (currentBudget.id) return `Editar Orçamento #${currentBudget.id.toUpperCase()}`;
    return 'Novo Orçamento';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orçamentos</h1>
        <button 
          onClick={handleOpenNewBudget}
          className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus size={20} />
          Novo Orçamento
        </button>
      </div>

      <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-gray-200 dark:border-dark-800 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <Search size={18} />
            </span>
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente ou veículo..." 
              className="w-full bg-gray-50 dark:bg-dark-950 border border-gray-200 dark:border-dark-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Filter size={18} />
              </span>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 bg-gray-50 dark:bg-dark-950 border border-gray-200 dark:border-dark-800 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
              >
                <option value="ALL">Todos Status</option>
                {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
            <thead className="bg-gray-50 dark:bg-dark-950 text-gray-700 dark:text-gray-300 font-semibold uppercase text-xs">
              <tr>
                <th className="px-6 py-4">#ID</th>
                <th className="px-6 py-4">Cliente / Veículo</th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Valor Total</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-dark-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Carregando orçamentos...</td>
                </tr>
              ) : filteredBudgets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Nenhum orçamento encontrado.</td>
                </tr>
              ) : (
                filteredBudgets.map((budget) => (
                  <tr key={budget.id} className="hover:bg-gray-50 dark:hover:bg-dark-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs">{budget.id.toUpperCase().substring(0, 8)}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-white">{budget.clientName}</span>
                        <span className="text-xs text-gray-500">{budget.vehicleName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{new Date(budget.dateCreated).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(budget.status)}`}>
                        {budget.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">
                      R$ {budget.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleOpenViewBudget(budget)}
                          className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors" 
                          title="Visualizar"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => handleEditBudget(budget)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors" 
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={() => handlePrint(budget)}
                          className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-800 rounded transition-colors" 
                          title="Imprimir/PDF"
                        >
                          <Printer size={16} />
                        </button>
                        <button 
                          onClick={() => handleOpenDelete(budget)}
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

      {/* --- PDF Generation Modal --- */}
      {pdfModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-900 rounded-xl p-8 shadow-2xl flex flex-col items-center gap-4 border border-gray-200 dark:border-dark-800 animate-in fade-in zoom-in duration-200">
             {pdfStatus === 'generating' ? (
               <>
                 <Loader2 className="animate-spin text-primary-600 dark:text-primary-400" size={48} />
                 <div className="text-center">
                   <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Gerando PDF...</h3>
                   <p className="text-sm text-gray-500 dark:text-gray-400">Por favor, aguarde um momento.</p>
                 </div>
               </>
             ) : (
               <>
                 <CheckCircle className="text-green-500 animate-bounce" size={48} />
                 <div className="text-center">
                   <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Download Iniciado!</h3>
                   <p className="text-sm text-gray-500 dark:text-gray-400">O arquivo foi baixado com sucesso.</p>
                 </div>
                 <button 
                   onClick={() => setPdfModalOpen(false)}
                   className="mt-2 bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-dark-700 transition-colors"
                 >
                   Fechar
                 </button>
               </>
             )}
          </div>
        </div>
      )}

      {/* --- Budget Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-900 w-full max-w-4xl rounded-xl shadow-2xl border border-gray-200 dark:border-dark-700 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-dark-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {isViewOnly ? (
                  <Eye size={20} className="text-gray-500"/>
                ) : currentBudget.id ? (
                  <Pencil size={20} className="text-blue-500"/>
                ) : (
                  <Plus size={20} className="text-primary-500"/>
                )}
                {getModalTitle()}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Header Info: Client, Vehicle & Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                    <User size={16} /> Cliente
                  </label>
                  <select 
                    disabled={isViewOnly}
                    value={currentBudget.clientId || ''}
                    onChange={(e) => handleClientChange(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-dark-950 border border-gray-300 dark:border-dark-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60"
                  >
                    <option value="">Selecione um cliente...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                    <Car size={16} /> Veículo
                  </label>
                  <select 
                    disabled={isViewOnly || !currentBudget.clientId}
                    value={currentBudget.vehicleId || ''}
                    onChange={(e) => handleVehicleChange(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-dark-950 border border-gray-300 dark:border-dark-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60"
                  >
                    <option value="">Selecione um veículo...</option>
                    {availableVehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.make} {v.model} ({v.plate})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                    <CheckCircle2 size={16} /> Status
                  </label>
                  <select 
                    disabled={isViewOnly}
                    value={currentBudget.status || Status.PENDING}
                    onChange={(e) => setCurrentBudget({ ...currentBudget, status: e.target.value as Status })}
                    className="w-full bg-gray-50 dark:bg-dark-950 border border-gray-300 dark:border-dark-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60"
                  >
                    {Object.values(Status).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items Table */}
              <div className="border rounded-lg border-gray-200 dark:border-dark-800 overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 font-semibold">
                    <tr>
                      <th className="px-4 py-2">Tipo</th>
                      <th className="px-4 py-2">Descrição</th>
                      <th className="px-4 py-2 text-center">Qtd</th>
                      <th className="px-4 py-2 text-right">Preço Unit.</th>
                      <th className="px-4 py-2 text-right">Total</th>
                      {!isViewOnly && <th className="px-4 py-2 text-center">Ações</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-dark-800">
                    {currentBudget.items?.length === 0 ? (
                      <tr>
                        <td colSpan={isViewOnly ? 5 : 6} className="px-4 py-8 text-center text-gray-500">
                          Nenhum item adicionado.
                        </td>
                      </tr>
                    ) : (
                      currentBudget.items?.map((item) => (
                        <tr key={item.id} className="bg-white dark:bg-dark-900">
                          <td className="px-4 py-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                              item.type === 'PART' 
                                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' 
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>
                              {item.type === 'PART' ? 'PEÇA' : 'SERVIÇO'}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{item.name}</td>
                          <td className="px-4 py-2 text-center text-gray-900 dark:text-gray-100">{item.quantity}</td>
                          <td className="px-4 py-2 text-right text-gray-900 dark:text-gray-100">R$ {item.unitPrice.toFixed(2)}</td>
                          <td className="px-4 py-2 text-right font-medium text-gray-900 dark:text-white">R$ {item.total.toFixed(2)}</td>
                          {!isViewOnly && (
                            <td className="px-4 py-2 text-center">
                              <button 
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Add Item Form (Only in Edit Mode) */}
              {!isViewOnly && (
                <div className="bg-gray-50 dark:bg-dark-950 p-4 rounded-lg border border-gray-200 dark:border-dark-800 flex flex-col md:flex-row gap-3 items-end">
                  <div className="w-full md:w-32">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
                    <select 
                      value={newItemType}
                      onChange={(e) => {
                         setNewItemType(e.target.value as 'PART' | 'SERVICE');
                         setSelectedItemId('');
                      }}
                      className="w-full bg-white dark:bg-dark-900 border border-gray-300 dark:border-dark-700 rounded px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 dark:text-white"
                    >
                      <option value="SERVICE">Serviço</option>
                      <option value="PART">Peça</option>
                    </select>
                  </div>
                  
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Item</label>
                    <select 
                      value={selectedItemId}
                      onChange={(e) => setSelectedItemId(e.target.value)}
                      className="w-full bg-white dark:bg-dark-900 border border-gray-300 dark:border-dark-700 rounded px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 dark:text-white"
                    >
                      <option value="">Selecione...</option>
                      {newItemType === 'PART' 
                        ? parts.map(p => <option key={p.id} value={p.id}>{p.name} (R$ {p.price.toFixed(2)})</option>)
                        : services.map(s => <option key={s.id} value={s.id}>{s.name} (R$ {s.price.toFixed(2)})</option>)
                      }
                    </select>
                  </div>

                  <div className="w-20">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Qtd</label>
                    <input 
                      type="number" 
                      min="1"
                      value={newItemQty}
                      onChange={(e) => setNewItemQty(parseInt(e.target.value) || 1)}
                      className="w-full bg-white dark:bg-dark-900 border border-gray-300 dark:border-dark-700 rounded px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 dark:text-white text-center"
                    />
                  </div>

                  <button 
                    onClick={handleAddItem}
                    disabled={!selectedItemId}
                    className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <Plus size={16} /> Adicionar
                  </button>
                </div>
              )}

              {/* Footer Summary */}
              <div className="flex flex-col items-end pt-4 border-t border-gray-200 dark:border-dark-800">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  Total: R$ {(currentBudget.totalAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-dark-950/50 border-t border-gray-200 dark:border-dark-800 rounded-b-xl flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
              >
                {isViewOnly ? 'Fechar' : 'Cancelar'}
              </button>
              {!isViewOnly && (
                <button 
                  onClick={handleSaveBudget}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Save size={18} /> Salvar Orçamento
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {isDeleteModalOpen && budgetToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-900 w-full max-w-sm rounded-xl shadow-2xl border border-gray-200 dark:border-dark-700 p-6 flex flex-col items-center text-center animate-in fade-in zoom-in duration-200">
             <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-500 mb-4">
                <AlertTriangle size={24} />
             </div>
             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
               Confirmar Exclusão
             </h3>
             <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
               Tem certeza que deseja excluir o orçamento de <strong>{budgetToDelete.clientName}</strong>? Esta ação não pode ser desfeita.
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

export default Budgets;