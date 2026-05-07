const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const projectRoutes = require('./routes/project.routes');
const taskRoutes = require('./routes/task.routes');
const teamRoutes = require('./routes/team.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const notificationRoutes = require('./routes/notification.routes');
const activityRoutes = require('./routes/activity.routes');

const { errorHandler } = require('./middleware/error.middleware');

const app = express();

// Security middleware
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// CORS
app.use(cors({
  origin: [process.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activities', activityRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use(errorHandler);

// Database connection — falls back to in-memory MongoDB if local is unavailable
const connectDB = async () => {
  const configuredUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskflow';

  // First try the configured URI
  try {
    const conn = await mongoose.connect(configuredUri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    return;
  } catch {
    console.warn('⚠️  Local MongoDB not available, starting in-memory database...');
  }

  // Fall back to in-memory MongoDB (development only)
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB (in-memory) connected: ${conn.connection.host}`);
    console.log('ℹ️  Using in-memory database — data resets on restart.');
    console.log('ℹ️  For persistent data, install MongoDB or use MongoDB Atlas.');

    // Auto-seed demo data in memory mode
    try {
      const User = require('./models/User.model');
      const count = await User.countDocuments();
      if (count === 0) {
        console.log('🌱 Seeding demo data...');
        await require('./utils/seed').seedData();
        console.log('✅ Demo data ready — login: admin@taskflow.com / password123');
      }
    } catch (seedErr) {
      console.warn('⚠️  Could not auto-seed:', seedErr.message);
    }
  } catch (error) {
    console.error('❌ Failed to start in-memory MongoDB:', error.message);
    process.exit(1);
  }
};

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 TaskFlow API running on port ${PORT} [${process.env.NODE_ENV}]`);
  });
});

module.exports = app;
