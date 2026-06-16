import { Router } from 'express';
import { SuggestionController } from '../controllers/suggestionController';

const router = Router();

router.post('/', SuggestionController.createSuggestion);
router.get('/', SuggestionController.getSuggestions);
router.patch('/:id/status', SuggestionController.updateSuggestionStatus);
router.delete('/:id', SuggestionController.deleteSuggestion);

export default router;
