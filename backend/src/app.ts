import express from 'express';
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
app.use(helmet());
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

// Base health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
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
