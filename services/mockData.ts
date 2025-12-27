import { Client, Budget, Part, Service, Status, DashboardStats, Vehicle, CompanySettings } from '../types';
import { supabase } from './supabaseClient';

// Helper to remove empty IDs so Supabase generates UUIDs
const cleanId = (obj: any) => {
  const newObj = { ...obj };
  if (!newObj.id || newObj.id === '') {
    delete newObj.id;
  }
  return newObj;
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
    
    // Note: Vehicles are typically saved via saveVehicle, but if provided here we could handle them.
    // For this implementation, we focus on the client details to match the UI flow.
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
    
    if (error || !data) {
      // Return defaults if table empty or error
      return {
        name: 'AutoFix Oficina Mecânica',
        address: '',
        phone: '',
        email: '',
        website: '',
        responsibleName: '',
        logoUrl: '',
        lowStockThreshold: 10
      };
    }

    return {
      name: data.name,
      address: data.address,
      phone: data.phone,
      email: data.email,
      website: data.website,
      responsibleName: data.responsible_name,
      logoUrl: data.logo_url,
      lowStockThreshold: data.low_stock_threshold
    };
  },

  saveCompanySettings: async (settings: CompanySettings): Promise<void> => {
    // We assume there's only one settings row, or we upsert with a fixed ID if we enforce it.
    // For now, we try to grab the first ID, otherwise insert.
    const { data: existing } = await supabase.from('settings').select('id').limit(1).maybeSingle();
    
    const settingsData = {
      ...(existing?.id ? { id: existing.id } : {}), // Keep ID if exists
      name: settings.name,
      address: settings.address,
      phone: settings.phone,
      email: settings.email,
      website: settings.website,
      responsible_name: settings.responsibleName,
      logo_url: settings.logoUrl,
      low_stock_threshold: settings.lowStockThreshold
    };

    const { error } = await supabase.from('settings').upsert(settingsData);
    if (error) throw error;
  }
};