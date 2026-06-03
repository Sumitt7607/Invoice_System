import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import os from 'os';

// DB connection
import connectDB from './config/db.js';

// Middlewares
import { errorHandler } from './middleware/errorMiddleware.js';
import { apiLimiter } from './middleware/rateLimiter.js';

// Services
import { initSocket } from './services/socketService.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

// Load Env
dotenv.config();

const app = express();

// Database Connection Middleware for Serverless
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

// Detect if running on Vercel serverless
const isVercel = !!process.env.VERCEL;

// Security Headers & CORS
app.use(helmet({
  crossOriginResourcePolicy: false, // allow images/receipts to load in browser
}));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Logger & Parsers
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists
// On Vercel serverless, the filesystem is read-only except /tmp
const uploadDir = isVercel
  ? path.join(os.tmpdir(), 'uploads')
  : path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
// Serve static uploads
app.use('/uploads', express.static(uploadDir));

// API Rate Limiter
app.use('/api', apiLimiter);

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/notifications', notificationRoutes);

// Base Route
app.get('/', (req, res) => {
  res.send('Manshu Finance System API is running...');
});

// Central Error Handler
app.use(errorHandler);

// Only start HTTP server + Socket.io when running locally (not on Vercel serverless)
if (!isVercel) {
  const server = http.createServer(app);

  // Initialize Socket.io (only works with a persistent server, not serverless)
  initSocket(server, process.env.CLIENT_URL);

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

// Export the Express app for Vercel serverless
export default app;

