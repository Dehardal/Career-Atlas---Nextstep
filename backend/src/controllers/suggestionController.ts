import { Request, Response, NextFunction } from 'express';
import { SuggestionModel, SuggestionStatus, SuggestionType } from '../models/Suggestion';
import { NodeModel, NodeType } from '../models/Node';

export class SuggestionController {
  /**
   * Create a new visitor suggestion (Public)
   */
  static async createSuggestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { visitorName, visitorEmail, type, title, description } = req.body;

      if (!visitorName || !visitorEmail || !type || !title || !description) {
        res.status(400).json({ error: 'All fields are required' });
        return;
      }

      if (!Object.values(SuggestionType).includes(type)) {
        res.status(400).json({ error: 'Invalid suggestion type' });
        return;
      }

      const suggestion = new SuggestionModel({
        visitorName,
        visitorEmail,
        type,
        title,
        description,
        status: SuggestionStatus.Pending,
      });

      const savedSuggestion = await suggestion.save();
      res.status(201).json(savedSuggestion);
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        res.status(400).json({ error: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * Fetch suggestions with filtering and pagination (Admin Only)
   */
  static async getSuggestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, type, page = '1', limit = '20' } = req.query;
      const filter: any = {};

      if (status && Object.values(SuggestionStatus).includes(status as SuggestionStatus)) {
        filter.status = status;
      }

      if (type && Object.values(SuggestionType).includes(type as SuggestionType)) {
        filter.type = type;
      }

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const suggestions = await SuggestionModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      const total = await SuggestionModel.countDocuments(filter);

      res.status(200).json({
        suggestions,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update suggestion status (Admin Only)
   * If approved, it creates the corresponding node in the Database.
   */
  static async updateSuggestionStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status, nodeData } = req.body;

      if (!status || !Object.values(SuggestionStatus).includes(status)) {
        res.status(400).json({ error: 'Invalid or missing status' });
        return;
      }

      const suggestion = await SuggestionModel.findById(id);
      if (!suggestion) {
        res.status(404).json({ error: 'Suggestion not found' });
        return;
      }

      // If already processed, prevent double processing
      if (suggestion.status !== SuggestionStatus.Pending) {
        res.status(400).json({ error: `Suggestion is already ${suggestion.status.toLowerCase()}` });
        return;
      }

      suggestion.status = status;

      let createdNode = null;

      if (status === SuggestionStatus.Approved) {
        // Map SuggestionType to NodeType
        let targetType: NodeType = NodeType.Skill; // default fallback
        
        switch (suggestion.type) {
          case SuggestionType.Qualification:
            targetType = NodeType.Qualification;
            break;
          case SuggestionType.Stream:
            targetType = NodeType.Stream;
            break;
          case SuggestionType.SubjectCombination:
            targetType = NodeType.SubjectCombination;
            break;
          case SuggestionType.Degree:
            targetType = NodeType.Degree;
            break;
          case SuggestionType.Occupation:
            targetType = NodeType.Occupation;
            break;
          case SuggestionType.Exam:
            targetType = NodeType.Exam;
            break;
          case SuggestionType.Institute:
            targetType = NodeType.Institute;
            break;
          case SuggestionType.Other:
          default:
            targetType = NodeType.Skill;
            break;
        }

        // Construct node details, allowing customization from request body
        const finalNodeData = {
          name: nodeData?.name || suggestion.title,
          type: targetType,
          description: nodeData?.description || suggestion.description || `Suggested by visitor: ${suggestion.visitorName}`,
          ...nodeData,
        };

        // Populate required discriminator fields with defaults if not provided
        switch (targetType) {
          case NodeType.Qualification:
            if (finalNodeData.level === undefined) {
              finalNodeData.level = 10;
            }
            break;
          case NodeType.SubjectCombination:
            if (!finalNodeData.subjects || finalNodeData.subjects.length === 0) {
              finalNodeData.subjects = ['General'];
            }
            break;
          case NodeType.Degree:
            if (finalNodeData.durationYears === undefined) {
              finalNodeData.durationYears = 3;
            }
            if (finalNodeData.level === undefined) {
              finalNodeData.level = 'UG';
            }
            break;
          case NodeType.Occupation:
            if (!finalNodeData.averageSalaryRange) {
              finalNodeData.averageSalaryRange = { min: 300000, max: 600000, currency: 'INR' };
            }
            if (finalNodeData.growthRate === undefined) {
              finalNodeData.growthRate = 'MEDIUM';
            }
            if (finalNodeData.sector === undefined) {
              finalNodeData.sector = 'Technology';
            }
            break;
          case NodeType.Exam:
            if (finalNodeData.conductingBody === undefined) {
              finalNodeData.conductingBody = 'NTA';
            }
            if (finalNodeData.frequency === undefined) {
              finalNodeData.frequency = 'ANNUAL';
            }
            break;
          case NodeType.Institute:
            if (!finalNodeData.location) {
              finalNodeData.location = { city: 'Unknown', state: 'Unknown' };
            }
            if (finalNodeData.ownership === undefined) {
              finalNodeData.ownership = 'PRIVATE';
            }
            break;
          case NodeType.Skill:
            if (finalNodeData.category === undefined) {
              finalNodeData.category = 'TECHNICAL';
            }
            break;
          default:
            break;
        }

        const node = new NodeModel(finalNodeData);
        createdNode = await node.save();
      }

      await suggestion.save();

      res.status(200).json({
        message: `Suggestion successfully ${status.toLowerCase()}`,
        suggestion,
        node: createdNode,
      });
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        res.status(400).json({ error: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * Delete Suggestion (Admin Only)
   */
  static async deleteSuggestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const suggestion = await SuggestionModel.findById(id);
      
      if (!suggestion) {
        res.status(404).json({ error: 'Suggestion not found' });
        return;
      }

      await SuggestionModel.deleteOne({ _id: id });
      res.status(200).json({ message: 'Suggestion deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
