import React, { useEffect, useState } from 'react';
import { mockService } from '../services/mockData';
import { DashboardStats, Status, Budget } from '../types';
import { 
  DollarSign, 
  FileText, 
  Wrench, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle 
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

const StatCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  alert?: boolean;
}> = ({ title, value, icon, trend, trendUp, alert }) => (
  <div className="bg-white dark:bg-dark-900 p-6 rounded-xl border border-gray-200 dark:border-dark-800 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-2 rounded-lg ${alert ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'}`}>
        {icon}
      </div>
      {trend && (
        <div className={`flex items-center text-sm font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
          {trendUp ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
          {trend}
        </div>
      )}
    </div>
    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</h3>
    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
  </div>
);

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lowStockCount, setLowStockCount] = useState(0);
  
  // Chart Data States
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [serviceTypeData, setServiceTypeData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [statsData, partsData, settingsData, budgetsData] = await Promise.all([
        mockService.getStats(),
        mockService.getParts(),
        mockService.getCompanySettings(),
        mockService.getBudgets()
      ]);
      
      setStats(statsData);

      // Low Stock Logic
      const threshold = settingsData.lowStockThreshold || 10;
      const count = partsData.filter(p => p.stock < threshold).length;
      setLowStockCount(count);

      // --- Process Real Chart Data ---
      processRevenueChart(budgetsData);
      processServicesChart(budgetsData);

      setLoading(false);
    };
    fetchData();
  }, []);

  const processRevenueChart = (budgets: Budget[]) => {
    // Generate last 6 months keys
    const months = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push(d);
    }

    const data = months.map(date => {
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      // Filter COMPLETED budgets within this month range
      const total = budgets
        .filter(b => b.status === Status.COMPLETED)
        .filter(b => {
          const bDate = new Date(b.dateCreated);
          return bDate >= monthStart && bDate <= monthEnd;
        })
        .reduce((sum, b) => sum + b.totalAmount, 0);

      // Format month name (e.g., 'Jan')
      const name = date.toLocaleString('pt-BR', { month: 'short' });
      return {
        name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize
        value: total
      };
    });

    setRevenueData(data);
  };

  const processServicesChart = (budgets: Budget[]) => {
    const serviceCounts: Record<string, number> = {};

    budgets.forEach(budget => {
      // Consider all budgets to show demand popularity, or filter by Status.COMPLETED if preferred
      budget.items?.forEach(item => {
        if (item.type === 'SERVICE') {
          serviceCounts[item.name] = (serviceCounts[item.name] || 0) + item.quantity;
        }
      });
    });

    // Sort by count descending and take top 5
    const data = Object.entries(serviceCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Fallback if empty to show something on UI
    if (data.length === 0) {
        setServiceTypeData([
            { name: 'Nenhum serviço', count: 0 }
        ]);
    } else {
        setServiceTypeData(data);
    }
  };

  if (loading) return <div className="flex h-full items-center justify-center text-gray-500">Carregando Dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Visão Geral</h1>
          <p className="text-gray-500 dark:text-gray-400">Resumo em tempo real da sua oficina.</p>
        </div>
        <div className="flex gap-2">
          <select className="bg-white dark:bg-dark-900 border border-gray-300 dark:border-dark-800 text-gray-700 dark:text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option>Últimos 6 meses</option>
            <option>Este Ano</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatCard 
          title="Faturamento Mensal" 
          value={`R$ ${stats?.revenue.toLocaleString('pt-BR')}`} 
          icon={<DollarSign size={24} />} 
          trend="Acumulado Concluído" 
          trendUp={true} 
        />
        <StatCard 
          title="Orçamentos Pendentes" 
          value={stats?.pendingBudgets.toString() || '0'} 
          icon={<FileText size={24} />} 
        />
        <StatCard 
          title="Serviços em Andamento" 
          value={stats?.activeServices.toString() || '0'} 
          icon={<Wrench size={24} />} 
        />
        <StatCard 
          title="Concluídos no Mês" 
          value={stats?.completedThisMonth.toString() || '0'} 
          icon={<CheckCircle size={24} />} 
          trend="Este mês" 
          trendUp={true} 
        />
        <StatCard 
          title="Estoque Baixo" 
          value={lowStockCount.toString()} 
          icon={<AlertTriangle size={24} />} 
          trend={lowStockCount > 0 ? "Reposição Necessária" : "Estoque Saudável"}
          trendUp={lowStockCount === 0}
          alert={lowStockCount > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-dark-900 p-6 rounded-xl border border-gray-200 dark:border-dark-800 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Receita Real (Concluída - Últimos 6 meses)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary-500)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--primary-500)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} tickFormatter={(value) => `R$${value/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 'Receita']}
                />
                <Area type="monotone" dataKey="value" stroke="var(--primary-500)" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-900 p-6 rounded-xl border border-gray-200 dark:border-dark-800 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Serviços Mais Populares</h3>
          <div className="h-80">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceTypeData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.1} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{fill: '#9ca3af', fontSize: 11}} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                />
                <Bar dataKey="count" fill="var(--primary-500)" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;