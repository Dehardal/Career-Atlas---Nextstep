import { Request, Response, NextFunction } from 'express';
import { NodeModel, NodeType } from '../models/Node';
import { InstituteCourseMappingModel } from '../models/InstituteCourseMapping';

export class InstituteCourseController {
  /**
   * Create a new mapping record
   */
  static async createMapping(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { institute, degree, entranceExam, specialization, fees, seats } = req.body;

      if (!institute || !degree || !specialization) {
        res.status(400).json({ error: 'Institute, Degree, and Specialization fields are required' });
        return;
      }

      // Verify Institute Node
      const instNode = await NodeModel.findById(institute);
      if (!instNode || instNode.type !== NodeType.Institute) {
        res.status(400).json({ error: 'Referenced Institute node does not exist or is not of type INSTITUTE' });
        return;
      }

      // Verify Degree Node
      const degNode = await NodeModel.findById(degree);
      if (!degNode || degNode.type !== NodeType.Degree) {
        res.status(400).json({ error: 'Referenced Degree node does not exist or is not of type DEGREE' });
        return;
      }

      // Verify Entrance Exam Node (optional)
      if (entranceExam) {
        const examNode = await NodeModel.findById(entranceExam);
        if (!examNode || examNode.type !== NodeType.Exam) {
          res.status(400).json({ error: 'Referenced Entrance Exam node does not exist or is not of type EXAM' });
          return;
        }
      }

      const mapping = new InstituteCourseMappingModel({
        institute,
        degree,
        entranceExam: entranceExam || undefined,
        specialization,
        fees,
        seats
      });

      const savedMapping = await mapping.save();
      const populated = await savedMapping.populate(['institute', 'degree', 'entranceExam']);
      res.status(201).json(populated);
    } catch (error: any) {
      if (error.code === 11000) {
        res.status(400).json({ error: 'A mapping for this institute, degree, and specialization already exists.' });
        return;
      }
      if (error.name === 'ValidationError') {
        res.status(400).json({ error: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * Get mappings with search and filter options
   */
  static async getMappings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { degree, institute, entranceExam, search } = req.query;
      const filter: any = {};

      if (degree) {
        filter.degree = degree;
      }
      if (institute) {
        filter.institute = institute;
      }
      if (entranceExam) {
        filter.entranceExam = entranceExam;
      }

      if (search) {
        const regex = new RegExp(search as string, 'i');
        
        // Optimize search by finding matching nodes of type INSTITUTE, DEGREE or EXAM
        const matchingNodes = await NodeModel.find({
          $or: [
            { name: regex },
            { description: regex }
          ]
        }).select('_id');

        const matchingNodeIds = matchingNodes.map(node => node._id);

        filter.$or = [
          { institute: { $in: matchingNodeIds } },
          { degree: { $in: matchingNodeIds } },
          { entranceExam: { $in: matchingNodeIds } },
          { specialization: regex }
        ];
      }

      const mappings = await InstituteCourseMappingModel.find(filter)
        .populate('institute')
        .populate('degree')
        .populate('entranceExam')
        .sort({ createdAt: -1 });

      res.status(200).json(mappings);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get mapping by ID
   */
  static async getMappingById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const mapping = await InstituteCourseMappingModel.findById(req.params.id)
        .populate('institute')
        .populate('degree')
        .populate('entranceExam');

      if (!mapping) {
        res.status(404).json({ error: 'Institute-Course mapping not found' });
        return;
      }
      res.status(200).json(mapping);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a mapping record
   */
  static async updateMapping(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { entranceExam, specialization, fees, seats } = req.body;

      const mapping = await InstituteCourseMappingModel.findById(id);
      if (!mapping) {
        res.status(404).json({ error: 'Mapping not found' });
        return;
      }

      // Check exam validity if changing
      if (entranceExam) {
        const examNode = await NodeModel.findById(entranceExam);
        if (!examNode || examNode.type !== NodeType.Exam) {
          res.status(400).json({ error: 'Referenced Exam node does not exist or is not of type EXAM' });
          return;
        }
        mapping.entranceExam = entranceExam;
      } else if (entranceExam === null) {
        mapping.entranceExam = undefined;
      }

      if (specialization !== undefined) {
        mapping.specialization = specialization;
      }
      if (fees !== undefined) {
        mapping.fees = fees;
      }
      if (seats !== undefined) {
        mapping.seats = seats;
      }

      const updated = await mapping.save();
      const populated = await updated.populate(['institute', 'degree', 'entranceExam']);
      res.status(200).json(populated);
    } catch (error: any) {
      if (error.code === 11000) {
        res.status(400).json({ error: 'A duplicate course mapping already exists.' });
        return;
      }
      if (error.name === 'ValidationError') {
        res.status(400).json({ error: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * Delete a mapping record
   */
  static async deleteMapping(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const mapping = await InstituteCourseMappingModel.findByIdAndDelete(id);

      if (!mapping) {
        res.status(404).json({ error: 'Mapping not found' });
        return;
      }

      res.status(200).json({ message: 'Institute-Course mapping successfully deleted' });
    } catch (error) {
      next(error);
    }
  }
}
export default InstituteCourseController;
