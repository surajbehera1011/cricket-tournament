import { ClientSecretCredential } from "@azure/identity";
import { Client as GraphClient } from "@microsoft/microsoft-graph-client";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials";

const AZURE_MAIL_TENANT_ID = process.env.AZURE_MAIL_TENANT_ID;
const AZURE_MAIL_CLIENT_ID = process.env.AZURE_MAIL_CLIENT_ID;
const AZURE_MAIL_CLIENT_SECRET = process.env.AZURE_MAIL_CLIENT_SECRET;
const MAIL_FROM_ADDRESS = process.env.MAIL_FROM_ADDRESS;
const MAIL_FROM_NAME = process.env.MAIL_FROM_NAME || "Align Sports League";
const APP_URL = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

const ALLOWED_DOMAIN = "@aligntech.com";

function emailEnabled(): boolean {
  if (!AZURE_MAIL_TENANT_ID || !AZURE_MAIL_CLIENT_ID || !AZURE_MAIL_CLIENT_SECRET || !MAIL_FROM_ADDRESS) {
    console.warn("[Email] Azure Graph API not configured — skipping email");
    return false;
  }
  return true;
}

function getGraphClient(): GraphClient {
  const credential = new ClientSecretCredential(
    AZURE_MAIL_TENANT_ID!,
    AZURE_MAIL_CLIENT_ID!,
    AZURE_MAIL_CLIENT_SECRET!,
  );
  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ["https://graph.microsoft.com/.default"],
  });
  return GraphClient.initWithMiddleware({ authProvider });
}

async function sendEmail(to: string | string[], subject: string, html: string) {
  if (!emailEnabled()) return;
  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (recipients.length === 0) return;

  for (const recipient of recipients) {
    if (!recipient.endsWith(ALLOWED_DOMAIN)) {
      console.error(`[Email] External recipient blocked: "${recipient}" — only ${ALLOWED_DOMAIN} addresses allowed`);
      return;
    }
  }

  try {
    const message = {
      message: {
        subject,
        body: { contentType: "HTML", content: html },
        from: { emailAddress: { address: MAIL_FROM_ADDRESS, name: MAIL_FROM_NAME } },
        toRecipients: recipients.map((addr) => ({ emailAddress: { address: addr } })),
      },
      saveToSentItems: false,
    };

    await getGraphClient()
      .api(`/users/${MAIL_FROM_ADDRESS}/sendMail`)
      .post(message);

    console.log(`[Email] Sent "${subject}" to ${recipients.join(", ")}`);
  } catch (err) {
    console.error(`[Email] Failed to send "${subject}":`, err);
  }
}

// ──────────────────────────────────────────────────
// HTML Template
// ──────────────────────────────────────────────────

function wrap(title: string, accentColor: string, body: string, sport?: "cricket" | "pickleball") {
  const sportBadge = sport === "cricket"
    ? `<span style="display:inline-block;background:#16a34a20;color:#22c55e;font-size:11px;font-weight:800;padding:4px 12px;border-radius:6px;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">&#127951; Cricket</span><br/>`
    : sport === "pickleball"
    ? `<span style="display:inline-block;background:#ec489920;color:#ec4899;font-size:11px;font-weight:800;padding:4px 12px;border-radius:6px;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">&#127955; Pickleball</span><br/>`
    : "";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:580px;">

  <!-- Logo -->
  <tr><td align="center" style="padding:0 0 24px;">
    <h1 style="margin:0;font-size:26px;font-weight:900;letter-spacing:3px;color:#ffffff;">ALIGN SPORTS LEAGUE</h1>
    <p style="margin:4px 0 0;font-size:11px;color:#64748b;letter-spacing:1px;text-transform:uppercase;">Cricket &amp; Pickleball 2026</p>
  </td></tr>

  <!-- Card -->
  <tr><td>
  <table width="100%" style="background:#1e293b;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);">

    <!-- Accent bar -->
    <tr><td style="height:4px;background:${accentColor};"></td></tr>

    <!-- Title -->
    <tr><td style="padding:28px 32px 20px;">
      ${sportBadge}
      <h2 style="margin:0;font-size:20px;font-weight:800;color:#ffffff;line-height:1.3;">${title}</h2>
    </td></tr>

    <!-- Body -->
    <tr><td style="padding:0 32px 28px;">
      ${body}
    </td></tr>

    <!-- Divider -->
    <tr><td style="padding:0 32px;"><div style="height:1px;background:rgba(255,255,255,0.06);"></div></td></tr>

    <!-- Footer -->
    <tr><td style="padding:24px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:12px;color:#64748b;line-height:1.6;">
            Questions? Reach out to<br/>
            <a href="mailto:sbehera@aligntech.com" style="color:${accentColor};text-decoration:none;font-weight:700;">sbehera@aligntech.com</a>
          </td>
          <td align="right">
            <a href="${APP_URL}" style="display:inline-block;font-size:11px;color:#94a3b8;text-decoration:none;border:1px solid rgba(255,255,255,0.1);padding:6px 14px;border-radius:6px;">
              Open Dashboard &rarr;
            </a>
          </td>
        </tr>
      </table>
    </td></tr>

  </table>
  </td></tr>

  <!-- Bottom text -->
  <tr><td align="center" style="padding:20px 0 0;">
    <p style="margin:0;font-size:10px;color:#475569;">
      Automated notification from Align Sports League &bull; Do not reply to this email
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`;
}

function infoRow(label: string, value: string) {
  return `<tr>
    <td style="padding:10px 14px;font-size:12px;color:#94a3b8;font-weight:600;white-space:nowrap;border-bottom:1px solid rgba(255,255,255,0.04);">${label}</td>
    <td style="padding:10px 14px;font-size:13px;color:#e2e8f0;border-bottom:1px solid rgba(255,255,255,0.04);">${value}</td>
  </tr>`;
}

function detailsTable(rows: [string, string][]) {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border-radius:12px;border:1px solid rgba(255,255,255,0.06);margin:16px 0;">
    ${rows.map(([l, v]) => infoRow(l, v)).join("")}
  </table>`;
}

function btn(text: string, url: string, color: string) {
  return `<div style="text-align:center;margin:24px 0 4px;">
    <a href="${url}" style="display:inline-block;background:${color};color:#ffffff;font-size:14px;font-weight:700;padding:13px 32px;border-radius:10px;text-decoration:none;letter-spacing:0.3px;">
      ${text}
    </a>
  </div>`;
}

function para(text: string) {
  return `<p style="margin:0 0 14px;font-size:14px;color:#cbd5e1;line-height:1.7;">${text}</p>`;
}

function highlight(text: string, color: string) {
  return `<span style="display:inline-block;background:${color}20;color:${color};font-weight:700;padding:2px 10px;border-radius:6px;font-size:13px;">${text}</span>`;
}

// ──────────────────────────────────────────────────
// CRICKET — Team Submitted for Approval
// ──────────────────────────────────────────────────

export function sendTeamSubmittedEmail(
  allEmails: string[],
  teamName: string,
  playerCount: number,
  femaleCount: number
) {
  const title = "Team Submitted for Approval!";
  const body = `
    ${para(`Team <strong style="color:#ffffff;">${teamName}</strong> has been submitted for final admin approval!`)}
    ${para("All criteria have been met. The admin will now review your roster. You'll receive an email once the admin approves or sends it back.")}
    ${detailsTable([
      ["Team", `<strong style="color:#ffffff;">${teamName}</strong>`],
      ["Total Players", `${playerCount}`],
      ["Female Players", `${femaleCount}`],
      ["Status", highlight("Submitted — Awaiting Approval", "#8b5cf6")],
    ])}
    ${para("You can still make roster changes until the admin approves and freezes the team.")}
    ${btn("View Your Team", `${APP_URL}/manage`, "#8b5cf6")}`;

  sendEmail(allEmails, `[Cricket] Team Submitted — ${teamName}`, wrap(title, "#8b5cf6", body, "cricket"));
}

// ──────────────────────────────────────────────────
// CRICKET — Registration Confirmation
// ──────────────────────────────────────────────────

export function sendTeamRegistrationConfirmation(
  allEmails: string[],
  teamName: string,
  captainName: string,
  playerCount: number
) {
  const title = "Team Registration Received!";
  const body = `
    ${para(`Hey team <strong style="color:#ffffff;">${teamName}</strong>! Your registration has been successfully submitted.`)}
    ${para("Your team is now <strong>awaiting admin approval</strong>. You'll receive another email once the admin reviews your registration.")}
    ${detailsTable([
      ["Team Name", `<strong style="color:#ffffff;">${teamName}</strong>`],
      ["Captain", captainName],
      ["Players Registered", `${playerCount} players`],
      ["Status", highlight("Pending Approval", "#f59e0b")],
    ])}
    ${para("While you wait, you can check your registration status anytime:")}
    ${btn("Check Registration Status", `${APP_URL}/status`, "#3b82f6")}`;

  sendEmail(allEmails, `[Cricket] Registration Received — ${teamName}`, wrap(title, "#3b82f6", body, "cricket"));
}

export function sendIndividualRegistrationConfirmation(
  playerEmail: string,
  playerName: string
) {
  const title = "Registration Received!";
  const body = `
    ${para(`Hi <strong style="color:#ffffff;">${playerName}</strong>! Your individual registration for the cricket tournament has been submitted.`)}
    ${para("You are now <strong>awaiting admin approval</strong>. Once approved, you'll enter the player pool where team captains can draft you.")}
    ${detailsTable([
      ["Name", `<strong style="color:#ffffff;">${playerName}</strong>`],
      ["Registration Type", "Individual Player"],
      ["Status", highlight("Pending Approval", "#f59e0b")],
    ])}
    ${btn("Check Your Status", `${APP_URL}/status`, "#3b82f6")}`;

  sendEmail(playerEmail, "[Cricket] Registration Received — Individual Player", wrap(title, "#3b82f6", body, "cricket"));
}

// ──────────────────────────────────────────────────
// CRICKET — Team Approved / Ready
// ──────────────────────────────────────────────────

export function sendTeamApprovedEmail(
  allEmails: string[],
  teamName: string,
  newStatus: string
) {
  const isReady = newStatus === "READY";
  const title = isReady ? "Your Team is READY!" : "Team Registration Approved!";
  const accent = "#10b981";

  const statusText = isReady
    ? "Your roster has been approved and <strong style='color:#10b981;'>locked in for the tournament</strong>. No further changes can be made — it's game time!"
    : "Your team has been approved! The captain can now sign in, browse the player pool, and build the roster.";

  const body = `
    ${para(`Great news for <strong style="color:#ffffff;">${teamName}</strong>!`)}
    ${para(statusText)}
    ${detailsTable([
      ["Team", `<strong style="color:#ffffff;">${teamName}</strong>`],
      ["Status", isReady ? highlight("READY — Frozen", "#10b981") : highlight("Approved — Build Roster", "#10b981")],
    ])}
    ${para(isReady
      ? "Stay tuned for match fixtures and schedules. Good luck!"
      : "Captain: sign in to manage your team, draft players from the pool, and submit your final roster.")}
    ${btn(isReady ? "View Dashboard" : "Manage Your Team", isReady ? APP_URL : `${APP_URL}/manage`, accent)}`;

  sendEmail(allEmails, `[Cricket] ${title} — ${teamName}`, wrap(title, accent, body, "cricket"));
}

// ──────────────────────────────────────────────────
// CRICKET — Team Rejected
// ──────────────────────────────────────────────────

export function sendTeamRejectedEmail(
  allEmails: string[],
  teamName: string,
  reason?: string
) {
  const title = "Team Registration Update";
  const body = `
    ${para(`Hi team <strong style="color:#ffffff;">${teamName}</strong>,`)}
    ${para("Unfortunately, your team registration has been <strong style='color:#ef4444;'>rejected</strong> by the admin.")}
    ${detailsTable([
      ["Team", teamName],
      ["Action", highlight("Rejected", "#ef4444")],
      ...(reason ? [["Reason", reason] as [string, string]] : []),
    ])}
    ${para("If you believe this was a mistake, please reach out to the organizer for more details.")}
    ${btn("Contact Organizer", "mailto:sbehera@aligntech.com", "#ef4444")}`;

  sendEmail(allEmails, `[Cricket] Registration Update — ${teamName}`, wrap(title, "#ef4444", body, "cricket"));
}

export function sendRosterRejectedEmail(
  allEmails: string[],
  teamName: string,
  movedPlayerCount: number
) {
  const title = "Roster Sent Back for Changes";
  const body = `
    ${para(`Hi team <strong style="color:#ffffff;">${teamName}</strong>,`)}
    ${para("The admin has reviewed your submitted roster and sent it back for changes.")}
    ${detailsTable([
      ["Team", teamName],
      ["Players Moved to Pool", `<strong>${movedPlayerCount}</strong>`],
      ["Team Status", highlight("INCOMPLETE — Needs Updates", "#f59e0b")],
    ])}
    ${para("The captain should sign in, review the roster, draft replacement players if needed, and re-submit for approval.")}
    ${btn("Manage Team", `${APP_URL}/manage`, "#f59e0b")}`;

  sendEmail(allEmails, `[Cricket] Roster Update — ${teamName}`, wrap(title, "#f59e0b", body, "cricket"));
}

// ──────────────────────────────────────────────────
// CRICKET — Individual Approved
// ──────────────────────────────────────────────────

export function sendIndividualApprovedEmail(
  playerName: string,
  playerEmail: string
) {
  const title = "You're in the Player Pool!";
  const body = `
    ${para(`Hi <strong style="color:#ffffff;">${playerName}</strong>,`)}
    ${para("Your individual registration has been <strong style='color:#10b981;'>approved</strong>! You are now in the player pool and visible to all team captains.")}
    ${detailsTable([
      ["Name", `<strong style="color:#ffffff;">${playerName}</strong>`],
      ["Status", highlight("In Player Pool", "#10b981")],
      ["Next Step", "Wait for a captain to draft you"],
    ])}
    ${para("Captains will browse the pool and pick players for their teams. You'll get an email the moment a captain drafts you!")}
    ${btn("Check Your Status", `${APP_URL}/status`, "#10b981")}`;

  sendEmail(playerEmail, "[Cricket] You're Approved — Welcome to the Pool!", wrap(title, "#10b981", body, "cricket"));
}

// ──────────────────────────────────────────────────
// CRICKET — Player Drafted / Removed
// ──────────────────────────────────────────────────

export function sendPlayerDraftedEmail(
  playerName: string,
  playerEmail: string,
  teamName: string,
  slotType: string
) {
  const title = "You've Been Drafted!";
  const slotLabel = slotType === "extra" ? "Extra Player" : "Core Player";
  const body = `
    ${para(`Hi <strong style="color:#ffffff;">${playerName}</strong>,`)}
    ${para(`Exciting news! You've been drafted into team <strong style="color:#8b5cf6;">${teamName}</strong>!`)}
    ${detailsTable([
      ["Team", `<strong style="color:#ffffff;">${teamName}</strong>`],
      ["Your Role", highlight(slotLabel, "#8b5cf6")],
      ["Status", "Assigned to Team"],
    ])}
    ${para("The captain may still make roster changes before submitting. Once the final roster is approved by admin, your spot is locked in. Get ready to play!")}
    ${btn("Check Your Status", `${APP_URL}/status`, "#8b5cf6")}`;

  sendEmail(playerEmail, `[Cricket] You've been drafted by ${teamName}!`, wrap(title, "#8b5cf6", body, "cricket"));
}

export function sendPlayerRemovedEmail(
  playerName: string,
  playerEmail: string,
  teamName: string
) {
  const title = "Roster Update";
  const body = `
    ${para(`Hi <strong style="color:#ffffff;">${playerName}</strong>,`)}
    ${para(`You have been moved back to the player pool from team <strong>${teamName}</strong>.`)}
    ${detailsTable([
      ["Previous Team", teamName],
      ["Current Status", highlight("Back in Player Pool", "#f59e0b")],
    ])}
    ${para("Don't worry — you're still in the pool and other captains can draft you. If you have any questions, reach out to the organizer.")}
    ${btn("Check Your Status", `${APP_URL}/status`, "#f59e0b")}`;

  sendEmail(playerEmail, "[Cricket] Roster Update — You're back in the pool", wrap(title, "#f59e0b", body, "cricket"));
}

// ──────────────────────────────────────────────────
// CRICKET — Captain Credentials
// ──────────────────────────────────────────────────

export function sendCaptainCredentialsEmail(
  captainEmail: string,
  displayName: string,
  password: string,
  teamName?: string
) {
  const title = "Your Captain Login is Ready!";
  const body = `
    ${para(`Hi <strong style="color:#ffffff;">${displayName}</strong>,`)}
    ${para("Your captain account has been created! Use the credentials below to sign in and manage your team.")}
    ${detailsTable([
      ["Login Email", `<strong style="color:#ffffff;">${captainEmail}</strong>`],
      ["Password", `<code style="background:#ef444420;padding:3px 12px;border-radius:6px;font-size:15px;color:#fca5a5;font-weight:700;letter-spacing:1px;">${password}</code>`],
      ...(teamName ? [["Your Team", `<strong style="color:#ffffff;">${teamName}</strong>`] as [string, string]] : []),
    ])}
    <div style="background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.2);border-radius:10px;padding:14px 18px;margin:16px 0;">
      <p style="margin:0;font-size:12px;color:#fbbf24;font-weight:600;">
        Keep these credentials safe. Do not share your password with anyone. Contact the organizer if you need a reset.
      </p>
    </div>
    ${para("As captain, you can:")}
    <table cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
      <tr><td style="padding:4px 0;font-size:13px;color:#94a3b8;">&#9989;&nbsp; View and manage your team roster</td></tr>
      <tr><td style="padding:4px 0;font-size:13px;color:#94a3b8;">&#9989;&nbsp; Browse the individual player pool</td></tr>
      <tr><td style="padding:4px 0;font-size:13px;color:#94a3b8;">&#9989;&nbsp; Draft players into mandatory or extra slots</td></tr>
      <tr><td style="padding:4px 0;font-size:13px;color:#94a3b8;">&#9989;&nbsp; Submit your final roster for approval</td></tr>
    </table>
    ${btn("Sign In Now", `${APP_URL}/auth/signin`, "#3b82f6")}`;

  sendEmail(captainEmail, "[Cricket] Your Captain Login — Align Sports League", wrap(title, "#3b82f6", body, "cricket"));
}

// ──────────────────────────────────────────────────
// CRICKET — Captain Credentials Updated
// ──────────────────────────────────────────────────

export function sendCaptainCredentialsUpdatedEmail(
  captainEmail: string,
  displayName: string,
  changes: { emailChanged?: boolean; passwordChanged?: boolean; newPassword?: string }
) {
  const title = "Your Captain Credentials Updated";
  const rows: [string, string][] = [
    ["Login Email", `<strong style="color:#ffffff;">${captainEmail}</strong>`],
  ];
  if (changes.passwordChanged && changes.newPassword) {
    rows.push(["New Password", `<code style="background:#ef444420;padding:3px 12px;border-radius:6px;font-size:15px;color:#fca5a5;font-weight:700;letter-spacing:1px;">${changes.newPassword}</code>`]);
  }

  const changeList: string[] = [];
  if (changes.emailChanged) changeList.push("login email");
  if (changes.passwordChanged) changeList.push("password");
  const changeDesc = changeList.join(" and ");

  const body = `
    ${para(`Hi <strong style="color:#ffffff;">${displayName}</strong>,`)}
    ${para(`Your ${changeDesc} ${changeList.length > 1 ? "have" : "has"} been updated by the admin.`)}
    ${detailsTable(rows)}
    <div style="background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.2);border-radius:10px;padding:14px 18px;margin:16px 0;">
      <p style="margin:0;font-size:12px;color:#fbbf24;font-weight:600;">
        If you did not expect this change, contact the organizer immediately.
      </p>
    </div>
    ${btn("Sign In Now", `${APP_URL}/auth/signin`, "#f59e0b")}`;

  sendEmail(captainEmail, "[Cricket] Credentials Updated — Align Sports League", wrap(title, "#f59e0b", body, "cricket"));
}

// ──────────────────────────────────────────────────
// PICKLEBALL — Registration Confirmation
// ──────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  MENS_SINGLES: "Men's Singles",
  WOMENS_SINGLES: "Women's Singles",
  MENS_DOUBLES: "Men's Doubles",
  WOMENS_DOUBLES: "Women's Doubles",
  MIXED_DOUBLES: "Mixed Doubles",
};

export function sendPickleballRegistrationConfirmation(
  player1Email: string,
  player1Name: string,
  category: string,
  player2Email?: string | null,
  player2Name?: string | null,
) {
  const catLabel = CATEGORY_LABELS[category] || category;
  const isDoubles = !!player2Email;
  const title = "Pickleball Registration Received!";

  const rows: [string, string][] = [
    ["Category", `<strong style="color:#ffffff;">${catLabel}</strong>`],
    ["Player 1", player1Name],
  ];
  if (isDoubles && player2Name) {
    rows.push(["Player 2 (Partner)", player2Name]);
  }
  rows.push(["Status", highlight("Pending Approval", "#f59e0b")]);

  const body = `
    ${para(`Hi <strong style="color:#ffffff;">${player1Name}</strong>${isDoubles ? ` &amp; <strong style="color:#ffffff;">${player2Name}</strong>` : ""}!`)}
    ${para(`Your pickleball registration for <strong style="color:#ec4899;">${catLabel}</strong> has been submitted successfully!`)}
    ${detailsTable(rows)}
    ${para("Your registration is now awaiting admin approval. You'll receive an email once it's reviewed.")}
    ${btn("Check Registration Status", `${APP_URL}/status`, "#ec4899")}`;

  const recipients = [player1Email];
  if (isDoubles && player2Email) recipients.push(player2Email);
  sendEmail(recipients, `[Pickleball] Registration Received — ${catLabel}`, wrap(title, "#ec4899", body, "pickleball"));
}

// ──────────────────────────────────────────────────
// PICKLEBALL — Approved
// ──────────────────────────────────────────────────

export function sendPickleballApprovedEmail(
  player1Email: string,
  player1Name: string,
  category: string,
  player2Email?: string | null,
  player2Name?: string | null,
) {
  const catLabel = CATEGORY_LABELS[category] || category;
  const isDoubles = !!player2Email;
  const title = "Pickleball Registration Approved!";

  const rows: [string, string][] = [
    ["Category", `<strong style="color:#ffffff;">${catLabel}</strong>`],
    ["Player 1", player1Name],
  ];
  if (isDoubles && player2Name) {
    rows.push(["Player 2 (Partner)", player2Name]);
  }
  rows.push(["Status", highlight("Approved", "#10b981")]);

  const body = `
    ${para(`Congratulations <strong style="color:#ffffff;">${player1Name}</strong>${isDoubles ? ` &amp; <strong style="color:#ffffff;">${player2Name}</strong>` : ""}!`)}
    ${para(`Your registration for <strong style="color:#ec4899;">${catLabel}</strong> has been <strong style="color:#10b981;">approved</strong>! You're officially in the tournament.`)}
    ${detailsTable(rows)}
    ${para("Stay tuned for match schedules and brackets. Get your paddles ready!")}
    ${btn("View Dashboard", APP_URL, "#10b981")}`;

  const recipients = [player1Email];
  if (isDoubles && player2Email) recipients.push(player2Email);
  sendEmail(recipients, `[Pickleball] Approved — ${catLabel}`, wrap(title, "#10b981", body, "pickleball"));
}

// ──────────────────────────────────────────────────
// PICKLEBALL — Rejected
// ──────────────────────────────────────────────────

export function sendPickleballRejectedEmail(
  player1Email: string,
  player1Name: string,
  category: string,
  player2Email?: string | null,
  player2Name?: string | null,
) {
  const catLabel = CATEGORY_LABELS[category] || category;
  const isDoubles = !!player2Email;
  const title = "Pickleball Registration Update";

  const body = `
    ${para(`Hi <strong style="color:#ffffff;">${player1Name}</strong>${isDoubles ? ` &amp; <strong style="color:#ffffff;">${player2Name}</strong>` : ""},`)}
    ${para(`Your pickleball registration for <strong>${catLabel}</strong> has been <strong style="color:#ef4444;">rejected</strong> by the admin.`)}
    ${detailsTable([
      ["Category", catLabel],
      ["Status", highlight("Rejected", "#ef4444")],
    ])}
    ${para("If you believe this was a mistake, please contact the organizer.")}
    ${btn("Contact Organizer", "mailto:sbehera@aligntech.com", "#ef4444")}`;

  const recipients = [player1Email];
  if (isDoubles && player2Email) recipients.push(player2Email);
  sendEmail(recipients, `[Pickleball] Registration Update — ${catLabel}`, wrap(title, "#ef4444", body, "pickleball"));
}

// ──────────────────────────────────────────────────
// FIXTURE — Match Scheduled Notification
// ──────────────────────────────────────────────────

interface MatchForEmail {
  id: string;
  sport: string;
  stage: string;
  groupName?: string | null;
  matchNumber: number;
  category?: string | null;
  team1Id?: string | null;
  team2Id?: string | null;
  entry1Id?: string | null;
  entry2Id?: string | null;
  scheduledDate?: Date | null;
  venue?: string | null;
}

export async function sendMatchScheduledEmail(match: MatchForEmail) {
  if (!emailEnabled()) return;
  if (!match.scheduledDate || !match.venue) return;

  const { prisma } = await import("@/lib/prisma");
  const dateStr = new Date(match.scheduledDate).toLocaleString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (match.sport === "CRICKET") {
    const team1 = match.team1Id && !match.team1Id.startsWith("WINNER_")
      ? await prisma.team.findUnique({
          where: { id: match.team1Id },
          include: { memberships: { include: { player: true } } },
        })
      : null;
    const team2 = match.team2Id && !match.team2Id.startsWith("WINNER_")
      ? await prisma.team.findUnique({
          where: { id: match.team2Id },
          include: { memberships: { include: { player: true } } },
        })
      : null;

    const emails: string[] = [];
    const team1Name = team1?.name ?? "TBD";
    const team2Name = team2?.name ?? "TBD";

    if (team1) {
      for (const m of team1.memberships) {
        if (m.player.email) emails.push(m.player.email);
      }
    }
    if (team2) {
      for (const m of team2.memberships) {
        if (m.player.email) emails.push(m.player.email);
      }
    }

    if (emails.length === 0) return;

    const stageLabel = match.stage === "GROUP"
      ? `Group ${match.groupName} — Match #${match.matchNumber}`
      : `Knockout — Match #${match.matchNumber}`;

    const title = "Cricket Match Scheduled!";
    const body = `
      ${para(`Your cricket match has been scheduled!`)}
      ${detailsTable([
        ["Match", stageLabel],
        ["Teams", `<strong style="color:#ffffff;">${team1Name}</strong> vs <strong style="color:#ffffff;">${team2Name}</strong>`],
        ["Date & Time", `<strong style="color:#22d3ee;">${dateStr}</strong>`],
        ["Venue", `<strong style="color:#ffffff;">${match.venue}</strong>`],
      ])}
      ${para("Make sure your team is ready. Good luck!")}
      ${btn("View Schedule", `${APP_URL}/schedule`, "#3b82f6")}`;

    sendEmail(emails, `[Cricket] Match Scheduled — ${team1Name} vs ${team2Name}`, wrap(title, "#3b82f6", body, "cricket"));
  } else {
    const entry1 = match.entry1Id
      ? await prisma.pickleballRegistration.findUnique({ where: { id: match.entry1Id } })
      : null;
    const entry2 = match.entry2Id
      ? await prisma.pickleballRegistration.findUnique({ where: { id: match.entry2Id } })
      : null;

    const emails: string[] = [];
    const entry1Name = entry1 ? (entry1.player2Name ? `${entry1.player1Name} & ${entry1.player2Name}` : entry1.player1Name) : "TBD";
    const entry2Name = entry2 ? (entry2.player2Name ? `${entry2.player1Name} & ${entry2.player2Name}` : entry2.player1Name) : "TBD";

    if (entry1) {
      emails.push(entry1.player1Email);
      if (entry1.player2Email) emails.push(entry1.player2Email);
    }
    if (entry2) {
      emails.push(entry2.player1Email);
      if (entry2.player2Email) emails.push(entry2.player2Email);
    }

    if (emails.length === 0) return;

    const catLabel = match.category ? (CATEGORY_LABELS[match.category] || match.category) : "Pickleball";
    const title = "Pickleball Match Scheduled!";
    const body = `
      ${para(`Your pickleball match has been scheduled!`)}
      ${detailsTable([
        ["Category", `<strong style="color:#ec4899;">${catLabel}</strong>`],
        ["Match", `#${match.matchNumber}`],
        ["Players", `<strong style="color:#ffffff;">${entry1Name}</strong> vs <strong style="color:#ffffff;">${entry2Name}</strong>`],
        ["Date & Time", `<strong style="color:#22d3ee;">${dateStr}</strong>`],
        ["Venue", `<strong style="color:#ffffff;">${match.venue}</strong>`],
      ])}
      ${para("Get your paddles ready! Good luck!")}
      ${btn("View Schedule", `${APP_URL}/schedule`, "#ec4899")}`;

    sendEmail(emails, `[Pickleball] Match Scheduled — ${catLabel} #${match.matchNumber}`, wrap(title, "#ec4899", body, "pickleball"));
  }
}
