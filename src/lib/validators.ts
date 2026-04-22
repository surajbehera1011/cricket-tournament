import { z } from "zod";

const playerEntrySchema = z.object({
  name: z.string().min(1, "Player name is required"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], { required_error: "Gender is required" }),
});

export const teamRegistrationSchema = z.object({
  teamName: z.string().min(2, "Team name must be at least 2 characters").max(100),
  captainName: z.string().min(2).max(100),
  players: z.array(playerEntrySchema).min(1, "At least 1 player is required"),
  comments: z.string().optional().default(""),
  submitterEmail: z.string().email(),
  submitterName: z.string().min(1),
});

export const individualRegistrationSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email().optional().or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  preferredRole: z.array(z.string()).min(1, "Select at least one role"),
  experienceLevel: z.enum(["Beginner", "Intermediate", "Advanced"]),
  comments: z.string().optional().default(""),
  submitterEmail: z.string().email(),
  submitterName: z.string().min(1),
});

export const assignPlayerSchema = z.object({
  playerId: z.string().uuid("Invalid player ID"),
});

export const removePlayerSchema = z.object({
  playerId: z.string().uuid("Invalid player ID"),
});

export type TeamRegistrationInput = z.infer<typeof teamRegistrationSchema>;
export type IndividualRegistrationInput = z.infer<typeof individualRegistrationSchema>;
export type AssignPlayerInput = z.infer<typeof assignPlayerSchema>;
export type RemovePlayerInput = z.infer<typeof removePlayerSchema>;
