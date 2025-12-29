import React, { useState, useEffect, useLayoutEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Budgets from './pages/Budgets';
import Clients from './pages/Clients';
import Vehicles from './pages/Vehicles';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import { Sparkles, X, MessageSquare } from 'lucide-react';
import { generateDiagnosis } from './services/geminiService';
import { mockService, applyTheme } from './services/mockData';

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(() => {
    // Check local storage or system preference
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiPromptVehicle, setAiPromptVehicle] = useState('');
  const [aiPromptSymptoms, setAiPromptSymptoms] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Use useLayoutEffect for immediate theme application before render if possible, or simple useEffect
  useLayoutEffect(() => {
     const localColor = localStorage.getItem('primaryColor');
     if (localColor) applyTheme(localColor);
  }, []);

  useEffect(() => {
    // Apply Dark Mode
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }

    // Apply Brand Color Theme (Async Sync with DB)
    const loadTheme = async () => {
       try {
         const settings = await mockService.getCompanySettings();
         if (settings.primaryColor) {
           applyTheme(settings.primaryColor);
           // Update local storage to match DB
           localStorage.setItem('primaryColor', settings.primaryColor);
         }
       } catch (e) {
         console.warn("Failed to load theme settings from DB, keeping local.", e);
       }
    };
    loadTheme();
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiLoading(true);
    setAiResponse('');
    
    const result = await generateDiagnosis(aiPromptSymptoms, aiPromptVehicle);
    setAiResponse(result);
    setAiLoading(false);
  };

  return (
    <HashRouter>
      <Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode} openAiModal={() => setAiModalOpen(true)}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>

      {/* AI Assistant Modal */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 dark:border-dark-700 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-800">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-primary-500 to-purple-600 p-2 rounded-lg text-white">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Assistente Técnico IA</h2>
                  <p className="text-sm text-gray-500">Diagnóstico inteligente powered by Gemini</p>
                </div>
              </div>
              <button onClick={() => setAiModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {!aiResponse ? (
                <form onSubmit={handleAiSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Veículo (Marca, Modelo, Ano)</label>
                    <input 
                      type="text" 
                      required
                      value={aiPromptVehicle}
                      onChange={(e) => setAiPromptVehicle(e.target.value)}
                      placeholder="Ex: Honda Civic 2018 2.0" 
                      className="w-full bg-gray-50 dark:bg-dark-950 border border-gray-300 dark:border-dark-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sintomas / Barulhos relatados</label>
                    <textarea 
                      required
                      value={aiPromptSymptoms}
                      onChange={(e) => setAiPromptSymptoms(e.target.value)}
                      placeholder="Ex: Barulho de estalo ao virar o volante para a esquerda..." 
                      className="w-full bg-gray-50 dark:bg-dark-950 border border-gray-300 dark:border-dark-700 rounded-lg px-4 py-3 h-32 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white resize-none"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={aiLoading}
                    className="w-full bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                  >
                    {aiLoading ? (
                      <>Processando Análise...</>
                    ) : (
                      <><Sparkles size={18} /> Gerar Diagnóstico</>
                    )}
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                   <div className="bg-gray-50 dark:bg-dark-950 p-6 rounded-xl border border-gray-200 dark:border-dark-800 prose dark:prose-invert max-w-none">
                      <h3 className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-bold text-lg mb-4">
                        <MessageSquare size={20} /> Análise Sugerida
                      </h3>
                      <div className="whitespace-pre-line text-gray-800 dark:text-gray-200 leading-relaxed">
                        {aiResponse}
                      </div>
                   </div>
                   <button 
                    onClick={() => setAiResponse('')}
                    className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium text-sm"
                   >
                     Fazer nova consulta
                   </button>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 dark:border-dark-800 bg-gray-50 dark:bg-dark-950/50 rounded-b-2xl">
              <p className="text-xs text-center text-gray-500">
                A IA fornece sugestões baseadas em dados gerais. Sempre verifique o veículo fisicamente antes de orçar.
              </p>
            </div>
          </div>
        </div>
      )}
    </HashRouter>
  );
};

export default App;