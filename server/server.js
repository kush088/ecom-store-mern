
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';

import authRoutes from './routes/auth.js';
import categoryRoutes from './routes/categories.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payments.js';
import couponRoutes from './routes/coupons.js';
import userRoutes from './routes/users.js';
import miscRoutes from './routes/misc.js';
import adminRoutes from './routes/admin.js';
import uploadRoutes from './routes/upload.js';
import { notFound, errorHandler } from './middleware/error.js';

const app = express();

// Trust the hosting platform's proxy for rate limiting.
app.set('trust proxy', 1);

// Allowed frontend origins.
const allowedOrigins = [
  'https://ecom-store-mern-zn25.vercel.app',
  'http://localhost:5173',
];

// Security middleware.
app.use(helmet());

// CORS configuration.
// This must come before your API routes.
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header and approved origins.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS blocked for origin: ${origin}`)
      );
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Parse JSON request bodies.
app.use(express.json({ limit: '1mb' }));

// HTTP request logging.
app.use(
  morgan(
    process.env.NODE_ENV === 'production' ? 'combined' : 'dev'
  )
);

// General API rate limit.
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Authentication rate limit.
app.use(
  '/api/auth',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Health check.
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    ok: true,
    message: 'E-com Store API is running',
  });
});

// API routes.
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', miscRoutes);

// Handle unknown routes.
app.use(notFound);

// Central error handler.
app.use(errorHandler);

// Start server after connecting to MongoDB.
const PORT = process.env.PORT || 5000;

if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is missing from environment variables.');
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
