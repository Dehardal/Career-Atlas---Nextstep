import { Router } from 'express';
import { EligibilityController } from '../controllers/eligibilityController';

const router = Router();

// Retrieve all rules
router.get('/', EligibilityController.getRules);

// Create a new rule
router.post('/', EligibilityController.createRule);

// Update a rule
router.put('/:id', EligibilityController.updateRule);

// Delete a rule
router.delete('/:id', EligibilityController.deleteRule);

export default router;
