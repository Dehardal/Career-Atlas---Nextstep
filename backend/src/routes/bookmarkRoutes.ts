import { Router } from 'express';
import { BookmarkController } from '../controllers/bookmarkController';

const router = Router();

router.get('/', BookmarkController.getBookmarks);
router.post('/', BookmarkController.addBookmark);
router.delete('/:id', BookmarkController.deleteBookmark);

export default router;
