import { Router } from 'express';
import { PathwayController } from '../controllers/pathwayController';

const router = Router();

router.get('/explore', PathwayController.explorePathway);
router.get('/next-steps/:nodeId', PathwayController.getNextSteps);
router.get('/subgraph/:nodeId', PathwayController.exploreSubgraph);

export default router;
