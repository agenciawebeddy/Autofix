import React, { useEffect, useState } from 'react';
import { mockService } from '../services/mockData';
import { DashboardStats, Status } from '../types';
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

  useEffect(() => {
    const fetchData = async () => {
      const [statsData, partsData, settingsData] = await Promise.all([
        mockService.getStats(),
        mockService.getParts(),
        mockService.getCompanySettings()
      ]);
      
      setStats(statsData);

      const threshold = settingsData.lowStockThreshold || 10;
      const count = partsData.filter(p => p.stock < threshold).length;
      setLowStockCount(count);

      setLoading(false);
    };
    fetchData();
  }, []);

  // Mock data for charts
  const revenueData = [
    { name: 'Jan', value: 32000 },
    { name: 'Fev', value: 38000 },
    { name: 'Mar', value: 35000 },
    { name: 'Abr', value: 42000 },
    { name: 'Mai', value: 45250 },
    { name: 'Jun', value: 41000 },
  ];

  const serviceTypeData = [
    { name: 'Troca de Óleo', count: 45 },
    { name: 'Freios', count: 32 },
    { name: 'Suspensão', count: 28 },
    { name: 'Motor', count: 12 },
    { name: 'Revisão', count: 55 },
  ];

  if (loading) return <div className="flex h-full items-center justify-center text-gray-500">Carregando Dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Visão Geral</h1>
          <p className="text-gray-500 dark:text-gray-400">Bem-vindo de volta, João.</p>
        </div>
        <div className="flex gap-2">
          <select className="bg-white dark:bg-dark-900 border border-gray-300 dark:border-dark-800 text-gray-700 dark:text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option>Últimos 30 dias</option>
            <option>Este Mês</option>
            <option>Este Ano</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatCard 
          title="Faturamento Mensal" 
          value={`R$ ${stats?.revenue.toLocaleString('pt-BR')}`} 
          icon={<DollarSign size={24} />} 
          trend="+12.5%" 
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
          trend="+5.2%" 
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Receita Semestral</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} tickFormatter={(value) => `R$${value/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString()}`, 'Receita']}
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-900 p-6 rounded-xl border border-gray-200 dark:border-dark-800 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Serviços Populares</h3>
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
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;