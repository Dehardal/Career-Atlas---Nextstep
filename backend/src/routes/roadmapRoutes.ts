import { Router } from 'express';
import { RoadmapController } from '../controllers/roadmapController';

const router = Router();

router.get('/bfs/:nodeId', RoadmapController.getBfsTree);
router.get('/shortest', RoadmapController.getShortestPath);
router.get('/alternatives', RoadmapController.getAlternativePaths);
router.get('/careers/:nodeId', RoadmapController.getReachableCareers);

export default router;
