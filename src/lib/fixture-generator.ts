export interface TeamSlot {
  id: string;
  name: string;
  color?: string;
  captainName?: string;
}

export interface PbEntrySlot {
  id: string;
  player1Name: string;
  player2Name?: string | null;
  category: string;
}

export interface GeneratedMatch {
  stage: "GROUP" | "KNOCKOUT";
  groupName?: string;
  roundNumber: number;
  matchNumber: number;
  category?: string;
  team1Id?: string | null;
  team2Id?: string | null;
  entry1Id?: string | null;
  entry2Id?: string | null;
  winnerId?: string | null;
  status?: "SCHEDULED" | "COMPLETED";
}

// ─── Cricket: Round-Robin Groups + Knockout ─────────────────

function distributeToGroups(
  teams: TeamSlot[],
  targetTotal: number,
  groupCount: number
): { groupName: string; members: (TeamSlot | null)[] }[] {
  const perGroup = Math.ceil(targetTotal / groupCount);
  const groups: { groupName: string; members: (TeamSlot | null)[] }[] = [];

  for (let g = 0; g < groupCount; g++) {
    const label = String.fromCharCode(65 + g);
    const members: (TeamSlot | null)[] = [];
    for (let s = 0; s < perGroup; s++) {
      const idx = g * perGroup + s;
      members.push(idx < teams.length ? teams[idx] : null);
    }
    groups.push({ groupName: label, members });
  }

  return groups;
}

function roundRobinForGroup(
  groupName: string,
  members: (TeamSlot | null)[],
  startMatchNum: number
): { matches: GeneratedMatch[]; nextMatchNum: number } {
  const matches: GeneratedMatch[] = [];
  let matchNum = startMatchNum;
  let round = 1;

  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      matches.push({
        stage: "GROUP",
        groupName,
        roundNumber: round,
        matchNumber: matchNum,
        team1Id: members[i]?.id ?? null,
        team2Id: members[j]?.id ?? null,
      });
      matchNum++;
      if (matchNum % Math.max(1, Math.floor(members.length / 2)) === 0) {
        round++;
      }
    }
  }

  return { matches, nextMatchNum: matchNum };
}

export function generateCricketFixtures(
  readyTeams: TeamSlot[],
  targetTeams: number,
  groupCount: number
): GeneratedMatch[] {
  const groups = distributeToGroups(readyTeams, targetTeams, groupCount);
  const allMatches: GeneratedMatch[] = [];
  let matchNum = 1;

  for (const group of groups) {
    const { matches, nextMatchNum } = roundRobinForGroup(
      group.groupName,
      group.members,
      matchNum
    );
    allMatches.push(...matches);
    matchNum = nextMatchNum;
  }

  if (groupCount === 2) {
    allMatches.push({
      stage: "KNOCKOUT",
      roundNumber: 1,
      matchNumber: matchNum++,
      team1Id: `WINNER_A`,
      team2Id: `WINNER_B`,
    });
  } else if (groupCount === 3) {
    allMatches.push({
      stage: "KNOCKOUT",
      roundNumber: 1,
      matchNumber: matchNum++,
      team1Id: `WINNER_A`,
      team2Id: `WINNER_B`,
    });
    allMatches.push({
      stage: "KNOCKOUT",
      roundNumber: 1,
      matchNumber: matchNum++,
      team1Id: `WINNER_C`,
      team2Id: `RUNNER_UP_BEST`,
    });
    allMatches.push({
      stage: "KNOCKOUT",
      roundNumber: 2,
      matchNumber: matchNum++,
      team1Id: `WINNER_SF1`,
      team2Id: `WINNER_SF2`,
    });
  } else if (groupCount === 4) {
    allMatches.push({
      stage: "KNOCKOUT",
      roundNumber: 1,
      matchNumber: matchNum++,
      team1Id: `WINNER_A`,
      team2Id: `WINNER_B`,
    });
    allMatches.push({
      stage: "KNOCKOUT",
      roundNumber: 1,
      matchNumber: matchNum++,
      team1Id: `WINNER_C`,
      team2Id: `WINNER_D`,
    });
    allMatches.push({
      stage: "KNOCKOUT",
      roundNumber: 2,
      matchNumber: matchNum++,
      team1Id: `WINNER_SF1`,
      team2Id: `WINNER_SF2`,
    });
  } else {
    const winners = groups.map(
      (g) => `WINNER_${g.groupName}`
    );
    const knockoutMatches = generateSingleElimination(
      winners,
      matchNum,
      true
    );
    allMatches.push(...knockoutMatches);
  }

  return allMatches;
}

// ─── Pickleball: Single-Elimination Knockout ────────────────

function nextPowerOf2(n: number): number {
  if (n <= 1) return 2;
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

// Standard tournament seed ordering -- spreads byes evenly across Round 1
function seedOrder(size: number): number[] {
  if (size === 1) return [0];
  const half = seedOrder(size / 2);
  const result: number[] = [];
  for (const h of half) {
    result.push(h);
    result.push(size - 1 - h);
  }
  return result;
}

function generateSingleElimination(
  entryIds: (string | null)[],
  startMatchNum: number,
  isCricketKnockout?: boolean
): GeneratedMatch[] {
  const n = entryIds.length;
  if (n < 2) return [];

  const bracketSize = nextPowerOf2(n);

  const slots: (string | null)[] = new Array(bracketSize).fill(null);
  const order = seedOrder(bracketSize);
  for (let i = 0; i < n; i++) {
    slots[order[i]] = entryIds[i];
  }

  const matches: GeneratedMatch[] = [];
  let matchNum = startMatchNum;
  let currentRound = slots;
  let roundNum = 1;

  while (currentRound.length > 1) {
    const nextRound: (string | null)[] = [];

    for (let i = 0; i < currentRound.length; i += 2) {
      const a = currentRound[i];
      const b = currentRound[i + 1];

      if (a === null && b === null) {
        nextRound.push(null);
        continue;
      }

      if ((a !== null && b === null) || (a === null && b !== null)) {
        const present = a ?? b;
        const match: GeneratedMatch = isCricketKnockout
          ? {
              stage: "KNOCKOUT",
              roundNumber: roundNum,
              matchNumber: matchNum,
              team1Id: present,
              team2Id: null,
              winnerId: present,
              status: "COMPLETED",
            }
          : {
              stage: "KNOCKOUT",
              roundNumber: roundNum,
              matchNumber: matchNum,
              entry1Id: present,
              entry2Id: null,
              winnerId: present,
              status: "COMPLETED",
            };
        matches.push(match);
        nextRound.push(present);
        matchNum++;
        continue;
      }

      const match: GeneratedMatch = isCricketKnockout
        ? {
            stage: "KNOCKOUT",
            roundNumber: roundNum,
            matchNumber: matchNum,
            team1Id: a,
            team2Id: b,
          }
        : {
            stage: "KNOCKOUT",
            roundNumber: roundNum,
            matchNumber: matchNum,
            entry1Id: a,
            entry2Id: b,
          };

      matches.push(match);
      nextRound.push(`WINNER_M${matchNum}`);
      matchNum++;
    }

    roundNum++;
    currentRound = nextRound;
  }

  return matches;
}

export function generatePickleballFixtures(
  entries: PbEntrySlot[],
  category: string,
  startMatchNum: number
): { matches: GeneratedMatch[]; nextMatchNum: number } {
  if (entries.length < 2) {
    const bracketSize = 4;
    const matches: GeneratedMatch[] = [];
    let matchNum = startMatchNum;

    const slots: (string | null)[] = [];
    for (let i = 0; i < bracketSize; i++) {
      slots.push(i < entries.length ? entries[i].id : null);
    }

    matches.push({
      stage: "KNOCKOUT",
      roundNumber: 1,
      matchNumber: matchNum++,
      category,
      entry1Id: slots[0] ?? null,
      entry2Id: slots[1] ?? null,
    });
    matches.push({
      stage: "KNOCKOUT",
      roundNumber: 1,
      matchNumber: matchNum++,
      category,
      entry1Id: slots[2] ?? null,
      entry2Id: slots[3] ?? null,
    });
    matches.push({
      stage: "KNOCKOUT",
      roundNumber: 2,
      matchNumber: matchNum++,
      category,
      entry1Id: null,
      entry2Id: null,
    });

    return { matches, nextMatchNum: matchNum };
  }

  const ids = entries.map((e) => e.id);
  const raw = generateSingleElimination(ids, startMatchNum);
  const matches = raw.map((m) => ({ ...m, category }));
  const last = matches[matches.length - 1];
  return {
    matches,
    nextMatchNum: last ? last.matchNumber + 1 : startMatchNum,
  };
}

export const PB_CATEGORIES = [
  "MENS_SINGLES",
  "WOMENS_SINGLES",
  "MENS_DOUBLES",
  "WOMENS_DOUBLES",
  "MIXED_DOUBLES",
] as const;

export function generateAllPickleballFixtures(
  entriesByCategory: Record<string, PbEntrySlot[]>
): GeneratedMatch[] {
  const allMatches: GeneratedMatch[] = [];

  for (const cat of PB_CATEGORIES) {
    const entries = entriesByCategory[cat] || [];
    const { matches } = generatePickleballFixtures(
      entries,
      cat,
      1
    );
    allMatches.push(...matches);
  }

  return allMatches;
}
