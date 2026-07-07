export type AgeBand = "10대" | "20대" | "30대" | "40대" | "50대+" | null;

export function birthYearToAge(birthYear: number, currentYear?: number): number {
  const year = currentYear ?? new Date().getFullYear();
  return year - birthYear;
}

export function birthYearToAgeBand(
  birthYear: number | null | undefined,
  currentYear?: number,
): AgeBand {
  if (birthYear == null) return null;
  const age = birthYearToAge(birthYear, currentYear);
  if (age < 20) return "10대";
  if (age < 30) return "20대";
  if (age < 40) return "30대";
  if (age < 50) return "40대";
  return "50대+";
}
