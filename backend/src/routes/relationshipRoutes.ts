import { Router } from 'express';
import { RelationshipController } from '../controllers/relationshipController';

const router = Router();

router.post('/', RelationshipController.createRelationship);
router.get('/', RelationshipController.getRelationships);
router.delete('/:id', RelationshipController.deleteRelationship);

export default router;
