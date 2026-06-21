# Requirements Document

## Introduction

This feature replaces the existing cricket fixture format (group stage round-robin + knockout for group winners) with a pure single elimination (knockout) bracket. All teams with status READY participate directly in a randomized single elimination bracket. When the number of teams is not a power of 2, some teams receive byes in Round 1. The system retains all existing admin controls (freeze, score recording with winner advancement, match scheduling, team swapping) and the public bracket display, but removes the group stage entirely.

## Glossary

- **Bracket_Generator**: The subsystem responsible for creating and populating the single elimination bracket structure from registered teams
- **Fixture**: The persisted fixture record for cricket (sport=CRICKET), with status DRAFT or FROZEN
- **Match**: An individual contest between two teams in the bracket, stored with team1Id, team2Id, roundNumber, matchNumber, scheduledDate, venue, score fields, and winnerId
- **Ready_Team**: A team registered in the system (any status), eligible to participate in the bracket
- **Bye**: A Round 1 match where only one team is present; that team automatically advances to the next round without playing
- **Bracket_Size**: The smallest power of 2 that is greater than or equal to the number of Ready_Teams
- **Seed_Position**: The position assigned to a team in the bracket after randomized shuffling
- **Winner_Placeholder**: A string of the form "WINNER_M{matchNumber}" placed in the next round match to indicate which feeder match provides the advancing team
- **Admin**: A user with the ADMIN role who manages fixtures
- **Schedule_Display**: The public-facing page showing the cricket bracket with match times, venues, and scores

## Requirements

### Requirement 1: Single Elimination Bracket Generation

**User Story:** As an admin, I want to generate a single elimination bracket from all Ready teams, so that every eligible team competes in a knockout format.

#### Acceptance Criteria

1. WHEN the admin triggers cricket fixture generation, THE Bracket_Generator SHALL query all teams (regardless of status) and create a single elimination bracket containing those teams.
2. THE Bracket_Generator SHALL calculate the Bracket_Size as the smallest power of 2 greater than or equal to the number of teams.
3. WHEN the number of teams is less than the Bracket_Size, THE Bracket_Generator SHALL assign byes to fill the remaining slots, placing bye matches in Round 1 so that teams with byes advance automatically.
4. THE Bracket_Generator SHALL create all matches for all rounds from Round 1 through the final, with correct Winner_Placeholder references linking each match to its feeder matches.
5. THE Bracket_Generator SHALL set all generated matches to stage = KNOCKOUT (no GROUP stage matches).
6. THE Bracket_Generator SHALL assign sequential matchNumber values starting from 1 across all rounds.
7. IF fewer than 2 teams exist, THEN THE Bracket_Generator SHALL reject the generation request and return an error indicating insufficient teams.

### Requirement 2: Randomized Seeding

**User Story:** As an admin, I want team positions in the bracket to be randomized each time the bracket is generated, so that the draw is fair and unpredictable.

#### Acceptance Criteria

1. WHEN fixture generation is triggered, THE Bracket_Generator SHALL randomly shuffle the list of Ready_Teams before assigning them to Seed_Positions in the bracket.
2. WHEN the fixture is regenerated, THE Bracket_Generator SHALL produce a new random shuffle, resulting in different bracket positions compared to previous generations.
3. THE Bracket_Generator SHALL distribute byes evenly across the bracket using standard tournament seed ordering after the random shuffle is applied.

### Requirement 3: Fixture Regeneration

**User Story:** As an admin, I want to regenerate the cricket bracket at any time while it is in DRAFT status, so that I can get a fresh randomized draw.

#### Acceptance Criteria

1. WHEN the admin triggers regeneration and the fixture status is DRAFT, THE Bracket_Generator SHALL delete all existing cricket matches and generate a new bracket with a fresh random seed.
2. IF the fixture status is FROZEN, THEN THE Bracket_Generator SHALL reject the regeneration request and return an error indicating the fixture must be unfrozen first.
3. WHEN regeneration completes, THE Bracket_Generator SHALL return the new fixture data including all generated matches.

### Requirement 4: Fixture Freeze

**User Story:** As an admin, I want to freeze the cricket fixture to lock the bracket, so that scores can be recorded and the bracket cannot be accidentally changed.

#### Acceptance Criteria

1. WHEN the admin freezes the cricket fixture, THE Fixture SHALL update its status from DRAFT to FROZEN and record the frozenAt timestamp.
2. WHILE the fixture status is FROZEN, THE Bracket_Generator SHALL reject any generation or regeneration requests.
3. WHILE the fixture status is FROZEN, THE Admin SHALL be able to record match scores and advance winners.
4. WHEN the admin unfreezes the fixture, THE Fixture SHALL update its status from FROZEN to DRAFT.

### Requirement 5: Score Recording and Winner Advancement

**User Story:** As an admin, I want to record match results and have the winner automatically advance to the next round, so that the bracket progresses without manual intervention.

#### Acceptance Criteria

1. WHEN the admin records a score for a cricket match, THE system SHALL update the match with the provided score1, score2, and winnerId, and set the match status to COMPLETED.
2. IF the fixture status is not FROZEN, THEN THE system SHALL reject the score recording and return an error.
3. WHEN a match result is recorded with a winnerId, THE system SHALL find the next round match containing the Winner_Placeholder for the completed match and replace the placeholder with the winnerId.
4. IF the winnerId does not match either team1Id or team2Id of the match, THEN THE system SHALL reject the score and return an error.
5. THE system SHALL handle bye matches by automatically setting the present team as the winner and advancing that team to the next round match.

### Requirement 6: Match Scheduling

**User Story:** As an admin, I want to assign date, time, and venue to individual cricket matches, so that teams know when and where to play.

#### Acceptance Criteria

1. WHEN the admin schedules a cricket match, THE system SHALL store the scheduledDate (as DateTime) and venue in the match record.
2. THE system SHALL allow the admin to update or clear the schedule assignment for any match.
3. IF the admin attempts to schedule two cricket matches at the same venue and overlapping time, THEN THE system SHALL reject the assignment and display a conflict error.
4. THE system SHALL support bulk scheduling where the admin provides a list of match-to-slot assignments and the system applies them in a single operation.
5. WHEN bulk scheduling, THE system SHALL validate all assignments for conflicts before applying any of them.

### Requirement 7: Team Swap in Bracket

**User Story:** As an admin, I want to swap team positions in the bracket before freezing, so that I can manually adjust the draw if needed.

#### Acceptance Criteria

1. WHILE the fixture status is DRAFT, THE system SHALL allow the admin to swap two teams between any two bracket positions.
2. WHEN a swap is performed, THE system SHALL recalculate bye advancements to ensure teams with byes still advance correctly after the position change.
3. IF the fixture status is FROZEN and a match involving the swapped team has already been completed, THEN THE system SHALL reject the swap.

### Requirement 8: Public Bracket Display

**User Story:** As a player or spectator, I want to view the cricket bracket on the schedule page, so that I can see matchups, scores, and scheduled times.

#### Acceptance Criteria

1. THE Schedule_Display SHALL render the cricket fixture as a single elimination bracket showing all rounds from Round 1 through the final.
2. THE Schedule_Display SHALL show for each match: the two team names (or Winner_Placeholder labels for unresolved teams), the scheduled date and time, the venue, and the score if the match is completed.
3. WHEN a match has been completed, THE Schedule_Display SHALL visually indicate the winning team.
4. THE Schedule_Display SHALL indicate bye matches distinctly from regular matches.
5. THE Schedule_Display SHALL be accessible without authentication.
6. THE Schedule_Display SHALL remove all group stage rendering for cricket and show only the knockout bracket.
