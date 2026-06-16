import { Router } from 'express';
import { ValidationController } from '../controllers/validationController';

const router = Router();

router.get('/report', ValidationController.getValidationReport);

export default router;
