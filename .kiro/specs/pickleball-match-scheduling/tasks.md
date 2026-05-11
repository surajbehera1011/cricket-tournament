# Implementation Plan: Pickleball Match Scheduling

## Overview

Implement an intelligent scheduling engine for 79 pickleball matches across 3 courts over 3 days (May 12–14, 2026). The implementation builds incrementally: scheduling engine → API route → score-triggered notifications → public schedule UI → email functions. All code is TypeScript, using the existing Next.js/Prisma stack with Jest + fast-check for testing.

## Tasks

- [ ] 1. Set up testing infrastructure for property-based tests
  - [ ] 1.1 Install fast-check as a dev dependency
    - Run `npm install --save-dev fast-check`
    - Verify it integrates with the existing Jest configuration
    - _Requirements: Design Testing Strategy_

- [x] 2. Implement the scheduling engine (`src/lib/scheduling.ts`)
  - [x] 2.1 Create core types and constants
    - Define `TimeSlot`, `CourtSlot`, `ScheduleAssignment`, `ScheduleConflict`, `MatchForScheduling` interfaces
    - Define `COURT_CATEGORIES` mapping (Court 1: MENS_SINGLES; Court 2: WOMENS_SINGLES, WOMENS_DOUBLES, MENS_SINGLES; Court 3: MIXED_DOUBLES, MENS_DOUBLES)
    - Define tournament dates array `["2026-05-12", "2026-05-13", "2026-05-14"]` and time slots (9 slots: 17:00–19:40, 20 min intervals)
    - Export helper `buildDateTime(date: string, startTime: string): Date`
    - _Requirements: 1.1, 1.2, 1.5_

  - [x] 2.2 Implement `validateAssignment` function
    - Check court-category constraint (match category must be in `COURT_CATEGORIES[court]`)
    - Check court slot uniqueness (no two matches on same court+time)
    - Check player time overlap (no player in two matches at same time slot)
    - Return array of `ScheduleConflict` objects (empty = valid)
    - _Requirements: 1.3, 1.5, 7.1, 7.2, 7.3_

  - [x] 2.3 Implement `generateSchedule` function
    - Accept array of `MatchForScheduling` (with id, category, roundNumber, entry1Id, entry2Id)
    - Filter to only playable matches (both entry1Id and entry2Id are real IDs, not null/WINNER_ prefixes)
    - Sort matches by round number, then by category priority
    - Assign Court 1 slots to MENS_SINGLES first (fill days chronologically, earlier slots first)
    - Assign Court 2 slots to WOMENS_SINGLES then WOMENS_DOUBLES
    - Assign Court 3 slots to MIXED_DOUBLES then MENS_DOUBLES
    - Overflow remaining MENS_SINGLES to Court 2 (only after all WS/WD are placed)
    - Enforce round ordering: later rounds get later time slots on same court
    - Validate no player overlap across courts at same time
    - Return `{ assignments, conflicts }`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 1.4_

  - [x] 2.4 Implement `getAvailableSlots` function
    - Given a court and existing assignments, return all unoccupied `CourtSlot` entries
    - Used by the auto-assign logic when a next-round match needs a slot
    - _Requirements: 4.6_

  - [ ]* 2.5 Write property tests for scheduling engine (Properties 1–8)
    - **Property 1: Court Slot Uniqueness** — no two assignments share same court+time
    - **Validates: Requirements 1.3, 2.3, 7.1**

  - [ ]* 2.6 Write property test for Property 2
    - **Property 2: No Player Time Overlap** — no player in two matches at same time slot
    - **Validates: Requirements 7.2, 7.3**

  - [ ]* 2.7 Write property test for Property 3
    - **Property 3: Court-Category Constraint Enforcement** — match category in allowed set for court
    - **Validates: Requirements 1.5**

  - [ ]* 2.8 Write property test for Property 4
    - **Property 4: Only Playable Matches Scheduled** — both entries must be real participants
    - **Validates: Requirements 1.4**

  - [ ]* 2.9 Write property test for Property 5
    - **Property 5: Schedule Completeness** — all playable matches get assigned when capacity allows
    - **Validates: Requirements 2.1**

  - [ ]* 2.10 Write property test for Property 6
    - **Property 6: Round Ordering** — later rounds have strictly later times on same court
    - **Validates: Requirements 2.2**

  - [ ]* 2.11 Write property test for Property 7
    - **Property 7: Men's Singles Overflow Priority** — MS on Court 2 only when Court 1 slots at/before that time are full
    - **Validates: Requirements 2.4**

  - [ ]* 2.12 Write property test for Property 8
    - **Property 8: Chronological Fill Order** — no gaps before filled slots on same court
    - **Validates: Requirements 2.5**

- [ ] 3. Checkpoint - Ensure scheduling engine tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement the auto-schedule API route
  - [x] 4.1 Create `src/app/api/admin/fixtures/auto-schedule/route.ts`
    - POST handler with ADMIN role check (reuse `getServerSession` + `authOptions` pattern)
    - Accept `{ confirm?: boolean, sendNotifications?: boolean }` in request body
    - Fetch all pickleball matches from the fixture (include fixture for frozen check)
    - Verify at least one category is frozen before allowing scheduling
    - Call `generateSchedule` from scheduling engine
    - If `confirm` is false/absent: return preview `{ assignments, summary: { totalMatches, byDay, byCourt } }`
    - If `confirm` is true: persist assignments via `prisma.match.update` for each assignment (set `scheduledDate` and `venue`)
    - If `sendNotifications` is true: call `sendScheduleConfirmationEmails` for matches where both entries are confirmed
    - Return `{ scheduled: number, notified: number }`
    - _Requirements: 2.1, 2.6, 2.7, 3.1, 6.1, 6.2, 6.3_

  - [ ]* 4.2 Write unit tests for auto-schedule API
    - Test ADMIN role enforcement (403 for non-admin)
    - Test preview mode returns assignments without DB writes
    - Test confirm mode persists to database
    - _Requirements: 2.6, 2.7_

- [ ] 5. Implement schedule conflict validation in existing schedule route
  - [ ] 5.1 Enhance `src/app/api/admin/fixtures/schedule/route.ts` with conflict checking
    - Before persisting a manual schedule assignment, validate against existing assignments
    - Query all scheduled matches for the same fixture
    - Call `validateAssignment` from scheduling engine
    - If conflicts found, return 409 with conflict details
    - If valid, persist and proceed as before
    - _Requirements: 1.3, 7.1, 7.2_

  - [ ]* 5.2 Write unit tests for conflict validation in schedule route
    - Test court double-booking returns 409
    - Test player overlap returns 409
    - Test category mismatch returns 400
    - _Requirements: 7.1, 7.2, 1.5_

- [x] 6. Implement next-match notification logic in score route
  - [x] 6.1 Create `checkAndNotifyNextMatch` function in score route
    - After `advanceWinner` completes, find the next match the winner was advanced into
    - Check if both `entry1Id` and `entry2Id` are now real player IDs (not null, not WINNER_ prefix)
    - If both confirmed AND match has `scheduledDate` and `venue`: call `sendNextMatchNotification`
    - If both confirmed but match lacks schedule: call `getAvailableSlots` for appropriate court, assign next available slot, persist, then send notification
    - Mark `notificationSent = true` after successful send
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6_

  - [ ]* 6.2 Write property test for Property 9
    - **Property 9: Notification Trigger Condition** — notification sent iff both entries are real players AND match has scheduledDate and venue
    - **Validates: Requirements 4.2, 4.3, 4.4**

  - [ ]* 6.3 Write property test for Property 11
    - **Property 11: Auto-Assign on Both Ready** — if match lacks schedule when both confirmed, system auto-assigns next available slot
    - **Validates: Requirements 4.6**

- [ ] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement email notification functions
  - [x] 8.1 Add `sendScheduleConfirmationEmails` to `src/lib/email.ts`
    - Accept array of match IDs
    - For each match: fetch match with entries, resolve player emails via `PickleballRegistration`
    - For players with multiple matches, include only the earliest upcoming match
    - Send email with match date, start time, court number, category, and opponent name(s)
    - Use existing `wrap`, `detailsTable`, `btn` helpers for consistent email styling
    - Mark `notificationSent = true` after successful send
    - Return `{ sent: number, failed: number }`
    - Wrap each send in try/catch for failure isolation
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 8.2 Add `sendNextMatchNotification` to `src/lib/email.ts`
    - Accept a match object (with resolved schedule and entries)
    - Resolve all player emails from both entries (up to 4 for doubles)
    - Send email with next match time, court, category, and opponent details
    - Use pickleball sport badge styling
    - _Requirements: 4.3, 4.5_

  - [ ]* 8.3 Write property test for Property 10
    - **Property 10: Doubles Recipient Completeness** — doubles notification includes all players from both entries (up to 4)
    - **Validates: Requirements 4.5**

  - [ ]* 8.4 Write property test for Property 12
    - **Property 12: Email Content Completeness** — notification includes date, time, court, category, opponent
    - **Validates: Requirements 3.2**

  - [ ]* 8.5 Write property test for Property 13
    - **Property 13: Initial Notification References Earliest Match** — multi-match players get only earliest match in initial notification
    - **Validates: Requirements 3.4**

- [x] 9. Update public schedule page with day/court/time grid view
  - [x] 9.1 Add pickleball schedule grid component to `src/app/schedule/page.tsx`
    - Add a "Schedule Grid" view option alongside existing bracket view (when schedule data exists)
    - Create three-day tab navigation (May 12, 13, 14)
    - Within each day, show 3 court columns
    - Show 9 time slot rows (5:00 PM through 7:40 PM) per court
    - Each cell shows: category badge, player names, match status
    - Completed matches show winner and score
    - Live matches show pulsing indicator
    - Accessible without authentication (existing page is already public)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 10. Add auto-schedule button to admin fixtures page
  - [x] 10.1 Add auto-schedule UI controls to `src/app/admin/fixtures/page.tsx`
    - Add "Auto-Schedule" button in the pickleball controls section (visible when at least one category is frozen)
    - On click: call POST `/api/admin/fixtures/auto-schedule` with `confirm: false` for preview
    - Show preview modal/section with summary (total matches, by day, by court)
    - Add "Confirm & Schedule" button that calls with `confirm: true, sendNotifications: true`
    - Show success toast with count of scheduled and notified matches
    - Refresh fixture data after confirmation
    - _Requirements: 2.6, 2.7, 3.1_

- [ ] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The scheduling engine is a pure function (no DB dependencies) making it ideal for property-based testing
- `fast-check` needs to be installed as it's not currently in the project dependencies
- All email functions reuse the existing Azure Graph API infrastructure in `src/lib/email.ts`
- No database migrations needed — uses existing `scheduledDate` and `venue` fields on Match model
