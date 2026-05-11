# Requirements Document

## Introduction

This feature enables administrators to schedule pickleball matches across 3 courts over 3 days (May 12–14, 2026), assigning specific court and time slot combinations to each playable match. Each day runs from 5:00 PM to 8:00 PM (9 × 20-minute slots per court, 81 total slots). The system schedules ALL real matches upfront (79 matches), displays the schedule publicly, sends email notifications to players when their match opponents are confirmed, and automatically notifies both players when both sides of a next-round match are determined.

## Glossary

- **Scheduler**: The administrative subsystem responsible for assigning court and time slot combinations to pickleball matches
- **Court**: One of three physical pickleball courts, each assigned to specific categories (Court 1: Men's Singles; Court 2: Women's Singles + Women's Doubles, with Men's Singles overflow; Court 3: Mixed Doubles + Men's Doubles)
- **Time_Slot**: A 20-minute block within the daily play window (5:00 PM–8:00 PM), identified by date and start time
- **Playable_Match**: A match where both participants (entry1Id and entry2Id) are actual registered players/teams (not byes or TBD placeholders)
- **Schedule_Confirmation**: The admin action that finalizes the schedule and triggers initial email notifications to all players
- **Next_Match_Notification**: An automated email sent to both players of a next-round match ONLY when both participants are confirmed (both feeder matches completed), containing the match time, court, and opponent details
- **Schedule_Display**: The public-facing page showing all scheduled matches organized by day, court, and time
- **Admin**: A user with the ADMIN role who manages fixtures and schedules

## Requirements

### Requirement 1: Court and Time Slot Assignment

**User Story:** As an admin, I want to assign a specific court and time slot to each playable pickleball match, so that players know exactly where and when to play.

#### Acceptance Criteria

1. WHEN the admin selects a playable match, THE Scheduler SHALL allow assignment of a court (Court 1, Court 2, or Court 3) and a 20-minute time slot within the tournament window (May 12–14, 2026, 5:00 PM–8:00 PM).
2. THE Scheduler SHALL enforce that each court has a maximum of 9 time slots per day (one every 20 minutes from 5:00 PM to 8:00 PM).
3. IF the admin attempts to assign a match to a court and time slot that is already occupied, THEN THE Scheduler SHALL reject the assignment and display an error message indicating the conflict.
4. THE Scheduler SHALL only allow scheduling of matches where both entries will eventually play (not bye matches with only one participant).
5. THE Scheduler SHALL enforce court-category constraints: Court 1 accepts only MENS_SINGLES matches, Court 2 accepts WOMENS_SINGLES, WOMENS_DOUBLES, and MENS_SINGLES overflow matches, and Court 3 accepts only MIXED_DOUBLES and MENS_DOUBLES matches.

### Requirement 2: Auto-Schedule Generation for All Matches

**User Story:** As an admin, I want the system to automatically generate a schedule for ALL real matches (excluding byes) across all rounds upfront, so that the entire tournament timeline is fixed from the start.

#### Acceptance Criteria

1. WHEN the admin triggers auto-scheduling, THE Scheduler SHALL assign court and time slot combinations to ALL matches that will be played (excluding bye matches with only one participant).
2. THE Scheduler SHALL schedule matches in round order: all R1 matches first, then R2, then R3, etc., ensuring later rounds are scheduled after earlier rounds on the same court.
3. THE Scheduler SHALL not assign more than one match to the same court and time slot combination.
4. THE Scheduler SHALL fill Court 1 with MENS_SINGLES matches first, then overflow remaining MENS_SINGLES matches to Court 2 after all WOMENS_SINGLES and WOMENS_DOUBLES matches are scheduled.
5. THE Scheduler SHALL distribute matches across available days, filling earlier time slots first within each day.
6. WHEN auto-scheduling completes, THE Scheduler SHALL display the full proposed schedule for admin review before confirmation.
7. THE Scheduler SHALL allow the admin to manually adjust individual assignments after auto-scheduling.

### Requirement 3: Schedule Confirmation and Initial Notification

**User Story:** As an admin, I want to confirm the schedule and notify all players of their first match details, so that players know when and where to show up.

#### Acceptance Criteria

1. WHEN the admin confirms the schedule, THE Scheduler SHALL send an email to every player involved in a scheduled match containing their match time, court assignment, and opponent name(s).
2. THE Scheduler SHALL include the match date, start time, court number, category, and opponent details in each notification email.
3. THE Scheduler SHALL mark each notified match with notificationSent = true to prevent duplicate notifications.
4. IF a player has multiple scheduled matches, THEN THE Scheduler SHALL include only the earliest upcoming match details in the initial notification.
5. IF email delivery fails for a player, THEN THE Scheduler SHALL log the failure and continue sending to remaining players without interruption.

### Requirement 4: Next-Match Notification on Both Players Ready

**User Story:** As a player, I want to receive an email with my next match details only when both players for that match are confirmed, so that I get complete and actionable information.

#### Acceptance Criteria

1. WHEN a match result is recorded with a winner, THE Scheduler SHALL update the winner's next match in the bracket by replacing the WINNER_ placeholder with the actual winner's entry ID.
2. THE Scheduler SHALL only send a next-match notification email WHEN both entry1Id and entry2Id of the next match reference actual registered players (i.e., both feeder matches have been completed).
3. WHEN both players for a next-round match are confirmed AND the match has a scheduled date and court assignment, THE Scheduler SHALL send an email to BOTH players containing the match time, court, category, and opponent name(s).
4. THE Scheduler SHALL NOT send any notification if only one side of the next match is determined (opponent still TBD/WINNER_ placeholder).
5. THE Scheduler SHALL send the notification to all players on each entry (both partners in doubles categories).
6. IF the next match does not yet have a scheduled time or court when both players become ready, THEN THE Scheduler SHALL auto-assign the next available time slot on the appropriate court and then send the notification.

### Requirement 5: Public Schedule Display

**User Story:** As a player, I want to view the full tournament schedule on a public page, so that I can see all match times and plan accordingly.

#### Acceptance Criteria

1. THE Schedule_Display SHALL show all scheduled pickleball matches organized by day (May 12, 13, 14).
2. THE Schedule_Display SHALL group matches within each day by court (Court 1, Court 2, Court 3).
3. THE Schedule_Display SHALL show for each match: the time slot, category, and both participant names.
4. WHEN a match has been completed, THE Schedule_Display SHALL show the match result (winner and score).
5. THE Schedule_Display SHALL indicate matches that are currently live with a visual indicator.
6. THE Schedule_Display SHALL be accessible without authentication.

### Requirement 6: Schedule Persistence

**User Story:** As an admin, I want the schedule to be stored in the database, so that it persists across sessions and can be queried by other parts of the system.

#### Acceptance Criteria

1. THE Scheduler SHALL store the court assignment in the existing venue field of the Match model.
2. THE Scheduler SHALL store the time slot as a DateTime in the existing scheduledDate field of the Match model.
3. WHEN a match schedule is updated, THE Scheduler SHALL persist the change immediately to the database.
4. THE Scheduler SHALL allow the admin to clear a match's schedule assignment (set scheduledDate and venue to null).

### Requirement 7: Schedule Conflict Validation

**User Story:** As an admin, I want the system to prevent scheduling conflicts, so that no two matches are assigned to the same court at the same time and no player has overlapping matches.

#### Acceptance Criteria

1. IF the admin attempts to schedule two matches on the same court at the same time, THEN THE Scheduler SHALL reject the second assignment and display a conflict error.
2. IF the admin attempts to schedule a player in two matches that overlap in time (same 15-minute slot), THEN THE Scheduler SHALL reject the assignment and display a player conflict error.
3. WHEN auto-scheduling, THE Scheduler SHALL verify no player appears in two matches within the same time slot.
