import { Request, Response, NextFunction } from 'express';
import { NodeModel, NodeType } from '../models/Node';
import { RelationshipModel } from '../models/Relationship';

export class NodeController {
  /**
   * Create a new node. Resolves the correct discriminator model.
   */
  static async createNode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { type } = req.body;
      if (!type || !Object.values(NodeType).includes(type)) {
        res.status(400).json({ error: 'Invalid or missing node type' });
        return;
      }

      const node = new NodeModel(req.body);
      const savedNode = await node.save();
      res.status(201).json(savedNode);
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        res.status(400).json({ error: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * Fetch nodes with query params (search keyword, type, pagination)
   */
  static async getNodes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { type, search, page = '1', limit = '20' } = req.query;
      const filter: any = {};

      if (type && Object.values(NodeType).includes(type as NodeType)) {
        filter.type = type;
      }

      if (search) {
        filter.$text = { $search: search as string };
      }

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const nodes = await NodeModel.find(filter)
        .skip(skip)
        .limit(limitNum)
        .sort(search ? { score: { $meta: 'textScore' } } : { name: 1 });

      const total = await NodeModel.countDocuments(filter);

      res.status(200).json({
        nodes,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get node by ID
   */
  static async getNodeById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const node = await NodeModel.findById(req.params.id);
      if (!node) {
        res.status(404).json({ error: 'Node not found' });
        return;
      }
      res.status(200).json(node);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update Node
   */
  static async updateNode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      // Prevent updating the type field as it governs the discriminator schema.
      if (req.body.type) {
        delete req.body.type;
      }

      const node = await NodeModel.findById(id);
      if (!node) {
        res.status(404).json({ error: 'Node not found' });
        return;
      }

      // Apply updates
      Object.assign(node, req.body);
      const updatedNode = await node.save();
      res.status(200).json(updatedNode);
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        res.status(400).json({ error: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * Delete node & perform cascade delete on referencing edges (relationships)
   */
  static async deleteNode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const node = await NodeModel.findById(id);
      if (!node) {
        res.status(404).json({ error: 'Node not found' });
        return;
      }

      // Cascade delete relationships referencing this node
      const deletedEdges = await RelationshipModel.deleteMany({
        $or: [
          { fromNode: node._id },
          { toNode: node._id }
        ]
      });

      // Delete the node itself
      await NodeModel.deleteOne({ _id: node._id });

      res.status(200).json({
        message: 'Node and all adjacent relationships deleted successfully',
        cascadeDeletedRelationshipsCount: deletedEdges.deletedCount
      });
    } catch (error) {
      next(error);
    }
  }
}
