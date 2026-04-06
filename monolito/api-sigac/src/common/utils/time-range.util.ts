const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidTimeFormat(value: string): boolean {
  return TIME_RE.test(value);
}

export function timeToMinutes(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}

export function isValidTimeOrder(startTime: string, endTime: string): boolean {
  return timeToMinutes(startTime) < timeToMinutes(endTime);
}

export function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  const as = timeToMinutes(aStart);
  const ae = timeToMinutes(aEnd);
  const bs = timeToMinutes(bStart);
  const be = timeToMinutes(bEnd);
  return as < be && bs < ae;
}

/**
 * El intervalo exterior [outerStart, outerEnd] contiene por completo
 * el intervalo interior [innerStart, innerEnd] (mismo día, HH:mm).
 */
export function intervalFullyContains(
  outerStart: string,
  outerEnd: string,
  innerStart: string,
  innerEnd: string,
): boolean {
  return (
    timeToMinutes(outerStart) <= timeToMinutes(innerStart) &&
    timeToMinutes(outerEnd) >= timeToMinutes(innerEnd)
  );
}

export function parseDateOnly(yyyyMmDd: string): Date {
  const parts = yyyyMmDd.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    throw new Error('invalid date');
  }
  const [y, m, d] = parts;
  return new Date(Date.UTC(y, m - 1, d));
}
