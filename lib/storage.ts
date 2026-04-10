import { Client, Message } from './types';
import type { DashboardSettings } from './types';
import { STORAGE_KEYS } from './constants';

export function getClients(): Client[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.CLIENTS);
  return data ? JSON.parse(data) : [];
}

export function getClient(id: string): Client | undefined {
  return getClients().find((c) => c.id === id);
}

export function saveClients(clients: Client[]): void {
  localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
}

export function updateClient(id: string, updates: Partial<Client>): Client | undefined {
  const clients = getClients();
  const index = clients.findIndex((c) => c.id === id);
  if (index === -1) return undefined;
  clients[index] = { ...clients[index], ...updates };
  saveClients(clients);
  return clients[index];
}

export function getMessages(clientId: string): Message[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.MESSAGES);
  const all: Message[] = data ? JSON.parse(data) : [];
  return all.filter((m) => m.clientId === clientId);
}

export function getAllMessages(): Message[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.MESSAGES);
  return data ? JSON.parse(data) : [];
}

export function addMessage(message: Message): void {
  const all = getAllMessages();
  all.push(message);
  localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(all));
}

export function isSeeded(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(STORAGE_KEYS.SEEDED) === 'true';
}

export function markSeeded(): void {
  localStorage.setItem(STORAGE_KEYS.SEEDED, 'true');
}

export function markClientAsRead(id: string): void {
  updateClient(id, { lastReadAt: new Date().toISOString() });
}

export function getDashboardSettings(): DashboardSettings {
  if (typeof window === 'undefined') return {};
  const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  return data ? JSON.parse(data) : {};
}

export function saveDashboardSettings(settings: DashboardSettings): void {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}
