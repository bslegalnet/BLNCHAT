'use client';

import { useState, useMemo } from 'react';
import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  Users,
  TrendingUp,
  DollarSign,
  Target,
  ChevronRight,
  Settings,
  X,
  Sun,
  Moon,
} from 'lucide-react';
import { getClients, getAllMessages } from '@/lib/storage';
import { getDashboardSettings, saveDashboardSettings } from '@/lib/storage';
import { Client, ClientStatus, Message } from '@/lib/types';
import type { DashboardSettings } from '@/lib/types';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { STATUS_COLORS } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';

const FILTER_OPTIONS: (ClientStatus | 'All')[] = [
  'All',
  'Active',
  'Paused',
  'Negotiating',
  'New Lead',
];

export default function Dashboard() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ClientStatus | 'All'>('All');
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const clients = getClients();
  const messages = getAllMessages();
  const dashboardSettings = getDashboardSettings();

  useEffect(() => {
    const settings = getDashboardSettings();
    setTheme(settings.theme || 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    saveDashboardSettings({ ...dashboardSettings, theme: newTheme });
  };

  const stats = useMemo(() => {
    const active = clients.filter((c) => c.status === 'Active');
    const totalLeads = active.reduce(
      (sum, c) => sum + (c.order.leadsPerMonth || 0),
      0
    );
    const totalRevenue = active.reduce(
      (sum, c) => sum + (c.order.monthlyBudget || 0),
      0
    );
    const avgCPL =
      active.length > 0
        ? active.reduce((sum, c) => sum + (c.order.costPerLead || 0), 0) /
          active.length
        : 0;
    return {
      activeClients: dashboardSettings.activeClients ?? active.length,
      monthlyLeads: dashboardSettings.monthlyLeads ?? totalLeads,
      monthlyRevenue: dashboardSettings.monthlyRevenue ?? totalRevenue,
      avgCPL: dashboardSettings.avgCPL ?? Math.round(avgCPL),
    };
  }, [clients, dashboardSettings]);

  const lastMessageMap = useMemo(() => {
    const map: Record<string, Message> = {};
    for (const msg of messages) {
      if (!map[msg.clientId] || msg.timestamp > map[msg.clientId].timestamp) {
        map[msg.clientId] = msg;
      }
    }
    return map;
  }, [messages]);

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const matchesFilter = filter === 'All' || c.status === filter;
      const matchesSearch =
        !search ||
        c.firmName.toLowerCase().includes(search.toLowerCase()) ||
        c.contactName.toLowerCase().includes(search.toLowerCase()) ||
        c.order.practiceArea.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [clients, filter, search]);

  return (
    <div className="min-h-screen">
      {/* Navigation Bar — Apple vibrancy */}
      <header className="glass sticky top-0 z-30 border-b border-separator">
        <div className="mx-auto flex max-w-6xl items-center gap-3.5 px-5 py-3.5">
          <Image
            src="/logo.png"
            alt="BLN"
            width={34}
            height={34}
            className="rounded-[8px]"
          />
          <div className="flex-1">
            <h1 className="text-[17px] font-semibold tracking-[-0.01em]">
              Blackstone Legal Network
            </h1>
            <p className="text-[11px] font-medium tracking-wide text-muted-dark uppercase">
              Client Relations Interface
            </p>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-solid text-gold transition-transform duration-150 active:scale-90"
          >
            <Settings className="h-[18px] w-[18px]" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        {/* Stats — Apple grouped style */}
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            icon={<Users className="h-[18px] w-[18px]" />}
            label="Active Clients"
            value={stats.activeClients.toString()}
            delay={0}
          />
          <StatCard
            icon={<Target className="h-[18px] w-[18px]" />}
            label="Monthly Leads"
            value={stats.monthlyLeads.toLocaleString()}
            delay={1}
          />
          <StatCard
            icon={<DollarSign className="h-[18px] w-[18px]" />}
            label="Monthly Revenue"
            value={formatCurrency(stats.monthlyRevenue)}
            delay={2}
          />
          <StatCard
            icon={<TrendingUp className="h-[18px] w-[18px]" />}
            label="Avg CPL"
            value={formatCurrency(stats.avgCPL)}
            delay={3}
          />
        </div>

        {/* Search — Apple pill style */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-gold" />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl bg-surface-solid py-2.5 pl-10 pr-4 text-[15px] text-foreground placeholder:text-muted-dark focus:outline-none focus:ring-2 focus:ring-gold/40 transition-shadow duration-200 border border-gold/20"
            />
          </div>
        </div>

        {/* Filter pills — Apple segmented control feel */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={cn(
                'shrink-0 rounded-full px-4 py-[7px] text-[13px] font-medium transition-all duration-200',
                filter === opt
                  ? 'bg-gold text-background shadow-[0_2px_8px_rgba(212,168,67,0.4)]'
                  : 'bg-surface-solid text-muted hover:text-foreground border border-gold/10'
              )}
            >
              {opt}
            </button>
          ))}
        </div>

        {/* Client List — Apple grouped table style */}
        <div className="overflow-hidden rounded-2xl bg-surface-solid border border-gold/20">
          {filtered.map((client, i) => (
            <ClientRow
              key={client.id}
              client={client}
              lastMessage={lastMessageMap[client.id]}
              isLast={i === filtered.length - 1}
              index={i}
            />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="py-24 text-center text-[15px] text-muted-dark">
            No clients found
          </div>
        )}
      </main>

      {/* Settings Panel */}
      {showSettings && (
        <SettingsPanel
          settings={dashboardSettings}
          theme={theme}
          onClose={() => setShowSettings(false)}
          onSave={(newSettings) => {
            saveDashboardSettings(newSettings);
            setShowSettings(false);
            window.location.reload();
          }}
          onThemeChange={toggleTheme}
        />
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delay: number;
}) {
  return (
    <div
      className="animate-slide-up rounded-2xl bg-surface-solid p-4 border border-gold/20"
      style={{ animationDelay: `${delay * 60}ms` }}
    >
      <div className="mb-3 flex items-center gap-2 text-gold">
        {icon}
        <span className="text-[11px] font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="text-[28px] font-bold tracking-tight text-foreground leading-none">
        {value}
      </p>
    </div>
  );
}

function ClientRow({
  client,
  lastMessage,
  isLast,
  index,
}: {
  client: Client;
  lastMessage?: Message;
  isLast: boolean;
  index: number;
}) {
  const awaitingResponse = lastMessage?.role === 'client' && 
    (!client.lastReadAt || new Date(lastMessage.timestamp) > new Date(client.lastReadAt));
  
  return (
    <Link
      href={`/clients/${client.id}`}
      className={cn(
        "animate-slide-up group flex items-center gap-3.5 px-5 py-3.5 transition-colors duration-150 active:bg-surface-light",
        awaitingResponse && "bg-gold/5"
      )}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="relative">
        <Avatar name={client.firmName} />
        {awaitingResponse && (
          <div className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-gold border-2 border-background animate-pulse" />
        )}
      </div>
      <div className={cn(
        'flex min-w-0 flex-1 items-center gap-3 py-0.5',
        !isLast && 'border-b border-separator'
      )}>
        <div className="min-w-0 flex-1 pb-3.5">
          <div className="flex items-center justify-between gap-2">
            <h3 className={cn(
              "truncate text-[15px] leading-tight",
              awaitingResponse ? "font-bold text-foreground" : "font-semibold"
            )}>
              {client.firmName}
            </h3>
            <span className="shrink-0 text-[13px] text-muted-dark">
              {lastMessage ? formatDate(lastMessage.timestamp) : ''}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-[13px] text-muted-dark">{client.contactName}</span>
            <Badge className={cn('text-[10px] py-0 px-1.5', STATUS_COLORS[client.status])}>
              {client.status}
            </Badge>
          </div>
          <div className="mt-1 flex items-center gap-1">
            <p className={cn(
              "truncate text-[13px] leading-snug",
              awaitingResponse ? "text-foreground font-medium" : "text-muted-dark"
            )}>
              {lastMessage
                ? lastMessage.content
                : `${client.order.practiceArea} — No messages yet`}
            </p>
          </div>
          {client.order.leadsPerMonth && (
            <div className="mt-1.5 flex gap-3 text-[11px] text-gold">
              <span>{client.order.leadsPerMonth} leads/mo</span>
              <span>{formatCurrency(client.order.costPerLead || 0)}/lead</span>
              <span>{formatCurrency(client.order.monthlyBudget || 0)}/mo</span>
            </div>
          )}
        </div>
        <ChevronRight className="h-[14px] w-[14px] shrink-0 text-muted-dark/60" />
      </div>
    </Link>
  );
}

function SettingsPanel({
  settings,
  theme,
  onClose,
  onSave,
  onThemeChange,
}: {
  settings: DashboardSettings;
  theme: 'light' | 'dark';
  onClose: () => void;
  onSave: (settings: DashboardSettings) => void;
  onThemeChange: () => void;
}) {
  const [activeClients, setActiveClients] = useState(settings.activeClients?.toString() ?? '');
  const [monthlyLeads, setMonthlyLeads] = useState(settings.monthlyLeads?.toString() ?? '');
  const [monthlyRevenue, setMonthlyRevenue] = useState(settings.monthlyRevenue?.toString() ?? '');
  const [avgCPL, setAvgCPL] = useState(settings.avgCPL?.toString() ?? '');

  const handleSave = () => {
    onSave({
      activeClients: activeClients ? Number(activeClients) : null,
      monthlyLeads: monthlyLeads ? Number(monthlyLeads) : null,
      monthlyRevenue: monthlyRevenue ? Number(monthlyRevenue) : null,
      avgCPL: avgCPL ? Number(avgCPL) : null,
      theme: theme,
    });
  };

  const handleReset = () => {
    setActiveClients('');
    setMonthlyLeads('');
    setMonthlyRevenue('');
    setAvgCPL('');
  };

  return (
    <div className="fixed inset-0 z-50 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="absolute bottom-0 left-0 right-0 max-h-[85dvh] animate-slide-up overflow-y-auto rounded-t-2xl bg-surface-solid pb-[env(safe-area-inset-bottom)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="sticky top-0 z-10 flex justify-center bg-surface-solid pt-3 pb-2">
          <div className="h-[5px] w-9 rounded-full bg-surface-elevated" />
        </div>

        <div className="px-5 pb-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-[20px] font-bold">Dashboard Settings</h2>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-elevated text-muted transition-transform active:scale-90"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-5">
            {/* Theme Toggle */}
            <div>
              <label className="mb-1.5 block text-[11px] font-medium tracking-wide text-muted-dark uppercase pl-1">
                Appearance
              </label>
              <button
                onClick={onThemeChange}
                className="w-full flex items-center justify-between rounded-xl bg-surface-light px-4 py-3 transition-colors duration-150 active:bg-surface-elevated"
              >
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? (
                    <Moon className="h-[18px] w-[18px] text-gold" />
                  ) : (
                    <Sun className="h-[18px] w-[18px] text-gold" />
                  )}
                  <span className="text-[15px] text-foreground">
                    {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                  </span>
                </div>
                <ChevronRight className="h-[14px] w-[14px] text-muted-dark" />
              </button>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-medium tracking-wide text-muted-dark uppercase pl-1">
                Dashboard Statistics
              </label>
              <p className="mb-3 text-[13px] text-muted-dark pl-1">
                Override dashboard statistics. Leave blank to use calculated values.
              </p>

              <div className="overflow-hidden rounded-xl bg-surface-light">
                <div className="flex items-center justify-between border-b border-separator px-4 py-3">
                  <span className="text-[15px] text-muted">Active Clients</span>
                  <input
                    type="number"
                    value={activeClients}
                    onChange={(e) => setActiveClients(e.target.value)}
                    className="w-24 bg-transparent text-right text-[15px] text-foreground focus:outline-none"
                    placeholder="Auto"
                  />
                </div>
                <div className="flex items-center justify-between border-b border-separator px-4 py-3">
                  <span className="text-[15px] text-muted">Monthly Leads</span>
                  <input
                    type="number"
                    value={monthlyLeads}
                    onChange={(e) => setMonthlyLeads(e.target.value)}
                    className="w-24 bg-transparent text-right text-[15px] text-foreground focus:outline-none"
                    placeholder="Auto"
                  />
                </div>
                <div className="flex items-center justify-between border-b border-separator px-4 py-3">
                  <span className="text-[15px] text-muted">Monthly Revenue</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[15px] text-muted-dark">$</span>
                    <input
                      type="number"
                      value={monthlyRevenue}
                      onChange={(e) => setMonthlyRevenue(e.target.value)}
                      className="w-24 bg-transparent text-right text-[15px] text-foreground focus:outline-none"
                      placeholder="Auto"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-[15px] text-muted">Avg CPL</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[15px] text-muted-dark">$</span>
                    <input
                      type="number"
                      value={avgCPL}
                      onChange={(e) => setAvgCPL(e.target.value)}
                      className="w-24 bg-transparent text-right text-[15px] text-foreground focus:outline-none"
                      placeholder="Auto"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 rounded-xl bg-surface-light py-3.5 text-[15px] font-semibold text-foreground transition-all duration-150 active:scale-[0.98]"
              >
                Reset to Auto
              </button>
              <button
                onClick={handleSave}
                className="flex-1 rounded-xl bg-gold py-3.5 text-[15px] font-semibold text-background transition-all duration-150 active:scale-[0.98] hover:bg-gold-light"
              >
                Save Changes
              </button>
            </div>

            <button
              onClick={() => {
                if (confirm('Reset all data? This will reload client and message data.')) {
                  localStorage.removeItem('bln_clients');
                  localStorage.removeItem('bln_messages');
                  localStorage.removeItem('bln_seeded');
                  window.location.reload();
                }
              }}
              className="w-full rounded-xl bg-surface-light py-3.5 text-[15px] font-semibold text-red-500 transition-all duration-150 active:scale-[0.98]"
            >
              Reset All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
