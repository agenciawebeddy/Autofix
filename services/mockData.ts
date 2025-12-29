import { Client, Budget, Part, Service, Status, DashboardStats, Vehicle, CompanySettings, GlobalSearchResults } from '../types';
import { supabase } from './supabaseClient';

// Helper to remove empty IDs so Supabase generates UUIDs
const cleanId = (obj: any) => {
  const newObj = { ...obj };
  if (!newObj.id || newObj.id === '') {
    delete newObj.id;
  }
  return newObj;
};

// --- Theme Utility Functions ---
// Simple hex to RGB and lightening/darkening logic for runtime theme generation
const hexToRgb = (hex: string) => {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt("0x" + hex[1] + hex[1]);
    g = parseInt("0x" + hex[2] + hex[2]);
    b = parseInt("0x" + hex[3] + hex[3]);
  } else if (hex.length === 7) {
    r = parseInt("0x" + hex[1] + hex[2]);
    g = parseInt("0x" + hex[3] + hex[4]);
    b = parseInt("0x" + hex[5] + hex[6]);
  }
  return { r, g, b };
};

const mixColors = (color1: {r:number, g:number, b:number}, color2: {r:number, g:number, b:number}, weight: number) => {
  const w1 = weight;
  const w2 = 1 - w1;
  const rgb = {
    r: Math.round(color1.r * w1 + color2.r * w2),
    g: Math.round(color1.g * w1 + color2.g * w2),
    b: Math.round(color1.b * w1 + color2.b * w2)
  };
  return `#${rgb.r.toString(16).padStart(2, '0')}${rgb.g.toString(16).padStart(2, '0')}${rgb.b.toString(16).padStart(2, '0')}`;
};

export const applyTheme = (hexColor: string) => {
  if (!hexColor) return;
  
  const base = hexToRgb(hexColor);
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 0, g: 0, b: 0 };

  const colors = {
    50: mixColors(white, base, 0.95),  // Very light
    100: mixColors(white, base, 0.85), // Light
    500: hexColor,                     // Base
    600: mixColors(black, base, 0.1),  // Slightly Darker
    700: mixColors(black, base, 0.2),  // Dark
    900: mixColors(black, base, 0.45), // Very Dark
  };

  const root = document.documentElement;
  root.style.setProperty('--primary-50', colors[50]);
  root.style.setProperty('--primary-100', colors[100]);
  root.style.setProperty('--primary-500', colors[500]);
  root.style.setProperty('--primary-600', colors[600]);
  root.style.setProperty('--primary-700', colors[700]);
  root.style.setProperty('--primary-900', colors[900]);
};

export const mockService = {
  
  // --- CLIENTS ---
  getClients: async (): Promise<Client[]> => {
    // Fetch clients and their vehicles
    const { data, error } = await supabase
      .from('clients')
      .select('*, vehicles(*)');
    
    if (error) {
      console.error('Error fetching clients:', error);
      return [];
    }

    // Map snake_case DB to camelCase Interface
    return data.map((c: any) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      vehicles: c.vehicles ? c.vehicles.map((v: any) => ({
        id: v.id,
        clientId: v.client_id,
        make: v.make,
        model: v.model,
        year: v.year,
        plate: v.plate,
        mileage: v.mileage,
        damages: v.damages || []
      })) : []
    }));
  },
  
  saveClient: async (client: Client): Promise<void> => {
    // 1. Save Client Info
    const clientData = cleanId({
      id: client.id,
      name: client.name,
      phone: client.phone,
      email: client.email
    });

    const { data: savedClient, error } = await supabase
      .from('clients')
      .upsert(clientData)
      .select()
      .single();

    if (error) throw error;
  },

  deleteClient: async (id: string): Promise<void> => {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) throw error;
  },

  // --- PARTS ---
  getParts: async (): Promise<Part[]> => {
    const { data, error } = await supabase.from('parts').select('*');
    if (error) return [];
    return data.map((p: any) => ({ ...p })); // Matches interface if columns match
  },
  
  savePart: async (part: Part): Promise<void> => {
    const partData = cleanId(part);
    const { error } = await supabase.from('parts').upsert(partData);
    if (error) throw error;
  },

  deletePart: async (id: string): Promise<void> => {
    const { error } = await supabase.from('parts').delete().eq('id', id);
    if (error) throw error;
  },

  // --- SERVICES ---
  getServices: async (): Promise<Service[]> => {
    const { data, error } = await supabase.from('services').select('*');
    if (error) return [];
    
    return data.map((s: any) => ({
      id: s.id,
      name: s.name,
      price: s.price,
      estimatedTime: s.estimated_time
    }));
  },
  
  saveService: async (service: Service): Promise<void> => {
    const serviceData = {
      ...cleanId(service),
      estimated_time: service.estimatedTime // Map back to snake_case
    };
    delete (serviceData as any).estimatedTime;

    const { error } = await supabase.from('services').upsert(serviceData);
    if (error) throw error;
  },

  deleteService: async (id: string): Promise<void> => {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) throw error;
  },

  // --- VEHICLES ---
  getVehicles: async (): Promise<(Vehicle & { clientName: string })[]> => {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*, clients(name)');
    
    if (error) return [];

    return data.map((v: any) => ({
      id: v.id,
      clientId: v.client_id,
      clientName: v.clients?.name || 'Desconhecido',
      make: v.make,
      model: v.model,
      year: v.year,
      plate: v.plate,
      mileage: v.mileage,
      damages: v.damages || []
    }));
  },

  saveVehicle: async (vehicle: Vehicle): Promise<void> => {
    const vehicleData = {
      ...cleanId(vehicle),
      client_id: vehicle.clientId
    };
    delete (vehicleData as any).clientId;
    // clientName is not stored in DB, strictly relational

    const { error } = await supabase.from('vehicles').upsert(vehicleData);
    if (error) throw error;
  },

  deleteVehicle: async (vehicleId: string, clientId: string): Promise<void> => {
    const { error } = await supabase.from('vehicles').delete().eq('id', vehicleId);
    if (error) throw error;
  },

  // --- BUDGETS ---
  getBudgets: async (): Promise<Budget[]> => {
    const { data, error } = await supabase.from('budgets').select('*').order('date_created', { ascending: false });
    if (error) return [];

    return data.map((b: any) => ({
      id: b.id,
      clientId: b.client_id,
      clientName: b.client_name,
      vehicleId: b.vehicle_id,
      vehicleName: b.vehicle_name,
      status: b.status as Status,
      dateCreated: b.date_created,
      totalAmount: b.total_amount,
      items: b.items || [],
      notes: b.notes
    }));
  },

  createBudget: async (budget: Budget): Promise<Budget> => {
    const budgetData = {
      ...cleanId(budget),
      client_id: budget.clientId,
      client_name: budget.clientName, // Denormalized for simpler history, or could rely on join
      vehicle_id: budget.vehicleId,
      vehicle_name: budget.vehicleName,
      date_created: budget.dateCreated,
      total_amount: budget.totalAmount,
      items: budget.items
    };
    
    // Cleanup camelCase keys
    delete (budgetData as any).clientId;
    delete (budgetData as any).clientName;
    delete (budgetData as any).vehicleId;
    delete (budgetData as any).vehicleName;
    delete (budgetData as any).dateCreated;
    delete (budgetData as any).totalAmount;

    const { data, error } = await supabase
      .from('budgets')
      .upsert(budgetData)
      .select()
      .single();

    if (error) throw error;

    // Return mapped back
    return {
      id: data.id,
      clientId: data.client_id,
      clientName: data.client_name,
      vehicleId: data.vehicle_id,
      vehicleName: data.vehicle_name,
      status: data.status,
      dateCreated: data.date_created,
      totalAmount: data.total_amount,
      items: data.items,
      notes: data.notes
    };
  },

  deleteBudget: async (id: string): Promise<void> => {
    const { error } = await supabase.from('budgets').delete().eq('id', id);
    if (error) throw error;
  },

  // --- DASHBOARD STATS ---
  getStats: async (): Promise<DashboardStats> => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Parallel requests for stats
    const [revenueRes, pendingRes, activeRes, completedMonthRes] = await Promise.all([
      // Total Revenue (Completed or Approved) - Simplified for demo to Completed
      supabase.from('budgets').select('total_amount').eq('status', Status.COMPLETED),
      // Pending Count
      supabase.from('budgets').select('id', { count: 'exact', head: true }).eq('status', Status.PENDING),
      // Active Services (In Progress)
      supabase.from('budgets').select('id', { count: 'exact', head: true }).eq('status', Status.IN_PROGRESS),
      // Completed This Month
      supabase.from('budgets').select('id', { count: 'exact', head: true })
        .eq('status', Status.COMPLETED)
        .gte('date_created', startOfMonth)
    ]);

    const revenue = revenueRes.data?.reduce((acc, curr) => acc + (curr.total_amount || 0), 0) || 0;

    return {
      revenue,
      pendingBudgets: pendingRes.count || 0,
      activeServices: activeRes.count || 0,
      completedThisMonth: completedMonthRes.count || 0
    };
  },

  // --- SETTINGS ---
  getCompanySettings: async (): Promise<CompanySettings> => {
    const { data, error } = await supabase.from('settings').select('*').limit(1).single();
    
    // Fallback logic: 
    // If DB is missing primaryColor (old schema) or fails, we try to use localStorage
    // to keep the user's selected theme active.
    const localColor = typeof window !== 'undefined' ? localStorage.getItem('primaryColor') : null;

    const defaults = {
      name: 'AutoFix Oficina Mecânica',
      address: '',
      phone: '',
      email: '',
      website: '',
      responsibleName: '',
      logoUrl: '',
      lowStockThreshold: 10,
      primaryColor: localColor || '#3b82f6' // Prefer local storage over hardcoded blue
    };

    if (error || !data) {
      return defaults;
    }

    return {
      name: data.name,
      address: data.address,
      phone: data.phone,
      email: data.email,
      website: data.website,
      responsibleName: data.responsible_name,
      logoUrl: data.logo_url,
      lowStockThreshold: data.low_stock_threshold,
      // If data.primary_color is undefined/null (missing column), use fallback (localStorage or blue)
      primaryColor: data.primary_color || defaults.primaryColor
    };
  },

  saveCompanySettings: async (settings: CompanySettings): Promise<void> => {
    // Determine payload mapped to snake_case
    const dbPayload = {
      name: settings.name,
      address: settings.address,
      phone: settings.phone,
      email: settings.email,
      website: settings.website,
      responsible_name: settings.responsibleName,
      logo_url: settings.logoUrl,
      low_stock_threshold: settings.lowStockThreshold,
      primary_color: settings.primaryColor
    };

    // Check if we have an existing row (assuming singleton table)
    const { data: existing } = await supabase.from('settings').select('id').limit(1).maybeSingle();
    
    try {
      if (existing?.id) {
        // Update existing record
        const { error } = await supabase
          .from('settings')
          .update(dbPayload)
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('settings')
          .insert(dbPayload);
        
        if (error) throw error;
      }
    } catch (err: any) {
      // Fallback: If error is related to missing column (Postgres error 42703), try saving without primary_color
      // This allows the app to work even if DB schema isn't updated for the new feature
      if (err.code === '42703' || err.message?.includes('primary_color')) {
        console.warn("Primary color column missing in DB, saving other settings. Color will be saved locally.");
        const fallbackPayload = { ...dbPayload };
        delete (fallbackPayload as any).primary_color;
        
        if (existing?.id) {
          await supabase.from('settings').update(fallbackPayload).eq('id', existing.id);
        } else {
          await supabase.from('settings').insert(fallbackPayload);
        }
      } else {
        throw err;
      }
    }
  },

  // --- GLOBAL SEARCH ---
  globalSearch: async (query: string): Promise<GlobalSearchResults> => {
    if (!query || query.length < 2) return { clients: [], vehicles: [], budgets: [] };

    const searchQuery = `%${query}%`;

    // Execute queries in parallel
    const [clientsRes, vehiclesRes, budgetsRes] = await Promise.all([
      supabase.from('clients').select('*').or(`name.ilike.${searchQuery},email.ilike.${searchQuery},phone.ilike.${searchQuery}`).limit(5),
      supabase.from('vehicles').select('*, clients(name)').or(`plate.ilike.${searchQuery},model.ilike.${searchQuery}`).limit(5),
      // For budgets, we search by Client Name (stored in budget table) or exact ID match if it's a UUID (skipped for simplicity here, doing client_name)
      supabase.from('budgets').select('*').ilike('client_name', searchQuery).limit(5)
    ]);

    // Map Results
    const clients: Client[] = (clientsRes.data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      vehicles: [] // Minimal info needed for search
    }));

    const vehicles: (Vehicle & { clientName?: string })[] = (vehiclesRes.data || []).map((v: any) => ({
      id: v.id,
      clientId: v.client_id,
      clientName: v.clients?.name,
      make: v.make,
      model: v.model,
      year: v.year,
      plate: v.plate,
      mileage: v.mileage
    }));

    const budgets: Budget[] = (budgetsRes.data || []).map((b: any) => ({
      id: b.id,
      clientId: b.client_id,
      clientName: b.client_name,
      vehicleId: b.vehicle_id,
      vehicleName: b.vehicle_name,
      status: b.status as Status,
      dateCreated: b.date_created,
      totalAmount: b.total_amount,
      items: []
    }));

    return { clients, vehicles, budgets };
  }
};