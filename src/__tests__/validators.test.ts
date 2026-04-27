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
    extraPlayers: [],
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

  it("accepts team with valid extra players (1 male + 1 female)", () => {
    const result = teamRegistrationSchema.safeParse({
      ...validTeam,
      extraPlayers: [
        { name: "Extra Male", gender: "MALE" as const, email: "em@company.com" },
        { name: "Extra Female", gender: "FEMALE" as const, email: "ef@company.com" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts team with single extra player", () => {
    const result = teamRegistrationSchema.safeParse({
      ...validTeam,
      extraPlayers: [
        { name: "Extra Female", gender: "FEMALE" as const, email: "ef@company.com" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects extra players with 2 males", () => {
    const result = teamRegistrationSchema.safeParse({
      ...validTeam,
      extraPlayers: [
        { name: "Extra Male 1", gender: "MALE" as const, email: "em1@company.com" },
        { name: "Extra Male 2", gender: "MALE" as const, email: "em2@company.com" },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("accepts extra players with 2 females", () => {
    const result = teamRegistrationSchema.safeParse({
      ...validTeam,
      extraPlayers: [
        { name: "Extra Female 1", gender: "FEMALE" as const, email: "ef1@company.com" },
        { name: "Extra Female 2", gender: "FEMALE" as const, email: "ef2@company.com" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects more than 2 extra players", () => {
    const result = teamRegistrationSchema.safeParse({
      ...validTeam,
      extraPlayers: [
        { name: "Extra 1", gender: "MALE" as const, email: "e1@company.com" },
        { name: "Extra 2", gender: "FEMALE" as const, email: "e2@company.com" },
        { name: "Extra 3", gender: "MALE" as const, email: "e3@company.com" },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects duplicate emails across mandatory and extra players", () => {
    const result = teamRegistrationSchema.safeParse({
      ...validTeam,
      extraPlayers: [
        { name: "Extra Dupe", gender: "MALE" as const, email: "p2@company.com" },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("defaults extraPlayers to empty array when not provided", () => {
    const { extraPlayers, ...withoutExtra } = validTeam;
    const result = teamRegistrationSchema.safeParse(withoutExtra);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.extraPlayers).toEqual([]);
    }
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
