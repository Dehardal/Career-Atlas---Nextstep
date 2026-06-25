import { Request, Response, NextFunction } from 'express';
import { UserModel } from '../models/User';

export class UserController {
  /**
   * Fetch a user profile by email or create it if not exists.
   * GET /api/v1/users/profile?email=...
   */
  static async getOrCreateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.query;
      if (!email) {
        res.status(400).json({ error: 'Email parameter is required' });
        return;
      }

      const emailStr = (email as string).toLowerCase().trim();
      let user = await UserModel.findOne({ email: emailStr })
        .populate('profile.currentQualification')
        .populate('profile.targetOccupation')
        .populate('profile.completedSkills')
        .populate('profile.preferredBoard');

      if (!user) {
        const namePart = emailStr.split('@')[0];
        const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        
        user = await UserModel.create({
          name: formattedName,
          email: emailStr,
          passwordHash: '$2b$10$dummyhashplaceholderforbcrypttorenderitvalidforpassword60chars', // fits minlength 60 validation
          role: emailStr === 'admin.demo@gmail.com' ? 'ADMIN' : 'STUDENT',
          profile: {
            interests: [],
            completedSkills: []
          }
        });
      }

      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update profile fields (interests, completedSkills, targetOccupation, currentQualification).
   * PUT /api/v1/users/profile
   */
  static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, name, role, profile } = req.body;
      if (!email) {
        res.status(400).json({ error: 'Email is required for updating profile' });
        return;
      }

      const emailStr = (email as string).toLowerCase().trim();
      const updatedUser = await UserModel.findOneAndUpdate(
        { email: emailStr },
        { name, role, profile },
        { new: true, runValidators: true }
      )
        .populate('profile.currentQualification')
        .populate('profile.targetOccupation')
        .populate('profile.completedSkills')
        .populate('profile.preferredBoard');

      if (!updatedUser) {
        res.status(404).json({ error: 'User profile not found' });
        return;
      }

      res.status(200).json(updatedUser);
    } catch (error) {
      next(error);
    }
  }
}
export default UserController;
