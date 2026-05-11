/**
 * Pickleball Match Scheduling Engine
 *
 * Pure function module — no database dependencies.
 * Receives match data, returns schedule assignments.
 */

// ─── Types ──────────────────────────────────────────────

export interface TimeSlot {
  date: string;       // "2026-05-12" | "2026-05-13" | "2026-05-14"
  startTime: string;  // "17:00" | "17:20" | ... | "19:40"
  slotIndex: number;  // 0-8 within the day
}

export interface CourtSlot {
  court: string;      // "Court 1" | "Court 2" | "Court 3"
  timeSlot: TimeSlot;
}

export interface ScheduleAssignment {
  matchId: string;
  court: string;
  scheduledDate: Date; // Full ISO datetime
}

export interface ScheduleConflict {
  type: "court_occupied" | "player_overlap" | "category_mismatch";
  matchId: string;
  details: string;
}

export interface MatchForScheduling {
  id: string;
  category: string;
  roundNumber: number;
  entry1Id: string | null;
  entry2Id: string | null;
}

// ─── Constants ──────────────────────────────────────────

export const TOURNAMENT_DATES = ["2026-05-12", "2026-05-13", "2026-05-14"] as const;

export const TIME_SLOTS = [
  "17:00", "17:20", "17:40",
  "18:00", "18:20", "18:40",
  "19:00", "19:20", "19:40",
] as const;

export const SLOTS_PER_DAY = 9;

export const COURTS = ["Court 1", "Court 2", "Court 3"] as const;

export const COURT_CATEGORIES: Record<string, string[]> = {
  "Court 1": ["MENS_SINGLES"],
  "Court 2": ["WOMENS_SINGLES", "WOMENS_DOUBLES", "MENS_SINGLES"],
  "Court 3": ["MIXED_DOUBLES", "MENS_DOUBLES"],
};

export const MATCH_DURATION_MINUTES = 20;

// Total capacity: 3 courts × 3 days × 9 slots = 81
export const TOTAL_CAPACITY = COURTS.length * TOURNAMENT_DATES.length * SLOTS_PER_DAY;

// ─── Helpers ────────────────────────────────────────────

/**
 * Build a full Date object from a date string and time string.
 * Uses IST (UTC+05:30) timezone offset.
 */
export function buildDateTime(date: string, startTime: string): Date {
  // Create as UTC with IST offset applied
  const [hours, minutes] = startTime.split(":").map(Number);
  return new Date(`${date}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00+05:30`);
}

/**
 * Extract date string ("2026-05-12") and time string ("17:00") from a Date.
 */
export function extractSlotInfo(scheduledDate: Date): { date: string; startTime: string } | null {
  // Convert to IST
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(scheduledDate.getTime() + istOffset);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(istDate.getUTCDate()).padStart(2, "0");
  const hours = String(istDate.getUTCHours()).padStart(2, "0");
  const minutes = String(istDate.getUTCMinutes()).padStart(2, "0");
  const date = `${year}-${month}-${day}`;
  const startTime = `${hours}:${minutes}`;

  if (!TOURNAMENT_DATES.includes(date as typeof TOURNAMENT_DATES[number])) return null;
  if (!TIME_SLOTS.includes(startTime as typeof TIME_SLOTS[number])) return null;

  return { date, startTime };
}

/**
 * Check if a match is "playable" — both entries are real UUIDs
 * (not null, not starting with "WINNER_").
 */
export function isPlayableMatch(match: MatchForScheduling): boolean {
  return (
    match.entry1Id !== null &&
    match.entry2Id !== null &&
    !match.entry1Id.startsWith("WINNER_") &&
    !match.entry2Id.startsWith("WINNER_")
  );
}

/**
 * Get the slot index (0-based) for a time string.
 */
function getSlotIndex(startTime: string): number {
  return TIME_SLOTS.indexOf(startTime as typeof TIME_SLOTS[number]);
}

/**
 * Get a global ordering index for a court slot (for chronological comparison).
 * Day 0 slots 0-8, Day 1 slots 9-17, Day 2 slots 18-26.
 */
function getGlobalSlotIndex(date: string, startTime: string): number {
  const dayIndex = TOURNAMENT_DATES.indexOf(date as typeof TOURNAMENT_DATES[number]);
  const slotIndex = getSlotIndex(startTime);
  if (dayIndex < 0 || slotIndex < 0) return -1;
  return dayIndex * SLOTS_PER_DAY + slotIndex;
}

/**
 * Get all player IDs involved in a match.
 */
function getPlayerIds(match: MatchForScheduling): string[] {
  const ids: string[] = [];
  if (match.entry1Id && !match.entry1Id.startsWith("WINNER_")) ids.push(match.entry1Id);
  if (match.entry2Id && !match.entry2Id.startsWith("WINNER_")) ids.push(match.entry2Id);
  return ids;
}

// ─── validateAssignment ─────────────────────────────────

/**
 * Validate a proposed schedule assignment against existing assignments.
 * Returns an array of conflicts (empty = valid).
 *
 * Checks:
 * 1. Court-category constraint
 * 2. Court slot uniqueness (no two matches on same court+time)
 * 3. Player time overlap (no player in two matches at same time slot)
 */
export function validateAssignment(
  assignment: ScheduleAssignment,
  allAssignments: ScheduleAssignment[],
  matches: MatchForScheduling[]
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];

  // Find the match being assigned
  const match = matches.find((m) => m.id === assignment.matchId);
  if (!match) return conflicts;

  // 1. Court-category constraint
  const allowedCategories = COURT_CATEGORIES[assignment.court];
  if (allowedCategories && match.category && !allowedCategories.includes(match.category)) {
    conflicts.push({
      type: "category_mismatch",
      matchId: assignment.matchId,
      details: `Category "${match.category}" is not allowed on ${assignment.court}. Allowed: ${allowedCategories.join(", ")}`,
    });
  }

  // Extract slot info for the proposed assignment
  const proposedSlot = extractSlotInfo(assignment.scheduledDate);
  if (!proposedSlot) return conflicts;

  // 2. Court slot uniqueness
  for (const existing of allAssignments) {
    if (existing.matchId === assignment.matchId) continue;
    if (existing.court !== assignment.court) continue;

    const existingSlot = extractSlotInfo(existing.scheduledDate);
    if (!existingSlot) continue;

    if (existingSlot.date === proposedSlot.date && existingSlot.startTime === proposedSlot.startTime) {
      conflicts.push({
        type: "court_occupied",
        matchId: assignment.matchId,
        details: `${assignment.court} at ${proposedSlot.date} ${proposedSlot.startTime} is already occupied by match ${existing.matchId}`,
      });
      break;
    }
  }

  // 3. Player time overlap
  const matchPlayers = getPlayerIds(match);
  if (matchPlayers.length > 0) {
    for (const existing of allAssignments) {
      if (existing.matchId === assignment.matchId) continue;

      const existingSlot = extractSlotInfo(existing.scheduledDate);
      if (!existingSlot) continue;

      // Only check if same time slot (regardless of court)
      if (existingSlot.date !== proposedSlot.date || existingSlot.startTime !== proposedSlot.startTime) {
        continue;
      }

      const existingMatch = matches.find((m) => m.id === existing.matchId);
      if (!existingMatch) continue;

      const existingPlayers = getPlayerIds(existingMatch);
      const overlapping = matchPlayers.filter((p) => existingPlayers.includes(p));

      if (overlapping.length > 0) {
        conflicts.push({
          type: "player_overlap",
          matchId: assignment.matchId,
          details: `Player(s) ${overlapping.join(", ")} already have a match at ${proposedSlot.date} ${proposedSlot.startTime} (match ${existing.matchId})`,
        });
        break;
      }
    }
  }

  return conflicts;
}

// ─── generateSchedule ───────────────────────────────────

/**
 * Generate a complete schedule for all playable matches.
 *
 * Algorithm:
 * 1. Filter to playable matches only
 * 2. Group by court assignment (based on category)
 * 3. Sort within each court group by round, then by match order
 * 4. Assign slots chronologically (earlier days first, earlier slots first)
 * 5. Handle MENS_SINGLES overflow to Court 2
 * 6. Validate no player overlaps across courts
 */
export function generateSchedule(
  matches: MatchForScheduling[],
  existingAssignments?: ScheduleAssignment[]
): { assignments: ScheduleAssignment[]; conflicts: ScheduleConflict[] } {
  const playable = matches.filter(isPlayableMatch);
  const assignments: ScheduleAssignment[] = existingAssignments ? [...existingAssignments] : [];
  const conflicts: ScheduleConflict[] = [];

  // Build all available slots per court (chronological order)
  const allSlots = buildAllSlots();

  // Track which slots are occupied per court
  const occupiedSlots: Record<string, Set<string>> = {
    "Court 1": new Set<string>(),
    "Court 2": new Set<string>(),
    "Court 3": new Set<string>(),
  };

  // Track which time slots have which players (for overlap detection)
  const playerTimeMap: Map<string, Set<string>> = new Map(); // "date|time" -> Set<playerId>

  // Mark existing assignments as occupied
  for (const existing of assignments) {
    const slot = extractSlotInfo(existing.scheduledDate);
    if (slot) {
      const slotKey = `${slot.date}|${slot.startTime}`;
      occupiedSlots[existing.court]?.add(slotKey);

      const existingMatch = matches.find((m) => m.id === existing.matchId);
      if (existingMatch) {
        const players = getPlayerIds(existingMatch);
        if (!playerTimeMap.has(slotKey)) playerTimeMap.set(slotKey, new Set());
        players.forEach((p) => playerTimeMap.get(slotKey)!.add(p));
      }
    }
  }

  // Separate matches by court assignment
  const court1Matches: MatchForScheduling[] = []; // MENS_SINGLES primary
  const court2Primary: MatchForScheduling[] = [];  // WOMENS_SINGLES, WOMENS_DOUBLES
  const court3Matches: MatchForScheduling[] = [];  // MIXED_DOUBLES, MENS_DOUBLES

  for (const match of playable) {
    // Skip matches that already have assignments
    if (assignments.some((a) => a.matchId === match.id)) continue;

    switch (match.category) {
      case "MENS_SINGLES":
        court1Matches.push(match);
        break;
      case "WOMENS_SINGLES":
      case "WOMENS_DOUBLES":
        court2Primary.push(match);
        break;
      case "MIXED_DOUBLES":
      case "MENS_DOUBLES":
        court3Matches.push(match);
        break;
    }
  }

  // Sort each group by round number, then by match ID for stability
  const sortByRound = (a: MatchForScheduling, b: MatchForScheduling) => {
    if (a.roundNumber !== b.roundNumber) return a.roundNumber - b.roundNumber;
    return a.id.localeCompare(b.id);
  };

  court1Matches.sort(sortByRound);
  court2Primary.sort(sortByRound);
  court3Matches.sort(sortByRound);

  // Assign Court 1: MENS_SINGLES (up to capacity)
  const court1Capacity = TOURNAMENT_DATES.length * SLOTS_PER_DAY; // 27
  const mensForCourt1 = court1Matches.slice(0, court1Capacity);
  const mensOverflow = court1Matches.slice(court1Capacity);

  // Assign Court 1 matches
  assignMatchesToCourt("Court 1", mensForCourt1, allSlots, occupiedSlots, playerTimeMap, assignments, conflicts, matches);

  // Assign Court 2 primary (WOMENS_SINGLES, WOMENS_DOUBLES) first
  assignMatchesToCourt("Court 2", court2Primary, allSlots, occupiedSlots, playerTimeMap, assignments, conflicts, matches);

  // Assign Court 2 overflow (MENS_SINGLES) after all women's matches
  assignMatchesToCourt("Court 2", mensOverflow, allSlots, occupiedSlots, playerTimeMap, assignments, conflicts, matches);

  // Assign Court 3 matches
  assignMatchesToCourt("Court 3", court3Matches, allSlots, occupiedSlots, playerTimeMap, assignments, conflicts, matches);

  return { assignments, conflicts };
}

/**
 * Build all possible slots in chronological order.
 */
function buildAllSlots(): Array<{ date: string; startTime: string; slotIndex: number }> {
  const slots: Array<{ date: string; startTime: string; slotIndex: number }> = [];
  for (const date of TOURNAMENT_DATES) {
    for (let i = 0; i < TIME_SLOTS.length; i++) {
      slots.push({ date, startTime: TIME_SLOTS[i], slotIndex: i });
    }
  }
  return slots;
}

/**
 * Assign a sorted list of matches to a court, respecting round ordering
 * and player overlap constraints.
 */
function assignMatchesToCourt(
  court: string,
  matchesSorted: MatchForScheduling[],
  allSlots: Array<{ date: string; startTime: string; slotIndex: number }>,
  occupiedSlots: Record<string, Set<string>>,
  playerTimeMap: Map<string, Set<string>>,
  assignments: ScheduleAssignment[],
  conflicts: ScheduleConflict[],
  allMatches: MatchForScheduling[]
): void {
  // Track the minimum global slot index for each round on this court
  // Later rounds must have strictly later slots
  const roundMaxSlot: Map<number, number> = new Map();

  // Determine existing round constraints from already-assigned matches on this court
  for (const a of assignments) {
    if (a.court !== court) continue;
    const match = allMatches.find((m) => m.id === a.matchId);
    if (!match) continue;
    const slot = extractSlotInfo(a.scheduledDate);
    if (!slot) continue;
    const globalIdx = getGlobalSlotIndex(slot.date, slot.startTime);
    const current = roundMaxSlot.get(match.roundNumber);
    if (current === undefined || globalIdx > current) {
      roundMaxSlot.set(match.roundNumber, globalIdx);
    }
  }

  for (const match of matchesSorted) {
    // Determine the minimum slot index this match can use
    // It must be strictly after any match from a previous round on this court
    let minGlobalSlot = 0;
    roundMaxSlot.forEach((maxSlot, round) => {
      if (round < match.roundNumber) {
        minGlobalSlot = Math.max(minGlobalSlot, maxSlot + 1);
      }
    });

    const players = getPlayerIds(match);
    let assigned = false;

    for (const slot of allSlots) {
      const slotKey = `${slot.date}|${slot.startTime}`;
      const globalIdx = getGlobalSlotIndex(slot.date, slot.startTime);

      // Must be at or after minimum slot for this round
      if (globalIdx < minGlobalSlot) continue;

      // Check if court slot is occupied
      if (occupiedSlots[court]?.has(slotKey)) continue;

      // Check player overlap
      let playerConflict = false;
      if (players.length > 0) {
        const timeOccupants = playerTimeMap.get(slotKey);
        if (timeOccupants) {
          for (const p of players) {
            if (timeOccupants.has(p)) {
              playerConflict = true;
              break;
            }
          }
        }
      }
      if (playerConflict) continue;

      // Assign this slot
      const scheduledDate = buildDateTime(slot.date, slot.startTime);
      assignments.push({
        matchId: match.id,
        court,
        scheduledDate,
      });

      // Mark slot as occupied
      occupiedSlots[court]!.add(slotKey);

      // Mark players as busy at this time
      if (!playerTimeMap.has(slotKey)) playerTimeMap.set(slotKey, new Set());
      players.forEach((p) => playerTimeMap.get(slotKey)!.add(p));

      // Update round tracking
      const currentMax = roundMaxSlot.get(match.roundNumber);
      if (currentMax === undefined || globalIdx > currentMax) {
        roundMaxSlot.set(match.roundNumber, globalIdx);
      }

      assigned = true;
      break;
    }

    if (!assigned) {
      conflicts.push({
        type: "court_occupied",
        matchId: match.id,
        details: `No available slot found on ${court} for match ${match.id} (round ${match.roundNumber}, category ${match.category})`,
      });
    }
  }
}

// ─── getAvailableSlots ──────────────────────────────────

/**
 * Get all unoccupied slots for a given court.
 */
export function getAvailableSlots(
  court: string,
  allAssignments: ScheduleAssignment[]
): CourtSlot[] {
  const occupied = new Set<string>();

  for (const assignment of allAssignments) {
    if (assignment.court !== court) continue;
    const slot = extractSlotInfo(assignment.scheduledDate);
    if (slot) {
      occupied.add(`${slot.date}|${slot.startTime}`);
    }
  }

  const available: CourtSlot[] = [];

  for (const date of TOURNAMENT_DATES) {
    for (let i = 0; i < TIME_SLOTS.length; i++) {
      const startTime = TIME_SLOTS[i];
      const slotKey = `${date}|${startTime}`;

      if (!occupied.has(slotKey)) {
        available.push({
          court,
          timeSlot: {
            date,
            startTime,
            slotIndex: i,
          },
        });
      }
    }
  }

  return available;
}
