require('dotenv').config();
const authRoutes = require('./routes/auth')
const express = require('express');
const cors = require('cors');

const healthRoutes = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
// Add new route files here, e.g. app.use('/api/auth', require('./routes/auth'));

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
