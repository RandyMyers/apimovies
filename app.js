const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const fileUpload = require('express-fileupload');
const dotenv = require('dotenv');
const cloudinary = require('cloudinary').v2;
const logger = require('./config/logger');
const socketService = require('./services/socketService');

// Load environment variables
dotenv.config();

// Check if we're in a serverless environment (Vercel, etc.)
const isServerless = !!(
  process.env.VERCEL ||
  process.env.VERCEL_ENV ||
  (typeof __dirname !== 'undefined' && __dirname.includes('/var/task'))
);

// Production: require JWT_SECRET
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  logger.error('Fatal: JWT_SECRET is required in production.');
  process.exit(1);
}

// CORS: like dealcouponz - allow no origin, localhost in dev, and in production allow list + *.vercel.app
const corsOriginList = process.env.CORS_ORIGIN || process.env.CORS_ORIGINS;
const allowedFromEnv = corsOriginList ? corsOriginList.split(',').map((o) => o.trim()) : [];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (process.env.NODE_ENV !== 'production') {
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
    }
    const allowed = [
      'https://apimovies-one.vercel.app',
      ...allowedFromEnv,
    ];
    if (allowed.includes(origin)) return callback(null, true);
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    callback(null, true); // allow other origins so client/admin on any domain work
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Site-Slug', 'Origin', 'X-Requested-With', 'Accept'],
};

const app = express();

// Trust proxy (for correct IP and protocol behind Vercel/reverse proxy)
app.set('trust proxy', 1);

// Configure Cloudinary from ./config/cloudinary.js
const cloudinaryConfig = require('./config/cloudinary');
cloudinary.config(cloudinaryConfig);

// Basic middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));
app.use(fileUpload({ useTempFiles: false }));

// Locale detection (language & region) - must come before routes
app.use(require('./middleware/locale'));
// Resolve site from ?site= or X-Site-Slug (sets req.siteId when valid)
app.use(require('./middleware/siteResolver').resolveSite);

// Connect to MongoDB
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/cinehub-social';

mongoose
  .connect(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    logger.info('Connected to MongoDB');
    // Seed default site if none exist (multi-client)
    const Site = require('./models/Site');
    const count = await Site.countDocuments();
    if (count === 0) {
      await Site.create({
        name: 'CineHub Main',
        slug: 'cinehub',
        domain: null,
        isActive: true,
      });
      logger.info('Seeded default site: CineHub Main (slug: cinehub)');
    }
  })
  .catch((error) => {
    logger.error('Failed to connect to MongoDB', { error: error.message });
  });

// API routes for CineHub Social
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/movies', require('./routes/movieRoutes'));
app.use('/api/v1/tv', require('./routes/tvRoutes'));
app.use('/api/v1/reviews', require('./routes/reviewRoutes'));
app.use('/api/v1/lists', require('./routes/listRoutes'));
app.use('/api/v1/calendar', require('./routes/calendarRoutes'));
app.use('/api/v1/search', require('./routes/searchRoutes'));
app.use('/api/v1/person', require('./routes/personRoutes'));
app.use('/api/v1/collections', require('./routes/collectionRoutes'));
app.use('/api/v1/genres', require('./routes/genreRoutes'));
app.use('/api/v1/user/movies', require('./routes/userMovieRoutes'));
app.use('/api/v1/user/tv', require('./routes/userTVRoutes'));
app.use('/api/v1/episodes', require('./routes/episodeRoutes'));
app.use('/api/v1/blog', require('./routes/blogRoutes'));
app.use('/api/v1/analytics', require('./routes/analyticsRoutes'));
app.use('/api/v1/admin', require('./routes/adminRoutes'));
app.use('/api/v1/ads', require('./routes/adRoutes'));
app.use('/api/v1/product-deals', require('./routes/productDealRoutes'));
app.use('/api/v1/detail-seo', require('./routes/detailSeoRoutes'));
app.use('/api/v1/test', require('./routes/testRoutes'));

// TMDB config, certifications, watch providers, find, credit, companies, networks, keywords
app.use('/api/v1/config', require('./routes/configRoutes'));
app.use('/api/v1/companies', require('./routes/companyRoutes'));
app.use('/api/v1/networks', require('./routes/networkRoutes'));
app.use('/api/v1/keywords', require('./routes/keywordRoutes'));
app.use('/api/v1/find', require('./routes/findRoutes'));
app.use('/api/v1/credit', require('./routes/creditRoutes'));
app.use('/api/v1/tmdb/reviews', require('./routes/tmdbReviewRoutes'));

// Health check (includes DB status)
app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus =
    dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : dbState === 3 ? 'disconnecting' : 'disconnected';
  const healthy = dbState === 1;

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  res.status(status).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
  });
});

// In serverless (Vercel), do not create HTTP server or Socket.IO - platform handles the server
if (!isServerless) {
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: true,
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    },
    path: '/socket.io',
  });
  socketService.setIO(io);
  io.on('connection', (socket) => {
    const token = socket.handshake.auth?.token;
    if (token) socket.join('admin');
  });

  if (process.env.NODE_ENV !== 'test') {
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`, { port: PORT, env: process.env.NODE_ENV || 'development' });
    });
  }
} else {
  logger.info('Serverless function initialized', {
    environment: process.env.NODE_ENV || 'production',
    platform: process.env.VERCEL ? 'Vercel' : 'Unknown',
  });
}

module.exports = app;
