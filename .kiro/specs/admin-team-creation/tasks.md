# Implementation Plan: Admin Team Creation from Individual Player Pool

## Overview

Implement an admin feature to create cricket teams by selecting players from the individual pool. This involves a GET endpoint for fetching pool players + settings, a POST endpoint for atomic team creation, and a new UI section in the admin panel. All code follows existing patterns (getServerSession, Zod, Prisma transactions, createAuditLog, SSE broadcast).

## Tasks

- [x] 1. Create GET endpoint for pool players and settings
  - [x] 1.1 Create `src/app/api/admin/teams/pool-players/route.ts`
    - Add `export const dynamic = "force-dynamic"`
    - Authenticate with `getServerSession(authOptions)`, return 403 if not ADMIN
    - Query `prisma.player.findMany` where `poolStatus = LOOKING_FOR_TEAM`, select `id`, `fullName`, `gender`, `preferredRole`, `experienceLevel`
    - Query `prisma.tournamentSettings.findUnique` for `mandatoryPlayerCount`, `mandatoryFemaleCount`, `maxTeamSize`
    - Return `{ players, settings }` using `jsonResponse`
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Create POST endpoint for team creation
  - [x] 2.1 Create `src/app/api/admin/teams/route.ts`
    - Add `export const dynamic = "force-dynamic"`
    - Authenticate with `getServerSession(authOptions)`, return 403 if not ADMIN
    - Define Zod schema: `teamName` (string, min 2, max 100), `playerIds` (array of uuid, min 1)
    - Parse and validate request body, return 400 on failure
    - _Requirements: 2.1_

  - [x] 2.2 Implement server-side validation logic
    - Fetch `TournamentSettings` (use `getSettings()` from `src/lib/business/registration.ts`)
    - Fetch all players by IDs, verify each has `poolStatus = LOOKING_FOR_TEAM`
    - Validate: `playerIds.length >= mandatoryPlayerCount` (return 400 with specific count)
    - Validate: female count `>= mandatoryFemaleCount` (return 400 with specific count)
    - Validate: `playerIds.length <= maxTeamSize` (return 400 with max)
    - Check team name uniqueness via `prisma.team.findUnique({ where: { name } })`, return 409 if exists
    - _Requirements: 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 2.3 Implement atomic transaction for team creation
    - Use `prisma.$transaction()` with `maxWait: 10000, timeout: 30000` (matching existing pattern)
    - Create `Team` record: `name`, `status: COMPLETE`, `teamSize` from settings, `captainName: ""`
    - Create `TeamMembership` for each player: `membershipType: DRAFT_PICK`, `positionSlot: "Player {i+1}"`
    - Update each player's `poolStatus` from `LOOKING_FOR_TEAM` to `ASSIGNED`
    - After transaction: call `createAuditLog` with `action: CREATE_TEAM`, `entityType: "Team"`, player IDs in `after`
    - Broadcast SSE event: `sseManager.broadcast({ type: "team-updated", data: { teamId, teamName } })`
    - Return 201 with `{ team: { id, name, status, memberCount } }`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 8.1, 8.2_

- [x] 3. Checkpoint
  - Ensure the API routes compile without errors, ask the user if questions arise.

- [ ] 4. Build admin UI for team creation
  - [x] 4.1 Add "Create Team" tab/section to `src/app/admin/page.tsx`
    - Add a new tab button alongside existing tabs (Pending, Captains, Pickleball)
    - Add state variables: `poolPlayers`, `selectedPoolPlayers` (Set), `teamNameInput`, `createTeamLoading`
    - Fetch pool players and settings from `GET /api/admin/teams/pool-players` when tab is active
    - _Requirements: 1.1, 1.2_

  - [x] 4.2 Implement player selection UI
    - Display pool players in a list with checkboxes showing: fullName, gender badge, preferredRole, experienceLevel
    - Allow multi-select with a running count of selected players and female count
    - Display constraints from settings (min players, min female, max size)
    - Disable further selection when maxTeamSize is reached
    - Add search/filter input for player names
    - _Requirements: 3.1, 3.4_

  - [x] 4.3 Implement team name input and submission
    - Add team name text input with min 2 / max 100 character validation
    - Add submit button, disabled until: name is valid AND player count >= mandatoryPlayerCount AND female count >= mandatoryFemaleCount
    - On submit: POST to `/api/admin/teams` with `{ teamName, playerIds }`
    - Show success toast with team name, clear form, refresh pool players list
    - Show error toast with server error message on failure
    - _Requirements: 2.1, 2.2, 2.3, 5.1_

- [x] 5. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Integration and wiring
  - [x] 6.1 Verify team appears in captain creation dropdown
    - Confirm the existing `GET /api/admin/captains` endpoint returns admin-created teams in `teamsWithoutLogin` (teams with `captainUserId: null` and status not `PENDING_APPROVAL`)
    - No code changes expected — existing query already covers this
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 6.2 Verify team appears on public dashboard
    - Confirm the existing `GET /api/teams` endpoint includes teams with status `COMPLETE`
    - No code changes expected — existing query already covers this
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ]* 6.3 Write unit tests for team creation API validation
    - Test: rejects team name shorter than 2 chars
    - Test: rejects team name longer than 100 chars
    - Test: rejects duplicate team name (409)
    - Test: rejects when player count < mandatoryPlayerCount
    - Test: rejects when female count < mandatoryFemaleCount
    - Test: rejects when player count > maxTeamSize
    - Test: rejects player not in pool (poolStatus !== LOOKING_FOR_TEAM)
    - Test: successful creation returns 201 with correct team data
    - _Requirements: 2.1, 2.2, 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 7. Final checkpoint
  - Ensure all code compiles, API routes work correctly, and the admin UI renders without errors. Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- No schema migrations needed — uses existing models and enum values
- Property-based tests skipped per user request for faster delivery
- The SSE event type `"team-updated"` is already defined in the SSE manager's type union
- The `CREATE_TEAM` audit action already exists in the `AuditAction` enum
- Resource-efficient: single transaction, no N+1 queries, minimal client-side fetches
