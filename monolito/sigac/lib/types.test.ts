import { describe, expect, it } from 'vitest';
import {
  activityDateOnly,
  availabilityDateOnly,
  type Activity,
  type Availability,
} from './types';

describe('activityDateOnly', () => {
  it('extrae YYYY-MM-DD de ISO con tiempo', () => {
    const a = { activityDate: '2026-04-06T00:00:00.000Z' } as Pick<
      Activity,
      'activityDate'
    >;
    expect(activityDateOnly(a)).toBe('2026-04-06');
  });

  it('devuelve prefijo si la cadena es corta', () => {
    const a = { activityDate: '2026-04' } as Pick<Activity, 'activityDate'>;
    expect(activityDateOnly(a)).toBe('2026-04');
  });
});

describe('availabilityDateOnly', () => {
  it('normaliza fecha de disponibilidad', () => {
    const row = { date: '2026-01-15T12:00:00.000Z' } as Pick<
      Availability,
      'date'
    >;
    expect(availabilityDateOnly(row)).toBe('2026-01-15');
  });

});
