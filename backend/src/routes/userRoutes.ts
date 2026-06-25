import { Router } from 'express';
import { UserController } from '../controllers/userController';

const router = Router();

router.get('/profile', UserController.getOrCreateProfile);
router.put('/profile', UserController.updateProfile);

export default router;
