import React, { useEffect, useState, useRef } from 'react';
import { mockService, applyTheme } from '../services/mockData';
import { CompanySettings } from '../types';
import { Save, Building2, Phone, Mail, Globe, User, Upload, Image as ImageIcon, CheckCircle2, Settings as SettingsIcon, AlertTriangle, Palette, Hash, Loader2 } from 'lucide-react';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<CompanySettings>({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    responsibleName: '',
    logoUrl: '',
    lowStockThreshold: 10,
    primaryColor: '#3b82f6'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    mockService.getCompanySettings().then((data) => {
      setSettings(data);
      // Ensure we apply current theme in case it was direct loaded to this page
      if (data.primaryColor) applyTheme(data.primaryColor);
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    
    try {
      await mockService.saveCompanySettings(settings);
      
      // Save theme locally as well to ensure persistence immediately
      if (settings.primaryColor) {
        localStorage.setItem('primaryColor', settings.primaryColor);
      }
      
      setSuccessMsg('Configurações salvas com sucesso!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert('Ocorreu um erro ao salvar as configurações. Verifique sua conexão ou tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({
          ...prev,
          logoUrl: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleColorChange = (color: string) => {
    setSettings(prev => ({ ...prev, primaryColor: color }));
    // Only apply theme if valid hex length (simple check)
    if (color.length === 4 || color.length === 7) {
      applyTheme(color); 
    }
  };

  const presetColors = [
    '#3b82f6', // Blue (Default)
    '#0ea5e9', // Sky
    '#06b6d4', // Cyan
    '#14b8a6', // Teal
    '#10b981', // Emerald
    '#84cc16', // Lime
    '#eab308', // Yellow
    '#f59e0b', // Amber
    '#f97316', // Orange
    '#ef4444', // Red
    '#ec4899', // Pink
    '#d946ef', // Fuchsia
    '#8b5cf6', // Violet
    '#6366f1', // Indigo
    '#64748b', // Slate
    '#111827', // Gray Black
  ];

  if (loading) {
     return (
       <div className="flex flex-col h-full items-center justify-center text-gray-500 gap-2">
         <Loader2 size={32} className="animate-spin text-primary-500" />
         <p>Carregando configurações...</p>
       </div>
     );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      <div className="flex items-center justify-between">
         <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações da Empresa</h1>
         {successMsg && (
             <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg text-sm font-medium animate-fade-in">
                 <CheckCircle2 size={18} />
                 {successMsg}
             </div>
         )}
      </div>

      <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 shadow-sm overflow-hidden">
         <form onSubmit={handleSave} className="p-6 space-y-8">
            
            {/* Logo Section */}
            <div className="flex flex-col md:flex-row gap-8 items-start">
               <div className="w-full md:w-1/3 flex flex-col items-center space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Logotipo</label>
                  <div 
                    className="relative w-40 h-40 rounded-xl bg-gray-50 dark:bg-dark-950 border-2 border-dashed border-gray-300 dark:border-dark-700 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary-500 transition-colors group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                     {settings.logoUrl ? (
                        <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                     ) : (
                        <div className="text-gray-400 flex flex-col items-center">
                           <ImageIcon size={32} />
                           <span className="text-xs mt-2">Upload Logo</span>
                        </div>
                     )}
                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="text-white" size={24}/>
                     </div>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleLogoUpload}
                  />
                  <p className="text-xs text-gray-500 text-center max-w-[200px]">
                     Recomendado: PNG ou JPG. Será usado no cabeçalho dos relatórios.
                  </p>
               </div>

               {/* General Info */}
               <div className="w-full md:w-2/3 space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-dark-800 pb-2">
                     Dados Gerais
                  </h3>
                  
                  <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                        <Building2 size={16} /> Nome da Oficina / Empresa
                     </label>
                     <input 
                        type="text" 
                        required
                        value={settings.name}
                        onChange={e => setSettings({...settings, name: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-dark-950 border border-gray-300 dark:border-dark-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                     />
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Endereço Completo</label>
                     <textarea 
                        rows={2}
                        value={settings.address}
                        onChange={e => setSettings({...settings, address: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-dark-950 border border-gray-300 dark:border-dark-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                     />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                            <Phone size={16} /> Telefone / WhatsApp
                         </label>
                         <input 
                            type="text" 
                            value={settings.phone}
                            onChange={e => setSettings({...settings, phone: e.target.value})}
                            className="w-full bg-gray-50 dark:bg-dark-950 border border-gray-300 dark:border-dark-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                         />
                      </div>
                      <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                            <User size={16} /> Responsável Técnico
                         </label>
                         <input 
                            type="text" 
                            value={settings.responsibleName}
                            onChange={e => setSettings({...settings, responsibleName: e.target.value})}
                            className="w-full bg-gray-50 dark:bg-dark-950 border border-gray-300 dark:border-dark-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                         />
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                            <Mail size={16} /> Email de Contato
                         </label>
                         <input 
                            type="email" 
                            value={settings.email}
                            onChange={e => setSettings({...settings, email: e.target.value})}
                            className="w-full bg-gray-50 dark:bg-dark-950 border border-gray-300 dark:border-dark-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                         />
                      </div>
                      <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                            <Globe size={16} /> Website / Instagram
                         </label>
                         <input 
                            type="text" 
                            value={settings.website}
                            onChange={e => setSettings({...settings, website: e.target.value})}
                            className="w-full bg-gray-50 dark:bg-dark-950 border border-gray-300 dark:border-dark-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                         />
                      </div>
                  </div>

                  {/* System Parameters */}
                  <div className="pt-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-dark-800 pb-2 mb-4 flex items-center gap-2">
                       <SettingsIcon size={20} className="text-gray-500" /> Parâmetros do Sistema
                    </h3>
                    
                    {/* Theme Customization */}
                    <div className="mb-6 pb-6 border-b border-gray-100 dark:border-dark-800">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                            <Palette size={16} className="text-primary-500" /> Tema e Cores
                        </label>
                        
                        <div className="flex flex-col space-y-4">
                            {/* Custom Picker with Hex Input */}
                            <div className="flex items-center gap-3">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Personalizado</label>
                                <div className="flex items-center gap-2 bg-gray-50 dark:bg-dark-950 border border-gray-300 dark:border-dark-700 rounded-lg p-1.5 pl-2 shadow-sm">
                                     <div className="relative w-7 h-7 rounded-full overflow-hidden border border-gray-200 shadow-inner">
                                        <input 
                                            type="color" 
                                            value={settings.primaryColor || '#3b82f6'}
                                            onChange={(e) => handleColorChange(e.target.value)}
                                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 border-0 cursor-pointer"
                                            title="Clique para escolher uma cor personalizada"
                                        />
                                     </div>
                                     <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 mx-1"></div>
                                     <div className="flex items-center gap-1">
                                        <Hash size={12} className="text-gray-400"/>
                                        <input 
                                            type="text" 
                                            value={(settings.primaryColor || '').replace('#', '')}
                                            onChange={(e) => handleColorChange(`#${e.target.value}`)}
                                            className="w-16 text-sm font-mono bg-transparent border-none focus:ring-0 text-gray-700 dark:text-gray-300 uppercase p-0"
                                            maxLength={6}
                                            placeholder="HEX"
                                        />
                                     </div>
                                </div>
                            </div>

                            {/* Preset List */}
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Predefinições</label>
                                <div className="flex flex-wrap items-center gap-3">
                                    {presetColors.map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => handleColorChange(color)}
                                            className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 shadow-sm ${settings.primaryColor?.toLowerCase() === color.toLowerCase() ? 'border-gray-900 dark:border-white scale-110 ring-2 ring-offset-1 ring-gray-200 dark:ring-dark-700' : 'border-transparent'}`}
                                            style={{ backgroundColor: color }}
                                            title={color}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                            <AlertTriangle size={16} className="text-orange-500" /> Estoque Mínimo (Alerta)
                         </label>
                         <div className="flex items-center gap-2">
                            <input 
                                type="number" 
                                min="0"
                                value={settings.lowStockThreshold}
                                onChange={e => setSettings({...settings, lowStockThreshold: parseInt(e.target.value) || 0})}
                                className="w-full bg-gray-50 dark:bg-dark-950 border border-gray-300 dark:border-dark-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-500">unidades</span>
                         </div>
                         <p className="text-xs text-gray-500 mt-1">
                            Produtos com quantidade abaixo deste valor serão destacados em vermelho.
                         </p>
                      </div>
                    </div>
                  </div>
               </div>
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-dark-800 flex justify-end">
               <button 
                  type="submit"
                  disabled={saving}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
               >
                  {saving ? (
                    <>
                      <Loader2 size={20} className="animate-spin" /> Salvando...
                    </>
                  ) : (
                    <>
                      <Save size={20} /> Salvar Alterações
                    </>
                  )}
               </button>
            </div>

         </form>
      </div>
    </div>
  );
};

export default Settings;