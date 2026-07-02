/**
 * Build-time feature flags.
 *
 * Flags are read from Vite env vars (VITE_FEATURE_*) so a feature can ship in the
 * bundle but stay invisible unless explicitly enabled for a build/environment.
 * Pair with a role check for "hidden beta" features.
 */

/** Case Study Generator (admin-only beta). Enable with VITE_FEATURE_CASE_STUDY=true */
export const CASE_STUDY_BETA = import.meta.env.VITE_FEATURE_CASE_STUDY === 'true';
