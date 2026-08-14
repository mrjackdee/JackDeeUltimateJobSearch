import { describe, expect, it } from 'vitest';
import { inferMetro, remoteEligibleForGeorgiaOrTexas } from '@/lib/geo';

describe('location rules',()=>{
  it('recognizes Atlanta',()=>expect(inferMetro('Atlanta, GA',25)).toBe('ATLANTA'));
  it('recognizes Dallas',()=>expect(inferMetro('Dallas, TX',25)).toBe('DALLAS'));
  it('does not treat Fort Worth as within 25 miles of Dallas',()=>expect(inferMetro('Fort Worth, TX',25)).toBeUndefined());
  it('allows nationwide remote',()=>expect(remoteEligibleForGeorgiaOrTexas('Remote anywhere in the United States')).toBe(true));
  it('rejects explicit GA and TX exclusion',()=>expect(remoteEligibleForGeorgiaOrTexas('Cannot hire in Georgia and Texas')).toBe(false));
});
