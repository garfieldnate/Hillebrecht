/**
 * Plant Timing Utilities
 *
 * Derives flat, queryable timing columns from JSON timing blobs.
 * Called on insert (via addPlantSimple) and during backfill.
 */

import type { SpringTiming, FallTiming, GerminationRequirements } from "../types/plant.types.ts";

export interface DerivedTimingFields {
  // Spring flat columns
  springDirectSeedEarliestWeeks:  number | null;
  springDirectSeedLatestWeeks:    number | null;
  springIndoorStartEarliestWeeks: number | null;
  springIndoorStartLatestWeeks:   number | null;
  springTransplantEarliestWeeks:  number | null;
  springTransplantLatestWeeks:    number | null;

  // Fall flat columns
  fallDirectSeedEarliestWeeks:    number | null;
  fallDirectSeedLatestWeeks:      number | null;
  fallIndoorStartEarliestWeeks:   number | null;
  fallIndoorStartLatestWeeks:     number | null;
  fallTransplantEarliestWeeks:    number | null;
  fallTransplantLatestWeeks:      number | null;

  // Prep requirements
  stratDaysRequired: number | null;
  soakHoursRequired: number | null;

  // Pre-computed action start (earliest week any action must begin)
  springActionStartWeeks: number | null;
  fallActionStartWeeks:   number | null;
}

/**
 * Compute all derived timing fields from the JSON timing blobs.
 *
 * `springActionStartWeeks` is the earliest week at which the grower must
 * take any action for spring planting, accounting for stratification lead
 * time.  Soaking is not subtracted (it's done the night before planting).
 *
 * Logic for spring:
 *   1. Collect candidate "first-step" weeks:
 *      - indoorStart.earliest (if present)
 *      - directSeed.earliest  (if present)
 *      - transplant.earliest  (only when both indoorStart AND directSeed are absent)
 *   2. earliest = Math.min(...candidates)
 *   3. Subtract stratification lead time: Math.ceil(stratDays / 7)
 *
 * Same pattern for fall using fallTiming.
 */
export function computeDerivedTimingFields(
  springTiming: SpringTiming | null | undefined,
  fallTiming:   FallTiming   | null | undefined,
  germinationRequirements: GerminationRequirements | null | undefined,
): DerivedTimingFields {
  // ── Prep requirements ────────────────────────────────────────────────────
  const stratDaysRequired = germinationRequirements?.stratification?.duration ?? null;
  const soakHoursRequired = germinationRequirements?.soaking?.duration ?? null;
  const stratWeeks = stratDaysRequired !== null ? Math.ceil(stratDaysRequired / 7) : 0;

  // ── Spring flat columns ───────────────────────────────────────────────────
  const springDirectSeedEarliestWeeks =
    springTiming?.directSeed?.earliest?.weeksFromFrost ?? null;
  const springDirectSeedLatestWeeks =
    springTiming?.directSeed?.latest?.weeksFromFrost ?? null;
  const springIndoorStartEarliestWeeks =
    springTiming?.indoorStart?.earliest?.weeksFromFrost ?? null;
  const springIndoorStartLatestWeeks =
    springTiming?.indoorStart?.latest?.weeksFromFrost ?? null;
  const springTransplantEarliestWeeks =
    springTiming?.transplant?.earliest?.weeksFromFrost ?? null;
  const springTransplantLatestWeeks =
    springTiming?.transplant?.latest?.weeksFromFrost ?? null;

  // ── Fall flat columns ─────────────────────────────────────────────────────
  const fallDirectSeedEarliestWeeks =
    fallTiming?.directSeed?.earliest?.weeksFromFrost ?? null;
  const fallDirectSeedLatestWeeks =
    fallTiming?.directSeed?.latest?.weeksFromFrost ?? null;
  const fallIndoorStartEarliestWeeks =
    fallTiming?.indoorStart?.earliest?.weeksFromFrost ?? null;
  const fallIndoorStartLatestWeeks =
    fallTiming?.indoorStart?.latest?.weeksFromFrost ?? null;
  const fallTransplantEarliestWeeks =
    fallTiming?.transplant?.earliest?.weeksFromFrost ?? null;
  const fallTransplantLatestWeeks =
    fallTiming?.transplant?.latest?.weeksFromFrost ?? null;

  // ── springActionStartWeeks ────────────────────────────────────────────────
  const springActionStartWeeks = computeActionStartWeeks(
    springIndoorStartEarliestWeeks,
    springDirectSeedEarliestWeeks,
    springTransplantEarliestWeeks,
    stratWeeks,
  );

  // ── fallActionStartWeeks ──────────────────────────────────────────────────
  const fallActionStartWeeks = computeActionStartWeeks(
    fallIndoorStartEarliestWeeks,
    fallDirectSeedEarliestWeeks,
    fallTransplantEarliestWeeks,
    stratWeeks,
  );

  return {
    springDirectSeedEarliestWeeks,
    springDirectSeedLatestWeeks,
    springIndoorStartEarliestWeeks,
    springIndoorStartLatestWeeks,
    springTransplantEarliestWeeks,
    springTransplantLatestWeeks,
    fallDirectSeedEarliestWeeks,
    fallDirectSeedLatestWeeks,
    fallIndoorStartEarliestWeeks,
    fallIndoorStartLatestWeeks,
    fallTransplantEarliestWeeks,
    fallTransplantLatestWeeks,
    stratDaysRequired,
    soakHoursRequired,
    springActionStartWeeks,
    fallActionStartWeeks,
  };
}

/**
 * Derive the action-start week from the three possible "first step" windows.
 *
 * Rule: include indoorStart and directSeed as candidates whenever they exist.
 * Include transplant ONLY when both indoorStart and directSeed are absent
 * (transplant-only plants have no earlier prep step).
 *
 * Then subtract stratification lead-time weeks.
 */
function computeActionStartWeeks(
  indoorStartEarliest: number | null,
  directSeedEarliest:  number | null,
  transplantEarliest:  number | null,
  stratWeeks: number,
): number | null {
  const candidates: number[] = [];

  if (indoorStartEarliest !== null) candidates.push(indoorStartEarliest);
  if (directSeedEarliest  !== null) candidates.push(directSeedEarliest);

  // Only fall back to transplant if no active-prep windows exist
  if (candidates.length === 0 && transplantEarliest !== null) {
    candidates.push(transplantEarliest);
  }

  if (candidates.length === 0) return null;

  const earliestAction = Math.min(...candidates);
  return earliestAction - stratWeeks;
}
