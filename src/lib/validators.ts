import { z } from "zod";

const playerEntrySchema = z.object({
  name: z.string().min(1, "Player name is required"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], { required_error: "Gender is required" }),
  email: z.string().email("Valid email is required"),
});

export const teamRegistrationSchema = z.object({
  teamName: z.string().min(2, "Team name must be at least 2 characters").max(100),
  captainName: z.string().min(2).max(100),
  captainGender: z.enum(["MALE", "FEMALE", "OTHER"], { required_error: "Captain gender is required" }),
  captainEmail: z.string().email("Captain email is required"),
  players: z.array(playerEntrySchema).min(3, "At least 3 additional players are required (4 total including captain)"),
  comments: z.string().optional().default(""),
  submitterEmail: z.string().email(),
  submitterName: z.string().min(1),
}).refine((data) => {
  const emails = [data.captainEmail, ...data.players.map((p) => p.email)].map((e) => e.toLowerCase());
  return new Set(emails).size === emails.length;
}, { message: "All player emails must be unique", path: ["players"] });

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
});

export const removePlayerSchema = z.object({
  playerId: z.string().uuid("Invalid player ID"),
});

export type TeamRegistrationInput = z.infer<typeof teamRegistrationSchema>;
export type IndividualRegistrationInput = z.infer<typeof individualRegistrationSchema>;
export type AssignPlayerInput = z.infer<typeof assignPlayerSchema>;
export type RemovePlayerInput = z.infer<typeof removePlayerSchema>;
