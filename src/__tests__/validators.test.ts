import { teamRegistrationSchema, individualRegistrationSchema, assignPlayerSchema } from "@/lib/validators";

describe("teamRegistrationSchema", () => {
  const validTeam = {
    teamName: "Royal Strikers",
    captainName: "Rahul Sharma",
    teamSize: 8,
    player1: "Player One",
    submitterEmail: "test@company.com",
    submitterName: "Test User",
  };

  it("accepts valid team registration", () => {
    const result = teamRegistrationSchema.safeParse(validTeam);
    expect(result.success).toBe(true);
  });

  it("rejects empty team name", () => {
    const result = teamRegistrationSchema.safeParse({ ...validTeam, teamName: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing player1", () => {
    const result = teamRegistrationSchema.safeParse({ ...validTeam, player1: "" });
    expect(result.success).toBe(false);
  });

  it("rejects team size below 2", () => {
    const result = teamRegistrationSchema.safeParse({ ...validTeam, teamSize: 1 });
    expect(result.success).toBe(false);
  });

  it("rejects team size above 15", () => {
    const result = teamRegistrationSchema.safeParse({ ...validTeam, teamSize: 16 });
    expect(result.success).toBe(false);
  });

  it("defaults optional player fields to empty string", () => {
    const result = teamRegistrationSchema.safeParse(validTeam);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.player2).toBe("");
      expect(result.data.player9).toBe("");
    }
  });
});

describe("individualRegistrationSchema", () => {
  const validIndividual = {
    fullName: "Ankit Saxena",
    preferredRole: ["Batsman"],
    experienceLevel: "Intermediate" as const,
    submitterEmail: "test@company.com",
    submitterName: "Test User",
  };

  it("accepts valid individual registration", () => {
    const result = individualRegistrationSchema.safeParse(validIndividual);
    expect(result.success).toBe(true);
  });

  it("accepts multiple roles", () => {
    const result = individualRegistrationSchema.safeParse({
      ...validIndividual,
      preferredRole: ["Batsman", "All-Rounder"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty role array", () => {
    const result = individualRegistrationSchema.safeParse({
      ...validIndividual,
      preferredRole: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid experience level", () => {
    const result = individualRegistrationSchema.safeParse({
      ...validIndividual,
      experienceLevel: "Expert",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional email as empty string", () => {
    const result = individualRegistrationSchema.safeParse({
      ...validIndividual,
      email: "",
    });
    expect(result.success).toBe(true);
  });
});

describe("assignPlayerSchema", () => {
  it("accepts valid UUID", () => {
    const result = assignPlayerSchema.safeParse({
      playerId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-UUID string", () => {
    const result = assignPlayerSchema.safeParse({ playerId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });
});
