# Requirements Document

## Introduction

This feature enables administrators to create new cricket teams by selecting players from the individual player pool (players with `poolStatus = LOOKING_FOR_TEAM`). The admin provides a team name, picks players that satisfy tournament constraints (mandatory player count, mandatory female count, max team size), and the system creates the team in a ready state. The admin can then create captain credentials for the newly formed team, which subsequently behaves like any other team in the system.

## Glossary

- **Admin**: A user with the ADMIN role who manages the tournament
- **Individual_Pool**: The set of players with `poolStatus = LOOKING_FOR_TEAM`, available for team assignment
- **Team_Creation_Form**: The admin interface for creating a new team from pool players
- **Tournament_Settings**: The singleton configuration record containing `mandatoryPlayerCount`, `mandatoryFemaleCount`, `maxTeamSize`, and `extraPlayerLimit`
- **Pool_Player**: A player record with `poolStatus = LOOKING_FOR_TEAM`
- **Team**: A named group of players participating in the cricket tournament
- **Captain_Credentials**: A User record with CAPTAIN role linked to a team via `captainUserId`
- **Team_Membership**: The association between a player and a team, including position slot and membership type

## Requirements

### Requirement 1: Display Available Pool Players

**User Story:** As an admin, I want to see all players in the individual pool, so that I can select players to form a new team.

#### Acceptance Criteria

1. WHEN the admin opens the Team_Creation_Form, THE System SHALL display all Pool_Players with their full name, gender, preferred role, and experience level.
2. WHEN the admin opens the Team_Creation_Form, THE System SHALL retrieve the current Tournament_Settings to determine mandatoryPlayerCount, mandatoryFemaleCount, and maxTeamSize.
3. THE System SHALL only display players whose poolStatus equals LOOKING_FOR_TEAM in the selectable player list.

### Requirement 2: Create Team with Name

**User Story:** As an admin, I want to provide a team name when creating a team, so that the team has a unique identity in the tournament.

#### Acceptance Criteria

1. THE Team_Creation_Form SHALL require a team name with a minimum length of 2 characters and a maximum length of 100 characters.
2. WHEN the admin submits a team name that already exists, THE System SHALL return a validation error indicating the name is taken.
3. WHEN the admin provides a valid unique team name, THE System SHALL use that name as the team identifier.

### Requirement 3: Select Players from Pool

**User Story:** As an admin, I want to select multiple players from the individual pool, so that I can assign them to the new team.

#### Acceptance Criteria

1. THE Team_Creation_Form SHALL allow the admin to select multiple Pool_Players for the new team.
2. THE System SHALL enforce a maximum selection count equal to the maxTeamSize value from Tournament_Settings.
3. THE System SHALL prevent the admin from selecting a player whose poolStatus is not LOOKING_FOR_TEAM.
4. THE System SHALL display a running count of selected players and their gender breakdown as the admin makes selections.

### Requirement 4: Validate Team Composition

**User Story:** As an admin, I want the system to enforce tournament rules on team composition, so that admin-created teams meet the same standards as self-registered teams.

#### Acceptance Criteria

1. WHEN the admin submits the team creation form, THE System SHALL validate that the number of selected players is at least equal to the mandatoryPlayerCount from Tournament_Settings.
2. WHEN the admin submits the team creation form, THE System SHALL validate that the number of FEMALE players among the selected players is at least equal to the mandatoryFemaleCount from Tournament_Settings.
3. WHEN the admin submits the team creation form, THE System SHALL validate that the total number of selected players does not exceed the maxTeamSize from Tournament_Settings.
4. IF the selected players do not meet the mandatoryPlayerCount requirement, THEN THE System SHALL return a validation error specifying the minimum player count needed.
5. IF the selected players do not meet the mandatoryFemaleCount requirement, THEN THE System SHALL return a validation error specifying the minimum female player count needed.

### Requirement 5: Create Team and Assign Players

**User Story:** As an admin, I want the system to atomically create the team and assign all selected players, so that no partial state exists if something fails.

#### Acceptance Criteria

1. WHEN the admin submits a valid team creation request, THE System SHALL create the Team record with status COMPLETE within a single database transaction.
2. WHEN the admin submits a valid team creation request, THE System SHALL create a TeamMembership record for each selected player with membershipType set to DRAFT_PICK.
3. WHEN the admin submits a valid team creation request, THE System SHALL update each selected player's poolStatus from LOOKING_FOR_TEAM to ASSIGNED within the same transaction.
4. IF any step within the team creation transaction fails, THEN THE System SHALL roll back all changes and return an error message.
5. WHEN the team is created successfully, THE System SHALL assign position slots to each player (Player 1, Player 2, etc.).

### Requirement 6: Captain Credential Assignment

**User Story:** As an admin, I want to create captain credentials for the newly created team, so that a captain can log in and manage the team.

#### Acceptance Criteria

1. WHEN the team is created successfully, THE System SHALL make the new team available in the captain creation form's team assignment dropdown.
2. WHEN the admin creates captain credentials with a teamId, THE System SHALL link the captain User record to the team via the captainUserId field.
3. THE System SHALL use the existing captain creation endpoint to create credentials for admin-created teams.

### Requirement 7: Team Visibility on Dashboard

**User Story:** As an admin, I want admin-created teams to appear on the tournament dashboard, so that they are treated identically to self-registered teams.

#### Acceptance Criteria

1. WHEN a team is created by the admin, THE System SHALL make the team visible on the public tournament dashboard.
2. THE System SHALL include admin-created teams in fixture generation and scheduling.
3. WHEN a captain logs in for an admin-created team, THE System SHALL display the team management interface with all assigned players.

### Requirement 8: Audit Trail

**User Story:** As an admin, I want team creation actions to be logged, so that there is a record of administrative actions.

#### Acceptance Criteria

1. WHEN the admin creates a team from the pool, THE System SHALL create an audit log entry with the action type, actor, team details, and selected player identifiers.
2. THE System SHALL record the admin's user ID as the actor in the audit log entry.
