export type ClientStatus = 'Active' | 'Paused' | 'Negotiating' | 'New Lead';
export type PersonalityType = 'aggressive' | 'passive' | 'skeptical' | 'growth';

export interface ClientOrder {
  practiceArea: string;
  leadsPerMonth: number | null;
  costPerLead: number | null;
  monthlyBudget: number | null;
  startDate: string | null;
  notes: string;
}

export interface Client {
  id: string;
  firmName: string;
  contactName: string;
  email: string;
  phone: string;
  status: ClientStatus;
  personality: PersonalityType;
  order: ClientOrder;
  createdAt: string;
  lastReadAt?: string;
}

export interface Message {
  id: string;
  clientId: string;
  content: string;
  role: 'user' | 'client';
  timestamp: string;
}

export interface ChatRequest {
  clientId: string;
  message: string;
  history: Message[];
}

export interface DashboardSettings {
  activeClients?: number | null;
  monthlyLeads?: number | null;
  monthlyRevenue?: number | null;
  avgCPL?: number | null;
  theme?: 'light' | 'dark';
}
