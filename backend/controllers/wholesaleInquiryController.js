/**
 * Wholesale inquiries (SCRUM-91). Mounted at /api/wholesale in server.js.
 *
 *   POST  /api/wholesale/inquiries       anyone: send the wholesale inquiry form
 *   GET   /api/wholesale/inquiries       admin/staff: list inquiries to follow up on
 *   PATCH /api/wholesale/inquiries/:id   admin/staff: mark one 'contacted' or 'closed'
 *
 * How a submission reaches the owner ("route to the right place for follow-up"):
 *   1. It is saved to the wholesale_inquiries table first. That is the record of truth,
 *      so a failed email never loses an inquiry.
 *   2. Then it is emailed to WHOLESALE_INBOX (backend/.env), the owner's inbox. With no
 *      email provider set up, the mailer prints it to the server console instead
 *      (see utils/mailer.js).
 *   3. Admins and staff can list every inquiry and mark their progress.
 *
 * No confirmation email goes to the address in the form. Anyone can type any address
 * there, so emailing it would let a stranger use M.CHA to send mail to whoever they like.
 *
 * Known gap, same as forgot-password: there is no rate limit, so someone could send the
 * form many times. That belongs with the hosting work (SCRUM-121), in front of the app.
 */
const pool = require('../db/pool');
const { sendMail } = require('../utils/mailer');

const INQUIRY_STATUSES = ['new', 'contacted', 'closed'];

const THANK_YOU = "Thanks! We've received your wholesale inquiry and will be in touch soon.";

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id >= 1 ? id : null;
}

function isEmail(text) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
}

function isHttpUrl(text) {
  try {
    const url = new URL(text);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// Each form field: its column, label for error messages, and rules.
// singleLine fields can't contain line breaks. They end up in the email subject and
// headers, where a line break could be used to inject extra lines.
const INQUIRY_FIELDS = {
  businessName: { column: 'business_name', label: 'Business name', required: true, max: 200, singleLine: true },
  contactName: { column: 'contact_name', label: 'Contact name', required: true, max: 200, singleLine: true },
  email: {
    column: 'email',
    label: 'Email',
    required: true,
    max: 255,
    singleLine: true,
    normalize: (text) => text.toLowerCase(),
    check: (text) => (isEmail(text) ? null : 'Enter a valid email address'),
  },
  phone: { column: 'phone', label: 'Phone', max: 50, singleLine: true },
  businessType: { column: 'business_type', label: 'Business type', max: 100, singleLine: true },
  website: {
    column: 'website',
    label: 'Website',
    max: 500,
    singleLine: true,
    check: (text) => (isHttpUrl(text) ? null : 'Website must be a link starting with http:// or https://'),
  },
  expectedVolume: { column: 'expected_volume', label: 'Expected order volume', max: 200, singleLine: true },
  message: { column: 'message', label: 'Message', required: true, max: 5000 },
};

/**
 * Checks the form against INQUIRY_FIELDS.
 * Returns { error } for the first problem, or { inquiry } with trimmed values
 * (optional fields left blank become null).
 */
function readInquiry(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Send the inquiry as a JSON object' };
  }
  const unknown = Object.keys(body).filter((key) => !INQUIRY_FIELDS[key]);
  if (unknown.length > 0) {
    return { error: `Unknown field: ${unknown.join(', ')}` };
  }

  const inquiry = {};
  for (const [key, field] of Object.entries(INQUIRY_FIELDS)) {
    const raw = body[key];
    if (raw !== undefined && raw !== null && typeof raw !== 'string') {
      return { error: `${field.label} must be text` };
    }
    let text = typeof raw === 'string' ? raw.trim() : '';

    if (text === '') {
      if (field.required) return { error: `${field.label} is required` };
      inquiry[key] = null;
      continue;
    }
    if (text.length > field.max) {
      return { error: `${field.label} must be ${field.max} characters or fewer` };
    }
    if (field.singleLine && /[\r\n]/.test(text)) {
      return { error: `${field.label} must be on one line` };
    }
    if (field.normalize) text = field.normalize(text);
    if (field.check) {
      const problem = field.check(text);
      if (problem) return { error: problem };
    }
    inquiry[key] = text;
  }
  return { inquiry };
}

/** Shapes a wholesale_inquiries row for the admin side (camelCase). */
function toInquiry(row) {
  return {
    id: row.id,
    userId: row.user_id,
    businessName: row.business_name,
    contactName: row.contact_name,
    email: row.email,
    phone: row.phone,
    businessType: row.business_type,
    website: row.website,
    expectedVolume: row.expected_volume,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** The email the owner receives for a new inquiry. Plain text, so nothing in it can run. */
function inquiryEmailBody(id, inquiry) {
  const line = (label, value) => `${label}: ${value || '(not given)'}`;
  return [
    'A business sent a wholesale inquiry from the M.CHA website.',
    '',
    line('Business', inquiry.businessName),
    line('Contact', inquiry.contactName),
    line('Email', inquiry.email),
    line('Phone', inquiry.phone),
    line('Business type', inquiry.businessType),
    line('Website', inquiry.website),
    line('Expected volume', inquiry.expectedVolume),
    '',
    'Message:',
    inquiry.message,
    '',
    `Reply to ${inquiry.email} to follow up. This is inquiry #${id}.`,
  ].join('\n');
}

/**
 * Emails the owner about a new inquiry. Never throws: the inquiry is already saved, so a
 * mail problem is logged and the business still gets its thank-you.
 */
async function notifyOwner(id, inquiry) {
  const inbox = process.env.WHOLESALE_INBOX;
  if (!inbox) {
    console.warn(`Wholesale inquiry #${id} was saved but not emailed: WHOLESALE_INBOX is not set.`);
    return;
  }
  try {
    await sendMail({
      to: inbox,
      subject: `New wholesale inquiry: ${inquiry.businessName}`,
      text: inquiryEmailBody(id, inquiry),
    });
  } catch (mailError) {
    console.error(`Could not email wholesale inquiry #${id}:`, mailError.message);
  }
}

// POST /api/wholesale/inquiries
// Body: { businessName, contactName, email, message } are required. Optional: phone,
// businessType, website, expectedVolume.
// Returns 201 { message, inquiry: { id, status } }, or 400 with { error } for invalid input.
// Guests can send it. If the sender is signed in, the inquiry is linked to their account.
async function submitInquiry(req, res, next) {
  const parsed = readInquiry(req.body);
  if (parsed.error) {
    return res.status(400).json({ error: parsed.error });
  }
  const { inquiry } = parsed;

  try {
    const [result] = await pool.query(
      `INSERT INTO wholesale_inquiries
         (user_id, business_name, contact_name, email, phone, business_type, website, expected_volume, message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user ? req.user.id : null,
        inquiry.businessName,
        inquiry.contactName,
        inquiry.email,
        inquiry.phone,
        inquiry.businessType,
        inquiry.website,
        inquiry.expectedVolume,
        inquiry.message,
      ]
    );
    await notifyOwner(result.insertId, inquiry);
    return res.status(201).json({ message: THANK_YOU, inquiry: { id: result.insertId, status: 'new' } });
  } catch (err) {
    return next(err);
  }
}

// GET /api/wholesale/inquiries  (admin and staff)
// Optional ?status=new|contacted|closed. Newest first.
async function listInquiries(req, res, next) {
  const { status } = req.query;
  if (status !== undefined && !INQUIRY_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${INQUIRY_STATUSES.join(', ')}` });
  }

  try {
    const [rows] = await pool.query(
      `SELECT * FROM wholesale_inquiries
       ${status ? 'WHERE status = ?' : ''}
       ORDER BY created_at DESC, id DESC`,
      status ? [status] : []
    );
    return res.json({ inquiries: rows.map(toInquiry) });
  } catch (err) {
    return next(err);
  }
}

// PATCH /api/wholesale/inquiries/:id  (admin and staff)
// Body: { status: 'new' | 'contacted' | 'closed' }. Returns 200 { inquiry }, 400, or 404.
async function updateInquiryStatus(req, res, next) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Invalid inquiry id' });
  }
  const { status } = req.body || {};
  if (!INQUIRY_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${INQUIRY_STATUSES.join(', ')}` });
  }

  try {
    const [result] = await pool.query('UPDATE wholesale_inquiries SET status = ? WHERE id = ?', [status, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }
    const [rows] = await pool.query('SELECT * FROM wholesale_inquiries WHERE id = ?', [id]);
    return res.json({ inquiry: toInquiry(rows[0]) });
  } catch (err) {
    return next(err);
  }
}

module.exports = { INQUIRY_STATUSES, submitInquiry, listInquiries, updateInquiryStatus };
