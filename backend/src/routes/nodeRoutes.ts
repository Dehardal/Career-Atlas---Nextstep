import { Router } from 'express';
import { NodeController } from '../controllers/nodeController';

const router = Router();

router.post('/', NodeController.createNode);
router.get('/', NodeController.getNodes);
router.get('/:id', NodeController.getNodeById);
router.put('/:id', NodeController.updateNode);
router.delete('/:id', NodeController.deleteNode);

export default router;
