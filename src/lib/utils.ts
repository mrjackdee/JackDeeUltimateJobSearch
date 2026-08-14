import { createHash } from 'node:crypto';

export function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function fingerprint(parts: Array<string | undefined>): string {
  return createHash('sha256').update(parts.filter(Boolean).map(v => normalizeText(v!)).join('|')).digest('hex').slice(0, 24);
}

export function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function daysOld(date?: string): number {
  if (!date) return 99;
  const time = new Date(date).getTime();
  if (!Number.isFinite(time)) return 99;
  return Math.max(0, Math.floor((Date.now() - time) / 86400000));
}

export function safeFilePart(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80) || 'Unknown';
}

export function salaryText(min?: number, max?: number): string {
  if (!min && !max) return 'Not disclosed';
  const f = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  if (min && max) return `${f(min)}–${f(max)}`;
  return min ? `${f(min)}+` : `Up to ${f(max!)}`;
}

export function parseSalary(text: string): { min?: number; max?: number } {
  const normalized = text.replace(/,/g, '');
  const hourly = /(?:per\s+hour|\/\s?h(?:ou)?r|hourly)/i.test(normalized);
  const matches = [...normalized.matchAll(/\$\s?(\d{2,6})(?:\.\d+)?\s*(k)?\b/gi)];
  const values = matches.map(m => {
    const base = Number(m[1]);
    if (!Number.isFinite(base)) return 0;
    const amount = m[2]?.toLowerCase() === 'k' ? base * 1000 : base < 1000 ? base * 1000 : base;
    return hourly ? (base < 1000 ? base * 2080 : amount) : amount;
  }).filter(v => v >= 30000 && v <= 1000000);
  if (!values.length) return {};
  return { min: Math.min(...values), max: values.length > 1 ? Math.max(...values) : undefined };
}


export function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}
