import React, { useEffect, useState } from 'react';
import { mockService } from '../services/mockData';
import { Budget, Part, Service, Status } from '../types';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { DollarSign, Package, TrendingUp, AlertTriangle, CheckCircle2, Clock, FileText, FileDown, Loader2, CheckCircle } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const STATUS_COLORS = {
  [Status.APPROVED]: '#22c55e', // Green
  [Status.PENDING]: '#eab308',  // Yellow
  [Status.COMPLETED]: '#3b82f6', // Blue
  [Status.CANCELED]: '#ef4444', // Red
  [Status.IN_PROGRESS]: '#a855f7' // Purple
};

const Reports: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  // Analytics State
  const [financialStats, setFinancialStats] = useState({
    totalRevenue: 0,
    potentialRevenue: 0,
    averageTicket: 0,
    conversionRate: 0
  });

  const [inventoryStats, setInventoryStats] = useState({
    totalItems: 0,
    totalCost: 0,
    totalSaleValue: 0,
    lowStockCount: 0
  });

  const [statusData, setStatusData] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<Part[]>([]);

  // PDF Generation State
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfStatus, setPdfStatus] = useState<'generating' | 'success'>('generating');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [bData, pData, sData, companySettings] = await Promise.all([
        mockService.getBudgets(),
        mockService.getParts(),
        mockService.getServices(),
        mockService.getCompanySettings()
      ]);

      setBudgets(bData);
      setParts(pData);
      setServices(sData);

      processFinancials(bData);
      processInventory(pData, companySettings.lowStockThreshold || 10);
      
      setLoading(false);
    };
    loadData();
  }, []);

  const processFinancials = (data: Budget[]) => {
    const completedOrApproved = data.filter(b => b.status === Status.COMPLETED || b.status === Status.APPROVED);
    const pending = data.filter(b => b.status === Status.PENDING);
    
    const revenue = completedOrApproved.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const potential = pending.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const avgTicket = revenue / (completedOrApproved.length || 1);
    const conversion = (completedOrApproved.length / (data.length || 1)) * 100;

    setFinancialStats({
      totalRevenue: revenue,
      potentialRevenue: potential,
      averageTicket: avgTicket,
      conversionRate: conversion
    });

    // Chart Data: Count by Status
    const statusCounts = data.reduce((acc: any, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1;
      return acc;
    }, {});

    const chartData = Object.keys(Status).map((key) => {
        const statusValue = Status[key as keyof typeof Status];
        return {
            name: statusValue,
            value: statusCounts[statusValue] || 0,
            fill: STATUS_COLORS[statusValue] || '#ccc'
        };
    });
    setStatusData(chartData);
  };

  const processInventory = (data: Part[], threshold: number) => {
    const totalItems = data.reduce((acc, curr) => acc + curr.stock, 0);
    const totalCost = data.reduce((acc, curr) => acc + (curr.cost * curr.stock), 0);
    const totalSale = data.reduce((acc, curr) => acc + (curr.price * curr.stock), 0);
    const lowStock = data.filter(p => p.stock < threshold);

    setInventoryStats({
      totalItems,
      totalCost,
      totalSaleValue: totalSale,
      lowStockCount: lowStock.length
    });
    setLowStockItems(lowStock);
  };

  const handleExportPDF = async () => {
    setPdfModalOpen(true);
    setPdfStatus('generating');

    // Small delay to allow UI to render the modal before heavy processing
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const companySettings = await mockService.getCompanySettings();
      const doc = new jsPDF();
      const date = new Date().toLocaleDateString('pt-BR');

      // --- Header ---
      
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

      // Company Info
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
      }

      // Title Section
      const titleY = companySettings.logoUrl ? 50 : currentY + 10;
      doc.setFontSize(18);
      doc.setTextColor(0);
      doc.setFont("helvetica", "bold");
      doc.text("Relatório Gerencial", 14, titleY);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Gerado em: ${date}`, 14, titleY + 6);

      let finalY = titleY + 15;

      // --- Table 1: Financial Summary ---
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("1. Resumo Financeiro", 14, finalY);
      
      autoTable(doc, {
        startY: finalY + 5,
        head: [['Indicador', 'Valor']],
        body: [
          ['Receita Total (Aprovada/Realizada)', `R$ ${financialStats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
          ['Receita Pendente (Potencial)', `R$ ${financialStats.potentialRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
          ['Ticket Médio', `R$ ${financialStats.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
          ['Taxa de Conversão', `${financialStats.conversionRate.toFixed(1)}%`]
        ],
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] } // Blue
      });
      
      finalY = (doc as any).lastAutoTable.finalY + 15;

      // --- Table 2: Inventory Summary ---
      doc.text("2. Resumo de Estoque", 14, finalY);

      autoTable(doc, {
        startY: finalY + 5,
        head: [['Indicador', 'Valor']],
        body: [
          ['Total de Itens em Estoque', inventoryStats.totalItems.toString()],
          ['Valor Total em Custo', `R$ ${inventoryStats.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
          ['Valor Total em Venda (Potencial)', `R$ ${inventoryStats.totalSaleValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
          ['Itens com Estoque Baixo', inventoryStats.lowStockCount.toString()]
        ],
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] }
      });

      finalY = (doc as any).lastAutoTable.finalY + 15;

      // --- Table 3: Low Stock Alerts ---
      if (lowStockItems.length > 0) {
        doc.text("3. Itens com Estoque Baixo (Reposição Necessária)", 14, finalY);
        
        const lowStockRows = lowStockItems.map(item => [
          item.name,
          item.sku,
          item.stock,
          `R$ ${item.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        ]);

        autoTable(doc, {
          startY: finalY + 5,
          head: [['Peça', 'SKU', 'Qtd Atual', 'Custo Unit.']],
          body: lowStockRows,
          theme: 'grid',
          headStyles: { fillColor: [220, 38, 38] } // Red
        });
      }

      doc.save(`Relatorio_AutoFix_${date.replace(/\//g, '-')}.pdf`);
      
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

  if (loading) {
    return <div className="flex h-full items-center justify-center text-gray-500">Gerando relatórios...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Relatórios Gerenciais</h1>
        <button 
          onClick={handleExportPDF}
          className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
        >
          <FileDown size={20} />
          Exportar PDF
        </button>
      </div>

      {/* --- Section 1: Financial Overview --- */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <DollarSign className="text-primary-500" size={20}/> Financeiro (Orçamentos)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-dark-900 p-6 rounded-xl border border-gray-200 dark:border-dark-800 shadow-sm">
                <p className="text-sm text-gray-500 dark:text-gray-400">Receita Aprovada/Realizada</p>
                <h3 className="text-2xl font-bold text-green-600 dark:text-green-500 mt-2">
                    R$ {financialStats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
            </div>
            <div className="bg-white dark:bg-dark-900 p-6 rounded-xl border border-gray-200 dark:border-dark-800 shadow-sm">
                <p className="text-sm text-gray-500 dark:text-gray-400">Receita Pendente (Potencial)</p>
                <h3 className="text-2xl font-bold text-yellow-600 dark:text-yellow-500 mt-2">
                    R$ {financialStats.potentialRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
            </div>
            <div className="bg-white dark:bg-dark-900 p-6 rounded-xl border border-gray-200 dark:border-dark-800 shadow-sm">
                <p className="text-sm text-gray-500 dark:text-gray-400">Ticket Médio</p>
                <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-500 mt-2">
                    R$ {financialStats.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
            </div>
            <div className="bg-white dark:bg-dark-900 p-6 rounded-xl border border-gray-200 dark:border-dark-800 shadow-sm">
                <p className="text-sm text-gray-500 dark:text-gray-400">Taxa de Conversão</p>
                <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-500 mt-2">
                    {financialStats.conversionRate.toFixed(1)}%
                </h3>
            </div>
        </div>
      </section>

      {/* --- Section 2: Charts --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Chart */}
          <div className="bg-white dark:bg-dark-900 p-6 rounded-xl border border-gray-200 dark:border-dark-800 shadow-sm h-96">
             <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">Status dos Orçamentos</h3>
             <ResponsiveContainer width="100%" height="85%">
                <BarChart data={statusData} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.1} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} tick={{fill: '#9ca3af', fontSize: 11}} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                        formatter={(value: number) => [value, 'Orçamentos']}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
                        {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Bar>
                </BarChart>
             </ResponsiveContainer>
          </div>

          {/* Inventory Summary */}
          <div className="bg-white dark:bg-dark-900 p-6 rounded-xl border border-gray-200 dark:border-dark-800 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                    <Package size={20} className="text-primary-500"/> Métricas de Estoque
                </h3>
                <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-950 rounded-lg">
                        <span className="text-gray-600 dark:text-gray-300">Valor Total em Custo</span>
                        <span className="font-bold text-gray-900 dark:text-white text-lg">
                            R$ {inventoryStats.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-950 rounded-lg">
                        <span className="text-gray-600 dark:text-gray-300">Valor Total em Venda (Potencial)</span>
                        <span className="font-bold text-gray-900 dark:text-white text-lg">
                            R$ {inventoryStats.totalSaleValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-950 rounded-lg">
                        <span className="text-gray-600 dark:text-gray-300">Margem Estimada</span>
                        <span className="font-bold text-green-600 dark:text-green-500 text-lg">
                            R$ {(inventoryStats.totalSaleValue - inventoryStats.totalCost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>
              </div>
          </div>
      </div>

      {/* --- Section 3: Low Stock Alerts --- */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={20}/> Alertas de Estoque Baixo
        </h2>
        <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
                    <thead className="bg-gray-50 dark:bg-dark-950 text-gray-700 dark:text-gray-300 font-semibold uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Peça / SKU</th>
                            <th className="px-6 py-4 text-center">Estoque Atual</th>
                            <th className="px-6 py-4 text-right">Custo Reposição</th>
                            <th className="px-6 py-4 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-dark-800">
                        {lowStockItems.length === 0 ? (
                            <tr><td colSpan={4} className="p-6 text-center">Nenhum item com estoque baixo.</td></tr>
                        ) : (
                            lowStockItems.map(part => (
                                <tr key={part.id} className="hover:bg-gray-50 dark:hover:bg-dark-800/50">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-900 dark:text-white">{part.name}</span>
                                            <span className="text-xs text-gray-500 font-mono">{part.sku}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-red-600">
                                        {part.stock}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        R$ {part.cost.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-medium">
                                            <AlertTriangle size={12} /> Repor
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </section>

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
    </div>
  );
};

export default Reports;