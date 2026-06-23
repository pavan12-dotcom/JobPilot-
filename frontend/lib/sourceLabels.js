/**
 * lib/sourceLabels.js
 *
 * Maps internal job source DB enum values to human-readable display labels.
 *
 * Background:
 *   The backend uses `INDEED` and `NAUKRI` as Prisma enum values for historical
 *   reasons (they were placeholders when the aggregators were first added).
 *   The actual data sources are RemoteOK and Jobicy respectively.
 *   Changing the Prisma enum requires a DB migration, so we map them here
 *   at the display layer to avoid misleading users.
 */

export const SOURCE_LABELS = {
  ADZUNA: 'Adzuna',
  REMOTIVE: 'Remotive',
  THEMUSE: 'The Muse',
  LINKEDIN: 'LinkedIn',
  INDEED: 'RemoteOK',    // Actual source: remoteok.com (legacy INDEED enum)
  NAUKRI: 'Jobicy',      // Actual source: jobicy.com  (legacy NAUKRI enum)
};

/**
 * Returns the display-friendly source label for a given source enum value.
 * Falls back to the raw value if no mapping exists.
 *
 * @param {string} source - e.g. 'INDEED', 'NAUKRI', 'LINKEDIN'
 * @returns {string}
 */
export function getSourceLabel(source) {
  return SOURCE_LABELS[source] || source || 'Unknown';
}
