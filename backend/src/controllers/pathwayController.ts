import { Request, Response, NextFunction } from 'express';
import { GraphService } from '../services/graphService';
import { NodeModel } from '../models/Node';

export class PathwayController {
  /**
   * Find all path combinations between two nodes
   * GET /api/v1/pathways/explore?fromNodeId=...&toNodeId=...&maxDepth=6
   */
  static async explorePathway(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fromNodeId, toNodeId, maxDepth } = req.query;

      if (!fromNodeId || !toNodeId) {
        res.status(400).json({ error: 'Both fromNodeId and toNodeId are required query parameters' });
        return;
      }

      // Check existence
      const fromNodeExists = await NodeModel.exists({ _id: fromNodeId as string });
      const toNodeExists = await NodeModel.exists({ _id: toNodeId as string });

      if (!fromNodeExists || !toNodeExists) {
        res.status(404).json({ error: 'Source or Target node not found' });
        return;
      }

      const depth = maxDepth ? parseInt(maxDepth as string, 10) : 6;
      const paths = await GraphService.findAllPaths(
        fromNodeId as string,
        toNodeId as string,
        depth
      );

      res.status(200).json({ paths });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fetch immediate next options for a specific node state
   * GET /api/v1/pathways/next-steps/:nodeId
   */
  static async getNextSteps(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { nodeId } = req.params;
      const node = await NodeModel.findById(nodeId);

      if (!node) {
        res.status(404).json({ error: 'Node not found' });
        return;
      }

      const neighbors = await GraphService.getNeighbors(nodeId, 'out');
      
      const formattedOptions = neighbors.map(({ edge, node }) => ({
        relationship: edge.type,
        edgeId: edge._id,
        metadata: edge.metadata,
        node: {
          id: node._id,
          name: node.name,
          type: node.type,
          description: node.description,
          details: node // Sends the remaining type-specific properties (polymorphic fields)
        }
      }));

      res.status(200).json({
        currentNode: {
          id: node._id,
          name: node.name,
          type: node.type
        },
        options: formattedOptions
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fetch the complete reachable network of options from a node (using $graphLookup)
   * GET /api/v1/pathways/subgraph/:nodeId?maxDepth=5
   */
  static async exploreSubgraph(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { nodeId } = req.params;
      const { maxDepth } = req.query;

      const nodeExists = await NodeModel.exists({ _id: nodeId });
      if (!nodeExists) {
        res.status(404).json({ error: 'Start node not found' });
        return;
      }

      const depth = maxDepth ? parseInt(maxDepth as string, 10) : 5;
      const subgraph = await GraphService.getReachableNodes(nodeId, depth);

      res.status(200).json(subgraph);
    } catch (error) {
      next(error);
    }
  }
}
