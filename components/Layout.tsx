import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Car, 
  Wrench, 
  FileText, 
  BarChart3, 
  Menu, 
  X, 
  Sun, 
  Moon,
  Search,
  Bell,
  Sparkles,
  Settings
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  darkMode: boolean;
  toggleDarkMode: () => void;
  openAiModal: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, darkMode, toggleDarkMode, openAiModal }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
    { label: 'Orçamentos', icon: <FileText size={20} />, path: '/budgets' },
    { label: 'Clientes', icon: <Users size={20} />, path: '/clients' },
    { label: 'Veículos', icon: <Car size={20} />, path: '/vehicles' },
    { label: 'Estoque & Serviços', icon: <Wrench size={20} />, path: '/inventory' },
    { label: 'Relatórios', icon: <BarChart3 size={20} />, path: '/reports' },
    { label: 'Configurações', icon: <Settings size={20} />, path: '/settings' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? 'dark' : ''}`}>
      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        bg-white dark:bg-dark-900 border-r border-gray-200 dark:border-dark-800 flex flex-col
      `}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-dark-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              A
            </div>
            <span className="text-xl font-bold text-gray-800 dark:text-white">AutoFix</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${isActive(item.path) 
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400' 
                      : 'text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800'}
                  `}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-dark-800">
           <button 
             onClick={openAiModal}
             className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-2 rounded-lg text-sm font-medium shadow-md transition-all"
           >
             <Sparkles size={16} />
             IA Assistant
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-dark-950">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-dark-900 border-b border-gray-200 dark:border-dark-800 flex items-center justify-between px-4 lg:px-8">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 dark:text-gray-400 p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg"
          >
            <Menu size={24} />
          </button>

          <div className="flex-1 max-w-lg mx-4 hidden md:block">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Search size={18} />
              </span>
              <input 
                type="text" 
                placeholder="Buscar clientes, orçamentos, placas..." 
                className="w-full bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-gray-100 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={toggleDarkMode}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-dark-900"></span>
            </button>
            
            <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold text-sm border border-primary-200 dark:border-primary-800 cursor-pointer">
              JD
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;