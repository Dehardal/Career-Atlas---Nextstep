import { Router } from 'express';
import { InstituteCourseController } from '../controllers/instituteCourseController';

const router = Router();

router.post('/', InstituteCourseController.createMapping);
router.get('/', InstituteCourseController.getMappings);
router.get('/:id', InstituteCourseController.getMappingById);
router.put('/:id', InstituteCourseController.updateMapping);
router.delete('/:id', InstituteCourseController.deleteMapping);

export default router;
