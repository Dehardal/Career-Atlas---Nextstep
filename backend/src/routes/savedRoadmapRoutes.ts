import { Router } from 'express';
import { SavedRoadmapController } from '../controllers/savedRoadmapController';

const router = Router();

router.get('/', SavedRoadmapController.getSavedRoadmaps);
router.post('/', SavedRoadmapController.saveRoadmap);
router.delete('/:id', SavedRoadmapController.deleteRoadmap);

export default router;
