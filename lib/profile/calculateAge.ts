/**
 * Full DOB → age in years. Returns null for missing/invalid/future dates
 * or when the resulting age is outside a sane player range.
 */
export function calculateAge(dob: string | Date | null | undefined): number | null {
  if (!dob) return null;

  const birth = typeof dob === "string" ? parseDateOnly(dob) : new Date(dob);
  if (!birth || Number.isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }

  if (age < 1 || age > 120) return null;
  return age;
}

/** Parse YYYY-MM-DD without UTC day-shift surprises. */
export function parseDateOnly(value: string): Date | null {
  const dateOnly = value.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOnly);
  if (!match) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const d = new Date(year, month, day);
  if (
    d.getFullYear() !== year ||
    d.getMonth() !== month ||
    d.getDate() !== day
  ) {
    return null;
  }
  return d;
}

/** Local calendar date as YYYY-MM-DD (avoids toISOString UTC shift). */
export function formatDateOnlyLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Sensible default when opening the DOB picker with no value set. */
export function defaultDobPickerDate(minAge = 12): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - minAge);
  return d;
}
