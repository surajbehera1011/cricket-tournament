import { UserRole } from "@prisma/client";

describe("Assignment Authorization Rules", () => {
  function canAssign(
    actorRole: UserRole,
    actorUserId: string,
    teamCaptainUserId: string | null
  ): { allowed: boolean; reason?: string } {
    if (actorRole === UserRole.CAPTAIN && teamCaptainUserId !== actorUserId) {
      return { allowed: false, reason: "Captains can only assign to their own team" };
    }
    return { allowed: true };
  }

  it("allows ADMIN to assign to any team", () => {
    const result = canAssign(UserRole.ADMIN, "admin-1", "captain-1");
    expect(result.allowed).toBe(true);
  });

  it("allows ADMIN to assign to team with no captain", () => {
    const result = canAssign(UserRole.ADMIN, "admin-1", null);
    expect(result.allowed).toBe(true);
  });

  it("allows CAPTAIN to assign to their own team", () => {
    const result = canAssign(UserRole.CAPTAIN, "captain-1", "captain-1");
    expect(result.allowed).toBe(true);
  });

  it("denies CAPTAIN from assigning to another team", () => {
    const result = canAssign(UserRole.CAPTAIN, "captain-1", "captain-2");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("own team");
  });

  it("denies CAPTAIN from assigning to team with no captain", () => {
    const result = canAssign(UserRole.CAPTAIN, "captain-1", null);
    expect(result.allowed).toBe(false);
  });
});

describe("Assignment Business Rules", () => {
  function validateAssignment(params: {
    playerExists: boolean;
    alreadyOnTeam: boolean;
    teamExists: boolean;
  }): { valid: boolean; error?: string } {
    if (!params.teamExists) return { valid: false, error: "Team not found" };
    if (!params.playerExists) return { valid: false, error: "Player not found" };
    if (params.alreadyOnTeam) return { valid: false, error: "Player is already on this team" };
    return { valid: true };
  }

  it("accepts valid assignment", () => {
    const result = validateAssignment({
      playerExists: true,
      alreadyOnTeam: false,
      teamExists: true,
    });
    expect(result.valid).toBe(true);
  });

  it("rejects if team does not exist", () => {
    const result = validateAssignment({
      playerExists: true,
      alreadyOnTeam: false,
      teamExists: false,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Team not found");
  });

  it("rejects if player does not exist", () => {
    const result = validateAssignment({
      playerExists: false,
      alreadyOnTeam: false,
      teamExists: true,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Player not found");
  });

  it("rejects if player is already on the team", () => {
    const result = validateAssignment({
      playerExists: true,
      alreadyOnTeam: true,
      teamExists: true,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Player is already on this team");
  });
});
