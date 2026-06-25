import { Request, Response, NextFunction } from 'express';
import { SavedRoadmapModel } from '../models/SavedRoadmap';
import { UserModel } from '../models/User';

export class SavedRoadmapController {
  /**
   * GET /api/v1/saved-roadmaps?email=...
   * Retrieve all saved roadmaps for a user.
   */
  static async getSavedRoadmaps(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const roadmaps = await SavedRoadmapModel.find({ userId: user._id })
        .populate('nodeSequence')
        .populate({
          path: 'relationshipSequence',
          populate: [
            { path: 'fromNode' },
            { path: 'toNode' }
          ]
        })
        .sort({ createdAt: -1 });

      res.status(200).json(roadmaps);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/saved-roadmaps
   * Save a new roadmap pathway.
   */
  static async saveRoadmap(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, title, description, nodeSequence, relationshipSequence } = req.body;

      if (!email || !title || !nodeSequence) {
        res.status(400).json({ error: 'Email, title, and nodeSequence are required fields' });
        return;
      }

      const emailStr = (email as string).toLowerCase().trim();
      let user = await UserModel.findOne({ email: emailStr });
      if (!user) {
        // Create user on the fly if needed
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

      const roadmap = new SavedRoadmapModel({
        userId: user._id,
        title,
        description: description || '',
        nodeSequence,
        relationshipSequence: relationshipSequence || []
      });

      const savedRoadmap = await roadmap.save();
      
      const populatedRoadmap = await SavedRoadmapModel.findById(savedRoadmap._id)
        .populate('nodeSequence')
        .populate({
          path: 'relationshipSequence',
          populate: [
            { path: 'fromNode' },
            { path: 'toNode' }
          ]
        });

      res.status(201).json(populatedRoadmap);
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        res.status(400).json({ error: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * DELETE /api/v1/saved-roadmaps/:id
   * Delete a saved roadmap.
   */
  static async deleteRoadmap(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const deletedRoadmap = await SavedRoadmapModel.findByIdAndDelete(id);

      if (!deletedRoadmap) {
        res.status(404).json({ error: 'Saved roadmap not found' });
        return;
      }

      res.status(200).json({ message: 'Saved roadmap deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
export default SavedRoadmapController;
