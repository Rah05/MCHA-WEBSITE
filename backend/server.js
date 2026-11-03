require('dotenv').config();
const authRoutes = require('./routes/auth')
const express = require('express');
const cors = require('cors');

const healthRoutes = require('./routes/health');
const { enforceHttps, securityHeaders } = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 3000;

// Hosting platforms put a load balancer in front of us, so believe its
// X-Forwarded-* headers for the client's protocol and IP address (SCRUM-53).
app.set('trust proxy', 1);

// Security first, before any route or body parsing: a request that arrived over
// plain HTTP is turned away before we do any work on it.
app.use(securityHeaders());
app.use(enforceHttps);

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
// Add new route files here, e.g. app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/auth', require('./routes/login')); // POST /api/auth/login (SCRUM-98)

// Basic error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`M.CHA API running on http://localhost:${PORT}`);
  });
}

module.exports = app;
