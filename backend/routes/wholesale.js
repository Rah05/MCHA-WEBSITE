// Wholesale inquiry routes (SCRUM-91). Mounted at /api/wholesale in server.js.
const express = require('express');
const { identifyUser, requireAuth, requireRole, ROLES } = require('../middleware/auth');
const {
  submitInquiry,
  listInquiries,
  updateInquiryStatus,
} = require('../controllers/wholesaleInquiryController');

const router = express.Router();
const staffOnly = [requireAuth, requireRole(ROLES.ADMIN, ROLES.STAFF)];

// Anyone can send the form. identifyUser links it to the account when signed in.
router.post('/inquiries', identifyUser, submitInquiry); // POST /api/wholesale/inquiries

// Follow-up, for admins and staff only.
router.get('/inquiries', ...staffOnly, listInquiries); // GET /api/wholesale/inquiries
router.patch('/inquiries/:id', ...staffOnly, updateInquiryStatus); // PATCH /api/wholesale/inquiries/:id

module.exports = router;
