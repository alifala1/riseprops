import { Property } from '@/types';

export const DEFAULT_LOCATIONS = ['Dekwaneh', 'Sin el Fil', 'Horch Tabet'];

/**
 * Returns a list of locations ranked by:
 * 1. Matching search filter (starts-with matches prioritized over contains matches)
 * 2. Property count (highest to lowest)
 * 3. Alphabetical order (A to Z) for ties
 * 
 * Optionally limits results to `limit` items (e.g. 8).
 */
export function getRankedLocations(
  properties: Property[] = [],
  searchFilter: string = '',
  limit?: number
): string[] {
  const counts: Record<string, number> = {};

  // Seed default locations
  DEFAULT_LOCATIONS.forEach((loc) => {
    counts[loc] = 0;
  });

  // Count occurrences in properties
  properties.forEach((p) => {
    if (p.location && p.location.trim()) {
      const trimmed = p.location.trim();
      counts[trimmed] = (counts[trimmed] || 0) + 1;
    }
  });

  const query = searchFilter.toLowerCase().trim();
  let locations = Object.keys(counts);

  // Filter locations if search query exists
  if (query) {
    locations = locations.filter((loc) =>
      loc.toLowerCase().includes(query)
    );
  }

  // Sort locations
  locations.sort((a, b) => {
    // If searching, prioritize items starting with query
    if (query) {
      const aStarts = a.toLowerCase().startsWith(query);
      const bStarts = b.toLowerCase().startsWith(query);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
    }

    const countA = counts[a] || 0;
    const countB = counts[b] || 0;

    // Highest count first
    if (countB !== countA) {
      return countB - countA;
    }

    // Alphabetical order for ties
    return a.localeCompare(b);
  });

  if (limit && limit > 0) {
    return locations.slice(0, limit);
  }

  return locations;
}
