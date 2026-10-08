/** Safe JSON parsing helpers shared across server code. */
export function parseJsonArray<T>(raw: string | null | undefined): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function parseItinerary(
  rows: { day: number; time: string | null; title: string; description: string | null }[],
): { day: number; time?: string; title: string; description?: string }[] {
  return rows.map((r) => ({
    day: r.day,
    time: r.time ?? undefined,
    title: r.title,
    description: r.description ?? undefined,
  }));
}
