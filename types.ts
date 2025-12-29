export enum Status {
  PENDING = 'Pendente',
  APPROVED = 'Aprovado',
  IN_PROGRESS = 'Em Execução',
  COMPLETED = 'Concluído',
  CANCELED = 'Cancelado'
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  vehicles: Vehicle[];
}

export interface VehicleDamage {
  id: string;
  imageUrl: string; // Base64 string for the image
  description: string;
  dateAdded: string;
}

export interface Vehicle {
  id: string;
  clientId: string;
  make: string;
  model: string;
  year: number;
  plate: string;
  mileage: number;
  damages?: VehicleDamage[]; // New field for damage photos/descriptions
}

export interface Part {
  id: string;
  name: string;
  sku: string;
  price: number; // Sale price
  cost: number;
  stock: number;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  estimatedTime: number; // in minutes
}

export interface BudgetLineItem {
  id: string;
  type: 'PART' | 'SERVICE';
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Budget {
  id: string;
  clientId: string;
  clientName: string;
  vehicleId: string;
  vehicleName: string; // e.g., "Honda Civic 2020"
  status: Status;
  dateCreated: string;
  totalAmount: number;
  items: BudgetLineItem[];
  notes?: string;
}

export interface DashboardStats {
  revenue: number;
  pendingBudgets: number;
  activeServices: number;
  completedThisMonth: number;
}

export interface CompanySettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  responsibleName: string; // Nome do Responsável
  logoUrl?: string; // Base64 string
  lowStockThreshold: number; // Configuração de estoque baixo
  primaryColor?: string; // Custom dashboard color
}

export interface GlobalSearchResults {
  clients: Client[];
  vehicles: (Vehicle & { clientName?: string })[];
  budgets: Budget[];
}