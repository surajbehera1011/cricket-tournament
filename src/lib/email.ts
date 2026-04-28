import nodemailer from "nodemailer";

const SMTP_EMAIL = process.env.SMTP_EMAIL;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || "Align Sports League";
const APP_URL = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

const transporter =
  SMTP_EMAIL && SMTP_PASSWORD
    ? nodemailer.createTransport({
        service: "gmail",
        auth: { user: SMTP_EMAIL, pass: SMTP_PASSWORD },
      })
    : null;

function emailEnabled(): boolean {
  if (!transporter) {
    console.warn("[Email] SMTP not configured — skipping email");
    return false;
  }
  return true;
}

async function sendEmail(to: string | string[], subject: string, html: string) {
  if (!emailEnabled()) return;
  const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
  if (recipients.length === 0) return;
  try {
    await transporter!.sendMail({
      from: `"${SMTP_FROM_NAME}" <${SMTP_EMAIL}>`,
      to: recipients.join(", "),
      subject,
      html,
    });
    console.log(`[Email] Sent "${subject}" to ${recipients.join(", ")}`);
  } catch (err) {
    console.error(`[Email] Failed to send "${subject}":`, err);
  }
}

// ──────────────────────────────────────────────────
// HTML Template
// ──────────────────────────────────────────────────

function wrap(title: string, accentColor: string, body: string) {
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

  sendEmail(allEmails, `Team Submitted — ${teamName}`, wrap(title, "#8b5cf6", body));
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

  sendEmail(allEmails, `Registration Received — ${teamName}`, wrap(title, "#3b82f6", body));
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

  sendEmail(playerEmail, "Registration Received — Cricket Individual", wrap(title, "#3b82f6", body));
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

  sendEmail(allEmails, `${title} — ${teamName}`, wrap(title, accent, body));
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

  sendEmail(allEmails, `Registration Update — ${teamName}`, wrap(title, "#ef4444", body));
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

  sendEmail(allEmails, `Roster Update — ${teamName}`, wrap(title, "#f59e0b", body));
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

  sendEmail(playerEmail, "You're Approved — Welcome to the Pool!", wrap(title, "#10b981", body));
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

  sendEmail(playerEmail, `You've been drafted by ${teamName}!`, wrap(title, "#8b5cf6", body));
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

  sendEmail(playerEmail, "Roster Update — You're back in the pool", wrap(title, "#f59e0b", body));
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

  sendEmail(captainEmail, "Your Captain Login — Align Sports League", wrap(title, "#3b82f6", body));
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
  sendEmail(recipients, `Pickleball Registration Received — ${catLabel}`, wrap(title, "#ec4899", body));
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
  sendEmail(recipients, `Approved — Pickleball ${catLabel}`, wrap(title, "#10b981", body));
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
  sendEmail(recipients, `Registration Update — Pickleball ${catLabel}`, wrap(title, "#ef4444", body));
}
