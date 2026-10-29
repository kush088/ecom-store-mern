
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

// Render proxy configuration.
app.set('trust proxy', 1);

// Allowed frontend origins: use plain URLs, not Markdown links.
const allowedOrigins = [
  'https://ecom-store-mern-zn25.vercel.app',
  'http://localhost:5173',
];

app.use(helmet());

// CORS must run before the API routes and rate limiters.
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error(`CORS blocked origin: ${origin}`);
      return callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '1mb' }));

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

// Error handlers.
app.use(notFound);
app.use(errorHandler);

// Start the server after connecting to MongoDB.
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
