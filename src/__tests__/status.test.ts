describe("Team Status Computation", () => {
  function computeStatus(memberCount: number, teamSize: number): "COMPLETE" | "INCOMPLETE" {
    return memberCount >= teamSize ? "COMPLETE" : "INCOMPLETE";
  }

  it("marks team as COMPLETE when member count equals team size", () => {
    expect(computeStatus(8, 8)).toBe("COMPLETE");
  });

  it("marks team as COMPLETE when member count exceeds team size", () => {
    expect(computeStatus(10, 8)).toBe("COMPLETE");
  });

  it("marks team as INCOMPLETE when member count is below team size", () => {
    expect(computeStatus(5, 8)).toBe("INCOMPLETE");
  });

  it("marks team with 0 members as INCOMPLETE", () => {
    expect(computeStatus(0, 8)).toBe("INCOMPLETE");
  });

  it("marks small team (size 2) as COMPLETE with 2 members", () => {
    expect(computeStatus(2, 2)).toBe("COMPLETE");
  });

  it("handles single remaining slot as INCOMPLETE", () => {
    expect(computeStatus(7, 8)).toBe("INCOMPLETE");
  });
});

describe("Slots Remaining Calculation", () => {
  function slotsRemaining(memberCount: number, teamSize: number): number {
    return Math.max(0, teamSize - memberCount);
  }

  it("returns correct remaining slots", () => {
    expect(slotsRemaining(5, 8)).toBe(3);
  });

  it("returns 0 when team is full", () => {
    expect(slotsRemaining(8, 8)).toBe(0);
  });

  it("returns 0 when team has more members than size (overflow)", () => {
    expect(slotsRemaining(10, 8)).toBe(0);
  });

  it("returns full team size when no members", () => {
    expect(slotsRemaining(0, 8)).toBe(8);
  });
});

describe("Player Name Extraction", () => {
  function extractPlayerNames(input: Record<string, string>): string[] {
    return Array.from({ length: 9 }, (_, i) => input[`player${i + 1}`])
      .filter((name) => name && name.trim() !== "");
  }

  it("extracts all non-empty player names", () => {
    const input = {
      player1: "Alice",
      player2: "Bob",
      player3: "Charlie",
      player4: "",
      player5: "",
      player6: "",
      player7: "",
      player8: "",
      player9: "",
    };
    expect(extractPlayerNames(input)).toEqual(["Alice", "Bob", "Charlie"]);
  });

  it("returns empty array when all players are empty", () => {
    const input: Record<string, string> = {};
    for (let i = 1; i <= 9; i++) input[`player${i}`] = "";
    expect(extractPlayerNames(input)).toEqual([]);
  });

  it("extracts single player", () => {
    const input: Record<string, string> = { player1: "Solo" };
    expect(extractPlayerNames(input)).toEqual(["Solo"]);
  });

  it("ignores whitespace-only names", () => {
    const input: Record<string, string> = {
      player1: "Valid",
      player2: "   ",
      player3: "Also Valid",
    };
    expect(extractPlayerNames(input)).toEqual(["Valid", "Also Valid"]);
  });
});
