import { z } from "zod";

export const teamRegistrationSchema = z.object({
  teamName: z.string().min(2, "Team name must be at least 2 characters").max(100),
  captainName: z.string().min(2).max(100),
  teamSize: z.number().int().min(2).max(15).default(8),
  player1: z.string().min(1, "Player 1 is required"),
  player2: z.string().optional().default(""),
  player3: z.string().optional().default(""),
  player4: z.string().optional().default(""),
  player5: z.string().optional().default(""),
  player6: z.string().optional().default(""),
  player7: z.string().optional().default(""),
  player8: z.string().optional().default(""),
  player9: z.string().optional().default(""),
  comments: z.string().optional().default(""),
  submitterEmail: z.string().email(),
  submitterName: z.string().min(1),
});

export const individualRegistrationSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email().optional().or(z.literal("")),
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
