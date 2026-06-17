import { Request, Response, NextFunction } from 'express';
import { RelationshipModel, RelationshipType } from '../models/Relationship';
import { NodeModel } from '../models/Node';
import { CacheService } from '../services/cacheService';

export class RelationshipController {
  /**
   * Establish a new relationship between two nodes
   */
  static async createRelationship(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fromNode, toNode, type, metadata } = req.body;

      if (!fromNode || !toNode || !type) {
        res.status(400).json({ error: 'fromNode, toNode, and type are required fields' });
        return;
      }

      if (fromNode === toNode) {
        res.status(400).json({ error: 'A node cannot have a relationship to itself' });
        return;
      }

      if (!Object.values(RelationshipType).includes(type as RelationshipType)) {
        res.status(400).json({ error: `Invalid relationship type: ${type}` });
        return;
      }

      // Check existence of source and destination nodes
      const sourceExists = await NodeModel.exists({ _id: fromNode });
      const targetExists = await NodeModel.exists({ _id: toNode });

      if (!sourceExists || !targetExists) {
        res.status(404).json({ error: 'Source or Target node not found' });
        return;
      }

      // Validate logical direction loop prevention
      if (type === RelationshipType.LeadsTo || type === RelationshipType.CanChoose) {
        const isReachable = await RelationshipModel.findOne({ fromNode: toNode, toNode: fromNode });
        if (isReachable) {
          res.status(400).json({ 
            error: 'Circular dependency detected. This relationship would create a loop.' 
          });
          return;
        }
      }

      const relationship = new RelationshipModel({ fromNode, toNode, type, metadata });
      const savedRelationship = await relationship.save();
      CacheService.clear();
      res.status(201).json(savedRelationship);
    } catch (error: any) {
      if (error.code === 11000) {
        res.status(400).json({ error: 'This relationship already exists between these nodes.' });
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
   * Retrieve relationships with query params
   */
  static async getRelationships(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fromNode, toNode, type } = req.query;
      const query: any = {};

      if (fromNode) query.fromNode = fromNode;
      if (toNode) query.toNode = toNode;
      if (type) query.type = type;

      const relationships = await RelationshipModel.find(query)
        .populate('fromNode')
        .populate('toNode');

      res.status(200).json(relationships);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete relationship by ID
   */
  static async deleteRelationship(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const relationship = await RelationshipModel.findByIdAndDelete(id);
      if (!relationship) {
        res.status(404).json({ error: 'Relationship not found' });
        return;
      }
      CacheService.clear();
      res.status(200).json({ message: 'Relationship deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
