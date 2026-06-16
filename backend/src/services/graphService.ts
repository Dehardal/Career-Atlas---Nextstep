import mongoose from 'mongoose';
import { NodeModel, INode } from '../models/Node';
import { RelationshipModel, IRelationship, RelationshipType } from '../models/Relationship';

export interface PathStep {
  node: INode;
  relationship?: RelationshipType;
}

export interface FullPath {
  steps: INode[];
  relationships: RelationshipType[];
}

export class GraphService {
  /**
   * Fetch immediate neighbors of a node (incoming or outgoing)
   */
  static async getNeighbors(
    nodeId: string,
    direction: 'out' | 'in' = 'out'
  ): Promise<Array<{ edge: IRelationship; node: INode }>> {
    const nodeObjId = new mongoose.Types.ObjectId(nodeId);
    
    if (direction === 'out') {
      const edges = await RelationshipModel.find({ fromNode: nodeObjId }).populate('toNode');
      return edges.map(edge => ({
        edge,
        node: edge.toNode as unknown as INode
      }));
    } else {
      const edges = await RelationshipModel.find({ toNode: nodeObjId }).populate('fromNode');
      return edges.map(edge => ({
        edge,
        node: edge.fromNode as unknown as INode
      }));
    }
  }

  /**
   * Find all path pathways between fromNodeId and toNodeId using a depth-limited Depth First Search.
   * Prevents cycles and enforces a depth limit (default 6) for safety.
   */
  static async findAllPaths(
    fromNodeId: string,
    toNodeId: string,
    maxDepth: number = 6
  ): Promise<FullPath[]> {
    const startId = fromNodeId.toString();
    const endId = toNodeId.toString();
    const results: FullPath[] = [];

    // Helper DFS function
    const dfs = async (
      currentNodeId: string,
      targetId: string,
      currentPathNodes: INode[],
      currentRelationships: RelationshipType[],
      visited: Set<string>,
      depth: number
    ) => {
      if (depth > maxDepth) return;
      
      const node = await NodeModel.findById(currentNodeId);
      if (!node) return;

      const pathNodes = [...currentPathNodes, node];
      
      if (currentNodeId === targetId) {
        results.push({
          steps: pathNodes,
          relationships: [...currentRelationships]
        });
        return;
      }

      visited.add(currentNodeId);

      // Find all outgoing edges from the current node
      const edges = await RelationshipModel.find({ fromNode: new mongoose.Types.ObjectId(currentNodeId) });

      for (const edge of edges) {
        const nextNodeId = edge.toNode.toString();
        if (!visited.has(nextNodeId)) {
          await dfs(
            nextNodeId,
            targetId,
            pathNodes,
            [...currentRelationships, edge.type],
            new Set(visited), // Pass copy of visited set to allow branch exploration
            depth + 1
          );
        }
      }
    };

    await dfs(startId, endId, [], [], new Set<string>(), 0);
    return results;
  }

  /**
   * Performs recursive graph lookup to find all nodes reachable from a start node.
   * Done entirely in MongoDB utilizing $graphLookup on relationships collection.
   */
  static async getReachableNodes(startNodeId: string, maxDepth: number = 5): Promise<any> {
    const startObjId = new mongoose.Types.ObjectId(startNodeId);

    const aggregation = await RelationshipModel.aggregate([
      // 1. Start with outgoing relationships from startNodeId
      { $match: { fromNode: startObjId } },
      
      // 2. Perform graph lookup recursively on relationships collection
      {
        $graphLookup: {
          from: 'relationships',        // Target collection in MongoDB
          startWith: '$toNode',
          connectFromField: 'toNode',
          connectToField: 'fromNode',
          as: 'traversedEdges',
          maxDepth: maxDepth,
          depthField: 'hops'
        }
      }
    ]);

    if (!aggregation.length) {
      return { nodes: [], edges: [] };
    }

    // Extract all node IDs involved
    const nodeIds = new Set<string>();
    nodeIds.add(startNodeId);

    const edgesList: any[] = [];

    // Add first level edges
    for (const topEdge of aggregation) {
      nodeIds.add(topEdge.fromNode.toString());
      nodeIds.add(topEdge.toNode.toString());
      edgesList.push({
        id: topEdge._id,
        fromNode: topEdge.fromNode,
        toNode: topEdge.toNode,
        type: topEdge.type,
        metadata: topEdge.metadata
      });

      // Add recursively traversed edges
      for (const travEdge of topEdge.traversedEdges) {
        nodeIds.add(travEdge.fromNode.toString());
        nodeIds.add(travEdge.toNode.toString());
        edgesList.push({
          id: travEdge._id,
          fromNode: travEdge.fromNode,
          toNode: travEdge.toNode,
          type: travEdge.type,
          metadata: travEdge.metadata
        });
      }
    }

    // Fetch the detailed nodes using the IDs found
    const nodes = await NodeModel.find({ _id: { $in: Array.from(nodeIds).map(id => new mongoose.Types.ObjectId(id)) } });

    // Deduplicate edges list
    const uniqueEdgesMap = new Map<string, any>();
    for (const edge of edgesList) {
      uniqueEdgesMap.set(edge.id.toString(), edge);
    }

    return {
      nodes,
      edges: Array.from(uniqueEdgesMap.values())
    };
  }
}
