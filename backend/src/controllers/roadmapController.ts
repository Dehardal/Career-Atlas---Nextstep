import { Request, Response, NextFunction } from 'express';
import { RoadmapEngine } from '../services/roadmapEngine';
import { NodeModel } from '../models/Node';
import { CacheService } from '../services/cacheService';

export class RoadmapController {
  /**
   * GET /api/v1/roadmaps/bfs/:nodeId?maxDepth=6
   * Traverse outgoing nodes level-by-level starting from nodeId
   */
  static async getBfsTree(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { nodeId } = req.params;
      const { maxDepth } = req.query;

      const nodeExists = await NodeModel.exists({ _id: nodeId });
      if (!nodeExists) {
        res.status(404).json({ error: 'Start node not found' });
        return;
      }

      const depth = maxDepth ? parseInt(maxDepth as string, 10) : 6;
      const bfsTree = await RoadmapEngine.getBfsTree(nodeId, depth);

      res.status(200).json({ bfsTree });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/roadmaps/shortest?fromNodeId=...&toNodeId=...
   * Find the shortest hops pathway between source and destination nodes
   */
  static async getShortestPath(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fromNodeId, toNodeId } = req.query;

      if (!fromNodeId || !toNodeId) {
        res.status(400).json({ error: 'Both fromNodeId and toNodeId are required query parameters' });
        return;
      }

      const fromExists = await NodeModel.exists({ _id: fromNodeId as string });
      const toExists = await NodeModel.exists({ _id: toNodeId as string });

      if (!fromExists || !toExists) {
        res.status(404).json({ error: 'Source or Target node not found' });
        return;
      }

      const path = await RoadmapEngine.findShortestPath(fromNodeId as string, toNodeId as string);

      if (!path) {
        res.status(404).json({ message: 'No pathway connects these nodes' });
        return;
      }

      res.status(200).json({ path });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/roadmaps/alternatives?fromNodeId=...&toNodeId=...&maxDepth=8
   * Discovery of multiple alternative paths sorted by distance
   */
  static async getAlternativePaths(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fromNodeId, toNodeId, maxDepth } = req.query;

      if (!fromNodeId || !toNodeId) {
        res.status(400).json({ error: 'Both fromNodeId and toNodeId are required query parameters' });
        return;
      }

      const fromExists = await NodeModel.exists({ _id: fromNodeId as string });
      const toExists = await NodeModel.exists({ _id: toNodeId as string });

      if (!fromExists || !toExists) {
        res.status(404).json({ error: 'Source or Target node not found' });
        return;
      }

      const depth = maxDepth ? parseInt(maxDepth as string, 10) : 7;

      // 1. Try to read from Cache first
      const cachedPaths = CacheService.get(fromNodeId as string, toNodeId as string, depth);
      if (cachedPaths) {
        res.status(200).json({ paths: cachedPaths });
        return;
      }

      // 2. Compute path dynamically
      const paths = await RoadmapEngine.findAlternativePaths(
        fromNodeId as string,
        toNodeId as string,
        depth
      );

      // 3. Save result to cache
      CacheService.set(fromNodeId as string, toNodeId as string, depth, paths);

      res.status(200).json({ paths });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/roadmaps/careers/:nodeId?maxDepth=8
   * Discover all reachable occupations starting from a given node ID
   */
  static async getReachableCareers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { nodeId } = req.params;
      const { maxDepth } = req.query;

      const nodeExists = await NodeModel.exists({ _id: nodeId });
      if (!nodeExists) {
        res.status(404).json({ error: 'Start node not found' });
        return;
      }

      const depth = maxDepth ? parseInt(maxDepth as string, 10) : 8;
      const careerPaths = await RoadmapEngine.getReachableCareers(nodeId, depth);

      // Extract unique career occupation nodes reached
      const uniqueCareersMap = new Map<string, any>();
      for (const path of careerPaths) {
        const lastStep = path.steps[path.steps.length - 1];
        uniqueCareersMap.set(lastStep.node._id.toString(), lastStep.node);
      }

      res.status(200).json({
        totalPaths: careerPaths.length,
        careersReachableCount: uniqueCareersMap.size,
        careers: Array.from(uniqueCareersMap.values()),
        pathways: careerPaths
      });
    } catch (error) {
      next(error);
    }
  }
}
