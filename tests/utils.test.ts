import { describe, expect, it } from 'vitest';
import { parseSalary, safeFilePart, fingerprint } from '@/lib/utils';

describe('file naming',()=>{
  it('normalizes unsafe filename characters deterministically',()=>expect(safeFilePart('Acme / Global: Inc.')).toBe('Acme_Global_Inc'));
  it('creates stable fingerprints',()=>expect(fingerprint(['Acme','Program Manager','Remote'])).toBe(fingerprint(['Acme','Program Manager','Remote'])));
});

describe('salary parsing',()=>{
  it('parses k ranges',()=>expect(parseSalary('$120k - $155k')).toEqual({min:120000,max:155000}));
  it('parses five-digit salaries without truncation',()=>expect(parseSalary('$90,000 per year').min).toBe(90000));
  it('annualizes explicit hourly rates',()=>expect(parseSalary('$50 per hour').min).toBe(104000));
});
