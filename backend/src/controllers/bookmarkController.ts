import { Request, Response, NextFunction } from 'express';
import { BookmarkModel } from '../models/Bookmark';
import { UserModel } from '../models/User';

export class BookmarkController {
  /**
   * GET /api/v1/bookmarks?email=...
   * Retrieve all bookmarked nodes for a user.
   */
  static async getBookmarks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.query;
      if (!email) {
        res.status(400).json({ error: 'Email parameter is required' });
        return;
      }

      const emailStr = (email as string).toLowerCase().trim();
      const user = await UserModel.findOne({ email: emailStr });
      if (!user) {
        res.status(200).json([]);
        return;
      }

      const bookmarks = await BookmarkModel.find({ userId: user._id })
        .populate('nodeId')
        .sort({ createdAt: -1 });

      res.status(200).json(bookmarks);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/bookmarks
   * Bookmark a node (degree/exam/occupation) for a user.
   */
  static async addBookmark(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, nodeId, notes } = req.body;

      if (!email || !nodeId) {
        res.status(400).json({ error: 'Email and nodeId are required fields' });
        return;
      }

      const emailStr = (email as string).toLowerCase().trim();
      let user = await UserModel.findOne({ email: emailStr });
      if (!user) {
        const namePart = emailStr.split('@')[0];
        const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        user = await UserModel.create({
          name: formattedName,
          email: emailStr,
          passwordHash: '$2b$10$dummyhashplaceholderforbcrypttorenderitvalidforpassword60chars',
          role: 'STUDENT',
          profile: { interests: [], completedSkills: [] }
        });
      }

      // Check if bookmark already exists to prevent duplicate key errors
      const existing = await BookmarkModel.findOne({ userId: user._id, nodeId });
      if (existing) {
        const populated = await BookmarkModel.findById(existing._id).populate('nodeId');
        res.status(200).json(populated);
        return;
      }

      const bookmark = new BookmarkModel({
        userId: user._id,
        nodeId,
        notes: notes || ''
      });

      const savedBookmark = await bookmark.save();
      const populatedBookmark = await BookmarkModel.findById(savedBookmark._id).populate('nodeId');

      res.status(201).json(populatedBookmark);
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        res.status(400).json({ error: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * DELETE /api/v1/bookmarks/:id
   * Delete a bookmark.
   */
  static async deleteBookmark(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const deletedBookmark = await BookmarkModel.findByIdAndDelete(id);

      if (!deletedBookmark) {
        res.status(404).json({ error: 'Bookmark not found' });
        return;
      }

      res.status(200).json({ message: 'Bookmark removed successfully' });
    } catch (error) {
      next(error);
    }
  }
}
export default BookmarkController;
