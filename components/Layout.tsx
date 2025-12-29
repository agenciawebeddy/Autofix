import React, { useState, useEffect, useRef } from 'react';
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
  Settings,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { mockService } from '../services/mockData';
import { GlobalSearchResults } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  darkMode: boolean;
  toggleDarkMode: () => void;
  openAiModal: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, darkMode, toggleDarkMode, openAiModal }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GlobalSearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

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

  // Search Logic
  useEffect(() => {
    if (searchQuery.length > 1) {
      setIsSearching(true);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await mockService.globalSearch(searchQuery);
          setSearchResults(results);
          setShowResults(true);
        } catch (error) {
          console.error("Search error", error);
        } finally {
          setIsSearching(false);
        }
      }, 500); // Debounce 500ms
    } else {
      setSearchResults(null);
      setShowResults(false);
      setIsSearching(false);
    }
  }, [searchQuery]);

  // Close search on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchResultClick = (path: string) => {
    setShowResults(false);
    setSearchQuery('');
    navigate(path);
  };

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

          {/* Search Bar Container */}
          <div className="flex-1 max-w-lg mx-4 hidden md:block" ref={searchContainerRef}>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                {isSearching ? <Loader2 size={18} className="animate-spin text-primary-500" /> : <Search size={18} />}
              </span>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => { if(searchQuery.length > 1 && searchResults) setShowResults(true); }}
                placeholder="Buscar clientes, orçamentos, placas..." 
                className="w-full bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-gray-100 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />

              {/* Search Results Dropdown */}
              {showResults && searchResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-dark-900 rounded-xl shadow-xl border border-gray-200 dark:border-dark-800 overflow-hidden z-50">
                  <div className="max-h-[60vh] overflow-y-auto">
                    
                    {/* No Results */}
                    {searchResults.clients.length === 0 && searchResults.vehicles.length === 0 && searchResults.budgets.length === 0 && (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        Nenhum resultado encontrado.
                      </div>
                    )}

                    {/* Clients */}
                    {searchResults.clients.length > 0 && (
                      <div className="py-2">
                        <h4 className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                          <Users size={12} /> Clientes
                        </h4>
                        {searchResults.clients.map(c => (
                          <div 
                            key={c.id} 
                            onClick={() => handleSearchResultClick('/clients')}
                            className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-dark-800 cursor-pointer flex items-center justify-between group"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{c.name}</p>
                              <p className="text-xs text-gray-500">{c.email || c.phone}</p>
                            </div>
                            <ChevronRight size={14} className="text-gray-400 opacity-0 group-hover:opacity-100" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Vehicles */}
                    {searchResults.vehicles.length > 0 && (
                      <div className="py-2 border-t border-gray-100 dark:border-dark-800">
                        <h4 className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                          <Car size={12} /> Veículos
                        </h4>
                        {searchResults.vehicles.map(v => (
                          <div 
                            key={v.id} 
                            onClick={() => handleSearchResultClick('/vehicles')}
                            className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-dark-800 cursor-pointer flex items-center justify-between group"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{v.make} {v.model} - <span className="font-mono text-xs bg-gray-100 dark:bg-dark-800 px-1 rounded">{v.plate}</span></p>
                              <p className="text-xs text-gray-500">{v.clientName}</p>
                            </div>
                            <ChevronRight size={14} className="text-gray-400 opacity-0 group-hover:opacity-100" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Budgets */}
                    {searchResults.budgets.length > 0 && (
                      <div className="py-2 border-t border-gray-100 dark:border-dark-800">
                        <h4 className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                          <FileText size={12} /> Orçamentos
                        </h4>
                        {searchResults.budgets.map(b => (
                          <div 
                            key={b.id} 
                            onClick={() => handleSearchResultClick('/budgets')}
                            className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-dark-800 cursor-pointer flex items-center justify-between group"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">#{b.id.toUpperCase().substring(0,8)} - {b.clientName}</p>
                              <p className="text-xs text-gray-500">{new Date(b.dateCreated).toLocaleDateString()} - R$ {b.totalAmount.toLocaleString('pt-BR')}</p>
                            </div>
                            <ChevronRight size={14} className="text-gray-400 opacity-0 group-hover:opacity-100" />
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                </div>
              )}
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