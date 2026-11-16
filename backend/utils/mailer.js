/**
 * Outgoing email (SCRUM-100).
 *
 * This is a seam, not a finished integration. The password reset flow needs to send
 * mail, but the team has not chosen an email provider: the cost estimate report
 * prices Resend Pro at $20/month, and that choice is bundled into the hosting
 * decision in SCRUM-137, which is still unassigned.
 *
 * Rather than let an unmade decision block a finished feature, every caller talks to
 * `sendMail` and nothing else. With no API key configured, the message is printed to
 * the server console, which makes the whole reset flow testable end to end: start the
 * backend, request a reset, and copy the link out of the terminal. Set RESEND_API_KEY
 * and the same call starts delivering for real, with no changes above this file.
 *
 * If the team picks a provider other than Resend, this is the only file that changes.
 */

// Resend will not send from a domain it has not verified. Once M.CHA's domain is
// registered and its DNS records are in place, this becomes something like
// "M.CHA <noreply@m-cha.com>"; until then Resend's shared testing sender works.
const MAIL_FROM = process.env.MAIL_FROM || 'M.CHA <onboarding@resend.dev>';

/**
 * Sends one plaintext email.
 *
 * Note the two different outcomes for "no mail went out". Returning
 * `{ delivered: false }` when no provider is configured is the expected state in
 * development and is not a failure. Throwing is reserved for a provider that was
 * configured and then refused the message, which is a real fault worth surfacing.
 * Callers that must not fail because of mail should catch, and the reset controller
 * explains why it does.
 *
 * @param {object} message
 * @param {string} message.to      Recipient address.
 * @param {string} message.subject Subject line.
 * @param {string} message.text    Body as plaintext. No HTML email yet; the reset
 *                                 link is the only thing being sent and a plain
 *                                 message avoids every rendering quirk.
 * @returns {Promise<{delivered: boolean, reason?: string}>}
 * @throws {Error} If a provider is configured and rejects the message.
 */
async function sendMail({ to, subject, text }) {
  if (!process.env.RESEND_API_KEY) {
    console.log('\n----- email (not sent: RESEND_API_KEY is not set) -----');
    console.log(`to:      ${to}`);
    console.log(`subject: ${subject}`);
    console.log('');
    console.log(text);
    console.log('----- end email -----\n');
    return { delivered: false, reason: 'no-provider-configured' };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: MAIL_FROM, to, subject, text }),
  });

  // The provider's response body can quote the message it rejected, so only the
  // status code is reported. An error string that carries a reset link into the
  // application logs would undo the point of not storing the link in the first place.
  if (!response.ok) {
    throw new Error(`Email provider rejected the message (HTTP ${response.status})`);
  }

  return { delivered: true };
}

module.exports = { MAIL_FROM, sendMail };