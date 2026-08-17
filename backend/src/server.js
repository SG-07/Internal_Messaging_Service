// backend/src/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

dotenv.config();

// Import routes
import authRoutes from './routes/auth.js';
import conversationsRoutes from './routes/conversations.js';
import { getLandingPageHtml } from '../view/landingPage.js';
import adminRoutes from './routes/admin.js';
import teamsRoutes from './routes/teams.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// --- Root route: landing/redirect page ---
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(getLandingPageHtml(process.env.FRONTEND_URL));
});

// Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Use imported routes
app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teams', teamsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});