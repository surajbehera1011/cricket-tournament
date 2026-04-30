import { z } from "zod";

const playerEntrySchema = z.object({
  name: z.string().min(1, "Player name is required"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], { required_error: "Gender is required" }),
  email: z.string().email("Valid email is required"),
});

const extraPlayerSchema = z.object({
  name: z.string().min(1, "Player name is required"),
  gender: z.enum(["MALE", "FEMALE"], { required_error: "Gender is required (Male or Female only)" }),
  email: z.string().email("Valid email is required"),
});

export const MANDATORY_PLAYER_COUNT = 8;
export const MANDATORY_FEMALE_COUNT = 1;
export const EXTRA_PLAYER_LIMIT = 2;
export const MIN_PLAYERS_TO_REGISTER = 4;
export const MAX_TEAM_SIZE = 10;

export const teamRegistrationSchema = z.object({
  teamName: z.string().min(2, "Team name must be at least 2 characters").max(100),
  captainName: z.string().min(2).max(100),
  captainGender: z.enum(["MALE", "FEMALE", "OTHER"], { required_error: "Captain gender is required" }),
  captainEmail: z.string().email("Captain email is required"),
  players: z.array(playerEntrySchema).min(3, "At least 3 additional players are required (4 total including captain)"),
  extraPlayers: z.array(extraPlayerSchema).max(2, "Maximum 2 extra players allowed").optional().default([]),
  comments: z.string().optional().default(""),
  submitterEmail: z.string().email(),
  submitterName: z.string().min(1),
}).refine((data) => {
  const allEmails = [
    data.captainEmail,
    ...data.players.map((p) => p.email),
    ...data.extraPlayers.map((p) => p.email),
  ].map((e) => e.toLowerCase());
  return new Set(allEmails).size === allEmails.length;
}, { message: "All player emails must be unique", path: ["players"] })
.refine((data) => {
  const allMandatoryGenders = [data.captainGender, ...data.players.map((p) => p.gender)];
  const femaleCount = allMandatoryGenders.filter((g) => g === "FEMALE").length;
  return femaleCount >= 1;
}, { message: "At least 1 female player is required among the mandatory players (including captain)", path: ["players"] })
.refine((data) => {
  if (data.extraPlayers.length === 0) return true;
  if (data.extraPlayers.length > 2) return false;
  const males = data.extraPlayers.filter((p) => p.gender === "MALE").length;
  return males <= 1;
}, { message: "Extra players can have at most 1 male (2 females allowed, but not 2 males)", path: ["extraPlayers"] });

export const individualRegistrationSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Valid email is required"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  preferredRole: z.array(z.string()).min(1, "Select at least one role").max(2, "Maximum 2 roles allowed"),
  experienceLevel: z.enum(["Beginner", "Intermediate", "Advanced"]),
  comments: z.string().optional().default(""),
  submitterEmail: z.string().email(),
  submitterName: z.string().min(1),
});

export const assignPlayerSchema = z.object({
  playerId: z.string().uuid("Invalid player ID"),
  slotType: z.enum(["mandatory", "extra"], { required_error: "Slot type is required" }),
});

export const removePlayerSchema = z.object({
  playerId: z.string().uuid("Invalid player ID"),
});

export type TeamRegistrationInput = z.infer<typeof teamRegistrationSchema>;
export type IndividualRegistrationInput = z.infer<typeof individualRegistrationSchema>;
export type AssignPlayerInput = z.infer<typeof assignPlayerSchema>;
export type RemovePlayerInput = z.infer<typeof removePlayerSchema>;
