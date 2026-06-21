# Design Document: Cricket Single Elimination Fixtures

## Overview

This feature replaces the cricket fixture format from group-stage round-robin + knockout to a pure single elimination (knockout) bracket. The change is minimal in scope: the existing `generateSingleElimination` function (already used for pickleball) is reused for cricket, the generate route is modified to call it with team IDs instead of group winner placeholders, and the schedule page removes group-stage rendering for cricket.

All existing admin controls (freeze, score recording with `WINNER_M{matchNumber}` advancement, match scheduling, team swapping, print) continue to work unchanged because the underlying Match model and knockout stage logic remain the same.

### Key Design Decisions

1. **Reuse `generateSingleElimination`** — The pickleball bracket generator already handles byes, seed ordering, and `WINNER_M{n}` placeholders. Cricket just calls it with `isCricketKnockout=true` to use `team1Id`/`team2Id` fields.

2. **ALL teams participate** — The generate route queries all teams regardless of status (not just READY), giving the admin full control over who appears in the bracket.

3. **Random shuffle per generation** — Teams are shuffled before being passed to the bracket generator, ensuring a fair random draw each time.

4. **No schema changes** — The existing Match model with `stage=KNOCKOUT`, `team1Id`, `team2Id`, `roundNumber`, `matchNumber`, `winnerId`, and `WINNER_M{n}` pattern is sufficient.

5. **Minimal UI change** — The schedule page simply stops rendering `GroupStage` for cricket and only shows `KnockoutStage` with the fixture data.

## Architecture

```mermaid
flowchart TD
    Admin[Admin Page] -->|POST /api/admin/fixtures/generate| GenRoute[Generate Route]
    GenRoute -->|sport=CRICKET| GenFn[generateCricketSingleElimination]
    GenFn -->|calls| SE[generateSingleElimination]
    SE -->|returns GeneratedMatch[]| GenRoute
    GenRoute -->|upsert fixture + matches| DB[(PostgreSQL)]

    Admin -->|POST /api/admin/fixtures/score| ScoreRoute[Score Route]
    ScoreRoute -->|advanceWinner with WINNER_M pattern| DB

    Admin -->|POST /api/admin/fixtures/swap| SwapRoute[Swap Route]
    SwapRoute -->|recalcByeAdvancements| DB

    Schedule[Schedule Page] -->|GET /api/fixtures?sport=CRICKET| DB
    Schedule -->|renders KnockoutStage only| Browser[Browser]
```

The architecture is a standard Next.js API route pattern. No new services or external dependencies are introduced.

## Components and Interfaces

### Modified: `src/lib/fixture-generator.ts`

**New exported function:**

```typescript
export function generateCricketSingleElimination(
  teams: TeamSlot[]
): GeneratedMatch[]
```

- Validates `teams.length >= 2` (throws if fewer)
- Shuffles the team list randomly (Fisher-Yates)
- Extracts team IDs as `(string | null)[]`
- Calls `generateSingleElimination(teamIds, 1, true)`
- Returns the generated matches

**Existing function retained but unused for new flow:**
- `generateCricketFixtures` — kept for backward compatibility but no longer called from the generate route for cricket.

### Modified: `src/app/api/admin/fixtures/generate/route.ts`

Changes to the CRICKET branch:
- Query `prisma.team.findMany()` without any status filter (all teams)
- Call `generateCricketSingleElimination(slots)` instead of `generateCricketFixtures`
- Remove `groupCount` from the cricket generation logic (irrelevant for single elimination)

### Modified: `src/app/schedule/page.tsx`

Changes to the cricket section:
- Remove `GroupStage` rendering when `sport === "cricket"`
- Remove `genCricketGroups`, `genGroupMatches`, `genCricketKnockout` client-side fallback logic for cricket
- Show only `KnockoutStage` with `cricketMatches` sourced from the frozen fixture data
- Update the `PrintButton` subtitle from "Group Stage & Knockout Fixtures" to "Single Elimination Bracket"

### Unchanged (work as-is):

| Component | Reason |
|-----------|--------|
| Score route (`/api/admin/fixtures/score`) | Already handles cricket knockout with `WINNER_M{n}` pattern |
| Freeze route (`/api/admin/fixtures/freeze`) | Already toggles FROZEN/DRAFT for cricket fixture |
| Swap route (`/api/admin/fixtures/swap`) | Already handles cricket with `team1Id`/`team2Id` and `recalcByeAdvancements` |
| Schedule route (`/api/admin/fixtures/schedule`) | Generic — just stores `scheduledDate` and `venue` |
| Bulk schedule route | Generic |
| Admin fixtures page (controls section) | Generate, freeze, score, schedule buttons all work generically |
| Print functionality | Already works for bracket rendering via `PrintButton` + `KnockoutStage` |

## Data Models

No schema changes are required. The existing models are fully sufficient:

### Fixture (unchanged)

| Field | Type | Usage |
|-------|------|-------|
| id | UUID | Primary key |
| sport | CRICKET | Identifies this as the cricket fixture |
| status | DRAFT / FROZEN | Controls whether generation or scoring is allowed |
| groupCount | Int | Retained in schema but ignored for single elimination |
| frozenAt | DateTime? | Set when frozen |
| frozenCategories | String[] | Not used for cricket |

### Match (unchanged)

| Field | Type | Usage in Single Elimination |
|-------|------|----------------------------|
| stage | KNOCKOUT | All matches are KNOCKOUT (no GROUP) |
| groupName | null | Not used |
| roundNumber | Int | 1 = Round 1 (with byes), incrementing to final |
| matchNumber | Int | Sequential from 1, used in WINNER_M{n} references |
| team1Id | String? | Team UUID, null for empty bye slot, or WINNER_M{n} placeholder |
| team2Id | String? | Same as team1Id |
| winnerId | String? | Set when scored, or auto-set for bye matches |
| status | SCHEDULED / COMPLETED | Bye matches auto-set to COMPLETED |
| scheduledDate | DateTime? | Admin-assigned match time |
| venue | String? | Admin-assigned venue |

### Generated Match Flow Example (8 teams)

```
Round 1 (4 matches): M1(T1 vs T8), M2(T4 vs T5), M3(T2 vs T7), M4(T3 vs T6)
Round 2 (2 matches): M5(WINNER_M1 vs WINNER_M2), M6(WINNER_M3 vs WINNER_M4)
Round 3 (1 match):   M7(WINNER_M5 vs WINNER_M6) — Final
```

With byes (e.g., 6 teams → bracket size 8):
```
Round 1: M1(T1 vs BYE→auto-advance T1), M2(T4 vs T5), M3(T2 vs BYE→auto-advance T2), M4(T3 vs T6)
Round 2: M5(T1 vs WINNER_M2), M6(T2 vs WINNER_M4)
Round 3: M7(WINNER_M5 vs WINNER_M6) — Final
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Bracket structural correctness

*For any* list of N teams where N ≥ 2, the generated single elimination bracket SHALL:
- Contain exactly (bracketSize - 1) total matches, where bracketSize is the smallest power of 2 ≥ N
- Include every team exactly once across all Round 1 match slots (team1Id or team2Id)
- Have all matches with stage = "KNOCKOUT"
- Have sequential matchNumber values from 1 to (bracketSize - 1)
- Have every match in round > 1 reference exactly two feeder matches via WINNER_M{n} placeholders or direct team IDs from bye advancements

**Validates: Requirements 1.1, 1.2, 1.4, 1.5, 1.6, 2.1**

### Property 2: Bye handling correctness

*For any* list of N teams where N is not a power of 2, the generated bracket SHALL:
- Contain exactly (bracketSize - N) bye matches in Round 1 where one team slot is null
- Set winnerId to the present team's ID for every bye match
- Set status to "COMPLETED" for every bye match
- Advance the bye winner into the correct next-round match slot
- Distribute byes across both halves of the bracket (difference ≤ 1 between halves)

**Validates: Requirements 1.3, 2.3, 5.5**

### Property 3: Winner advancement correctness

*For any* completed match in a bracket with matchNumber M, when winnerId is set, the system SHALL find the unique match in the next round whose team1Id or team2Id equals "WINNER_M{M}" and replace that placeholder with the winnerId.

**Validates: Requirements 5.3**

### Property 4: Swap preserves bye invariants

*For any* bracket and any swap of two team positions, after recalculating bye advancements:
- Every bye match (one team present, one null) SHALL have winnerId equal to the present team
- Every bye match SHALL have status = "COMPLETED"
- The next-round match receiving a bye winner SHALL have the correct team ID in the appropriate slot

**Validates: Requirements 7.2**

## Error Handling

| Scenario | Response | HTTP Status |
|----------|----------|-------------|
| Fewer than 2 teams exist | `{ error: "At least 2 teams required to generate bracket" }` | 400 |
| Fixture is FROZEN and generation attempted | `{ error: "Fixture is frozen. Unfreeze first to regenerate." }` | 400 |
| Score recorded on non-FROZEN fixture | `{ error: "Cricket fixture must be frozen to record scores" }` | 400 |
| winnerId doesn't match either participant | `{ error: "winnerId must be one of the match participants" }` | 400 |
| Scheduling conflict (same venue + time) | `{ error: "Venue conflict: [venue] at [time] is already occupied" }` | 409 |
| Swap attempted on FROZEN fixture with completed match | `{ error: "Cannot swap teams in completed matches" }` | 400 |
| Non-admin access | `{ error: "Forbidden" }` | 403 |

All errors follow the existing pattern of returning a JSON object with an `error` field. No new error types or patterns are introduced.

## Testing Strategy

### Unit Tests (example-based)

- **Bracket generation edge cases**: 2 teams (no byes), power-of-2 teams (no byes), odd numbers
- **Error rejection**: < 2 teams throws, frozen fixture rejects generation
- **Freeze/unfreeze**: State transitions work correctly
- **Score rejection**: Invalid winnerId, non-frozen fixture

### Property-Based Tests

**Library**: `fast-check` (already available in the Node.js ecosystem, pairs well with Jest)

**Configuration**: Minimum 100 iterations per property test.

Each property test references its design document property:

- **Feature: cricket-single-elimination, Property 1: Bracket structural correctness** — Generate random team lists (size 2-64), verify all structural invariants hold.
- **Feature: cricket-single-elimination, Property 2: Bye handling correctness** — Generate team lists of non-power-of-2 sizes, verify bye placement, auto-advancement, and distribution.
- **Feature: cricket-single-elimination, Property 3: Winner advancement correctness** — Generate brackets, pick a random match, set a winner, verify the next-round placeholder is correctly replaced.
- **Feature: cricket-single-elimination, Property 4: Swap preserves bye invariants** — Generate brackets, perform random swaps, verify bye invariants still hold after recalculation.

### Integration Tests

- **Generate API**: POST to generate route, verify fixture and matches created in DB
- **Regenerate**: Generate twice in DRAFT, verify second generation replaces first
- **Score flow**: Freeze → score match → verify winner advanced in DB
- **Schedule**: Assign date/venue, verify conflict detection
- **Full bracket completion**: Score all matches through to final, verify champion

### Component Tests

- Schedule page renders bracket without group stage for cricket
- KnockoutStage displays all rounds, team names, scores
- Print button generates printable view

