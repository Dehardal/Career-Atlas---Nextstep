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
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security and utility middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Allow loading frontend scripts, stylesheets, and Google Identity Services SDK
  })
);
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'], credentials: true }));
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
