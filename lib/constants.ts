export const STORAGE_KEYS = {
  CLIENTS: 'bln_clients',
  MESSAGES: 'bln_messages',
  SEEDED: 'bln_seeded',
  SETTINGS: 'bln_settings',
} as const;

export const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Paused: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  Negotiating: 'bg-gold/20 text-gold-light border-gold/30',
  'New Lead': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

export const PERSONALITY_DESCRIPTIONS: Record<string, string> = {
  aggressive:
    'You are direct, demanding, and always pushing for better deals. You challenge pricing, demand volume discounts, and threaten to go to competitors. You respond with short, forceful statements.',
  passive:
    'You are agreeable, easy-going, and rarely push back. You accept suggestions readily, ask few questions, and are generally happy with the service. You respond warmly and briefly.',
  skeptical:
    'You are cautious, analytical, and question everything. You want data, proof, and ROI calculations. You are slow to commit and always looking for the catch. You ask probing questions.',
  growth:
    'You are ambitious, forward-thinking, and excited about scaling. You want more leads, bigger campaigns, and faster growth. You are enthusiastic but budget-conscious. You ask about expansion options.',
};

export const PRACTICE_AREAS = [
  'Personal Injury',
  'Workers Compensation',
  'Medical Malpractice',
  'Criminal Defense',
  'Immigration',
  'Mass Tort',
  'Family Law',
  'Social Security Disability',
];
