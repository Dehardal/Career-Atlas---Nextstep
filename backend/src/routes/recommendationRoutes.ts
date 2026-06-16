import { Router } from 'express';
import { RecommendationController } from '../controllers/recommendationController';

const router = Router();

router.get('/institutes', RecommendationController.getRecommendedInstitutes);

export default router;
