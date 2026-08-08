import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDatabase } from './config/db';
import nodeRouter from './routes/nodeRoutes';
import relationshipRouter from './routes/relationshipRoutes';
import pathwayRouter from './routes/pathwayRoutes';
import roadmapRouter from './routes/roadmapRoutes';
import eligibilityRouter from './routes/eligibilityRoutes';
import instituteCourseRouter from './routes/instituteCourseRoutes';
import recommendationRouter from './routes/recommendationRoutes';
import validationRouter from './routes/validationRoutes';
import suggestionRouter from './routes/suggestionRoutes';
import userRouter from './routes/userRoutes';
import savedRoadmapRouter from './routes/savedRoadmapRoutes';
import bookmarkRouter from './routes/bookmarkRoutes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // Securely allow embedding only from your own website and your local portfolio dev server
        frameAncestors: ["'self'", "http://localhost:13000", "http://localhost:5173", "https://*.vercel.app", "https://portfolio-dehardal.vercel.app"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    frameguard: false, // Disable legacy X-Frame-Options since CSP frameAncestors handles it securely in modern browsers
  })
);
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// API Routes
app.use('/api/v1/nodes', nodeRouter);
app.use('/api/v1/relationships', relationshipRouter);
app.use('/api/v1/pathways', pathwayRouter);
app.use('/api/v1/roadmaps', roadmapRouter);
app.use('/api/v1/eligibility-rules', eligibilityRouter);
app.use('/api/v1/institute-courses', instituteCourseRouter);
app.use('/api/v1/recommendations', recommendationRouter);
app.use('/api/v1/validation', validationRouter);
app.use('/api/v1/suggestions', suggestionRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/saved-roadmaps', savedRoadmapRouter);
app.use('/api/v1/bookmarks', bookmarkRouter);

// Base health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Serve frontend static assets in production
const frontendBuildPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendBuildPath));

// Fallback all other routes to frontend SPA router (index.html)
app.get('*', (req, res, next) => {
  // Skip API or health endpoints so they return 404 rather than the HTML page
  if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
    return next();
  }
  res.sendFile(path.join(frontendBuildPath, 'index.html'));
});

// Error handling middleware
app.use(errorHandler);

// Start server
const startServer = async () => {
  await connectDatabase();
  app.listen(PORT, () => {
    console.log(`Career Atlas Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer();

export default app;
