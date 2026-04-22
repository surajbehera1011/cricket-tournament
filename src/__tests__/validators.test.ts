import { teamRegistrationSchema, individualRegistrationSchema, assignPlayerSchema } from "@/lib/validators";

describe("teamRegistrationSchema", () => {
  const validTeam = {
    teamName: "Royal Strikers",
    captainName: "Rahul Sharma",
    captainGender: "MALE" as const,
    captainEmail: "rahul@company.com",
    players: [
      { name: "Player Two", gender: "MALE" as const, email: "p2@company.com" },
      { name: "Player Three", gender: "FEMALE" as const, email: "p3@company.com" },
      { name: "Player Four", gender: "MALE" as const, email: "p4@company.com" },
    ],
    submitterEmail: "test@company.com",
    submitterName: "Test User",
  };

  it("accepts valid team registration with 4 players (1 captain + 3)", () => {
    const result = teamRegistrationSchema.safeParse(validTeam);
    expect(result.success).toBe(true);
  });

  it("rejects empty team name", () => {
    const result = teamRegistrationSchema.safeParse({ ...validTeam, teamName: "" });
    expect(result.success).toBe(false);
  });

  it("rejects fewer than 3 additional players (need 4 total including captain)", () => {
    const result = teamRegistrationSchema.safeParse({
      ...validTeam,
      players: [
        { name: "Player Two", gender: "MALE" as const, email: "p2@company.com" },
        { name: "Player Three", gender: "FEMALE" as const, email: "p3@company.com" },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects players without email", () => {
    const result = teamRegistrationSchema.safeParse({
      ...validTeam,
      players: [
        { name: "Player Two", gender: "MALE" as const, email: "" },
        { name: "Player Three", gender: "FEMALE" as const, email: "p3@company.com" },
        { name: "Player Four", gender: "MALE" as const, email: "p4@company.com" },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing captain gender", () => {
    const result = teamRegistrationSchema.safeParse({ ...validTeam, captainGender: undefined });
    expect(result.success).toBe(false);
  });

  it("rejects missing captain email", () => {
    const result = teamRegistrationSchema.safeParse({ ...validTeam, captainEmail: "" });
    expect(result.success).toBe(false);
  });
});

describe("individualRegistrationSchema", () => {
  const validIndividual = {
    fullName: "Ankit Saxena",
    email: "ankit@company.com",
    gender: "MALE" as const,
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

  it("rejects missing email", () => {
    const result = individualRegistrationSchema.safeParse({
      ...validIndividual,
      email: "",
    });
    expect(result.success).toBe(false);
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
