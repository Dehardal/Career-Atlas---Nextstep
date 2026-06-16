import mongoose from 'mongoose';
import { NodeModel, INode, NodeType } from '../models/Node';
import { RelationshipModel, IRelationship, RelationshipType } from '../models/Relationship';
import { EligibilityService } from './eligibilityService';

export interface RoadmapStep {
  node: INode;
  relationship?: IRelationship;
}

export interface RoadmapPath {
  steps: RoadmapStep[];
}

export class RoadmapEngine {
  /**
   * Traverse outgoing relationships level-by-level using BFS.
   * Returns a map of reachable nodes grouped by their depth/level from the start node.
   */
  static async getBfsTree(
    startNodeId: string,
    maxDepth: number = 6
  ): Promise<Record<number, INode[]>> {
    const startObjId = new mongoose.Types.ObjectId(startNodeId);
    const result: Record<number, INode[]> = {};
    const visited = new Set<string>();
    
    // Queue stores { nodeId: ObjectId, depth: number }
    const queue: Array<{ id: mongoose.Types.ObjectId; depth: number }> = [
      { id: startObjId, depth: 0 }
    ];
    visited.add(startObjId.toString());

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      
      const node = await NodeModel.findById(id);
      if (!node) continue;

      if (!result[depth]) {
        result[depth] = [];
      }
      result[depth].push(node);

      if (depth >= maxDepth) continue;

      // Find all outgoing relationships
      const relationships = await RelationshipModel.find({ fromNode: id });
      
      for (const rel of relationships) {
        const nextIdStr = rel.toNode.toString();
        if (!visited.has(nextIdStr)) {
          visited.add(nextIdStr);
          queue.push({ id: rel.toNode, depth: depth + 1 });
        }
      }
    }

    return result;
  }

  /**
   * Resolves transitions by checking if they are blocked solely by missing exams.
   * If so, returns the steps to insert. Otherwise returns null.
   */
  static async resolveTransitionSteps(
    currentPath: RoadmapStep[],
    nextNode: INode,
    rules: any[]
  ): Promise<RoadmapStep[] | null> {
    const currentPathNodes = currentPath.map((s) => s.node);
    const isDirectlyEligible = EligibilityService.validateTransitionSync(currentPathNodes, nextNode, rules);
    if (isDirectlyEligible) {
      return null;
    }

    const nextNodeId = nextNode._id.toString();
    const pathNodeIds = new Set(currentPathNodes.map((n) => n._id.toString()));

    // 0. Pre-check if any BLOCK rule forbids this transition for any node in the path
    const blockRules = rules.filter((r) => {
      const targetId = typeof r.targetNode === 'string' ? r.targetNode : r.targetNode?._id?.toString();
      return targetId === nextNodeId && r.ruleType === 'BLOCK';
    });
    for (const rule of blockRules) {
      const sourceId = typeof rule.sourceNode === 'string' ? rule.sourceNode : rule.sourceNode?._id?.toString();
      if (pathNodeIds.has(sourceId)) {
        return null; // Explicitly blocked, cannot resolve by inserting exams
      }
    }

    const targetRules = rules.filter((r) => {
      const targetId = typeof r.targetNode === 'string' ? r.targetNode : r.targetNode?._id?.toString();
      return targetId === nextNodeId && r.ruleType === 'ALLOW';
    });

    if (targetRules.length === 0) {
      return null;
    }

    for (const rule of targetRules) {
      const sourceId = typeof rule.sourceNode === 'string' ? rule.sourceNode : rule.sourceNode?._id?.toString();
      if (!pathNodeIds.has(sourceId)) {
        continue;
      }

      if (rule.minimumQualification) {
        const qualNode = rule.minimumQualification as any;
        const qualId = qualNode._id?.toString() || qualNode.toString();
        let hasQual = pathNodeIds.has(qualId);
        const hasSubjectCombination = currentPathNodes.some((n) => n.type === NodeType.SubjectCombination);
        if (!hasQual && qualNode.name && qualNode.name.includes('Class 12') && hasSubjectCombination) {
          hasQual = true;
        }
        if (!hasQual) continue;
      }

      if (rule.mandatorySubjects && rule.mandatorySubjects.length > 0) {
        const pathSubjects = new Set<string>();
        currentPathNodes.forEach((n) => {
          if (n.type === NodeType.SubjectCombination && (n as any).subjects) {
            (n as any).subjects.forEach((sub: string) => pathSubjects.add(sub.toLowerCase().trim()));
          }
        });
        const hasAllMandatory = rule.mandatorySubjects.every((sub: string) => pathSubjects.has(sub.toLowerCase().trim()));
        if (!hasAllMandatory) continue;
      }

      if (rule.entranceExamRequirements && rule.entranceExamRequirements.length > 0) {
        const missingExamIds = rule.entranceExamRequirements.filter((exam: any) => {
          const examId = typeof exam === 'string' ? exam : exam._id?.toString();
          return !pathNodeIds.has(examId);
        });

        if (missingExamIds.length > 0) {
          const examNodes = await NodeModel.find({ _id: { $in: missingExamIds } });
          const insertedSteps: RoadmapStep[] = [];
          let currentSourceNode = currentPath[currentPath.length - 1].node;

          const examRelationships = await RelationshipModel.find({
            fromNode: { $in: [currentSourceNode._id, ...missingExamIds] },
            toNode: { $in: [...missingExamIds, nextNode._id] }
          });

          const orderedExams: INode[] = [];
          const remainingExams = [...examNodes];

          while (remainingExams.length > 0) {
            const nextExamIdx = remainingExams.findIndex((exam) => {
              return !remainingExams.some((other) => {
                if (other._id.toString() === exam._id.toString()) return false;
                return examRelationships.some((r) => 
                  r.fromNode.toString() === other._id.toString() && 
                  r.toNode.toString() === exam._id.toString()
                );
              });
            });

            if (nextExamIdx !== -1) {
              orderedExams.push(remainingExams[nextExamIdx]);
              remainingExams.splice(nextExamIdx, 1);
            } else {
              orderedExams.push(remainingExams.shift()!);
            }
          }

          for (let i = 0; i < orderedExams.length; i++) {
            const examNode = orderedExams[i];
            let rel = examRelationships.find((r) => 
              r.fromNode.toString() === currentSourceNode._id.toString() && 
              r.toNode.toString() === examNode._id.toString()
            );

            if (!rel) {
              rel = new RelationshipModel({
                fromNode: currentSourceNode._id,
                toNode: examNode._id,
                type: RelationshipType.EligibleFor,
                metadata: { description: `Required entrance exam for ${nextNode.name}` }
              }) as any;
            }

            insertedSteps.push({
              node: currentSourceNode,
              relationship: rel
            });

            currentSourceNode = examNode;
          }

          let finalRel = examRelationships.find((r) => 
            r.fromNode.toString() === currentSourceNode._id.toString() && 
            r.toNode.toString() === nextNode._id.toString()
          );

          if (!finalRel) {
            finalRel = new RelationshipModel({
              fromNode: currentSourceNode._id,
              toNode: nextNode._id,
              type: RelationshipType.LeadsTo,
              metadata: { description: `Admission based on exam score` }
            }) as any;
          }

          insertedSteps.push({
            node: currentSourceNode,
            relationship: finalRel
          });

          return insertedSteps;
        }
      }
    }

    return null;
  }

  /**
   * Finds the shortest path (fewest hops) between a start and target node using BFS.
   * Returns an array of node steps and their linking relationships.
   */
  static async findShortestPath(
    fromNodeId: string,
    toNodeId: string
  ): Promise<RoadmapPath | null> {
    const startObjId = new mongoose.Types.ObjectId(fromNodeId);
    const targetObjId = new mongoose.Types.ObjectId(toNodeId);
    const visited = new Set<string>();

    const startNode = await NodeModel.findById(startObjId);
    if (!startNode) return null;

    const rules = await EligibilityService.getAllRulesRaw();

    // Queue stores paths: Array of steps traversed
    const queue: Array<RoadmapStep[]> = [
      [{ node: startNode }]
    ];
    visited.add(startObjId.toString());

    while (queue.length > 0) {
      const currentPath = queue.shift()!;
      const lastStep = currentPath[currentPath.length - 1];
      const currentNodeId = lastStep.node._id as mongoose.Types.ObjectId;

      if (currentNodeId.toString() === targetObjId.toString()) {
        return { steps: currentPath };
      }

      const relationships = await RelationshipModel.find({ fromNode: currentNodeId }).populate('toNode');
      
      for (const rel of relationships) {
        const nextNode = rel.toNode as unknown as INode;
        if (!nextNode) continue;

        // Perform eligibility validation check before pushing to queue
        const currentPathNodes = currentPath.map((step) => step.node);
        const isEligible = EligibilityService.validateTransitionSync(currentPathNodes, nextNode, rules);
        
        let insertedSteps: RoadmapStep[] | null = null;
        if (!isEligible) {
          insertedSteps = await RoadmapEngine.resolveTransitionSteps(currentPath, nextNode, rules);
          if (!insertedSteps) continue;
        }
        
        const nextIdStr = nextNode._id.toString();
        if (!visited.has(nextIdStr)) {
          if (insertedSteps) {
            insertedSteps.forEach((step) => visited.add(step.node._id.toString()));
          }
          visited.add(nextIdStr);
          
          const nextPath = [
            ...currentPath.slice(0, currentPath.length - 1),
            ...(insertedSteps || [{ node: lastStep.node, relationship: rel }]),
            { node: nextNode }
          ];
          
          queue.push(nextPath);
        }
      }
    }

    return null;
  }

  /**
   * Finds all alternative pathways between start and end node using depth-limited DFS.
   * Returns paths sorted by hops count (shortest first).
   */
  static async findAlternativePaths(
    fromNodeId: string,
    toNodeId: string,
    maxDepth: number = 8
  ): Promise<RoadmapPath[]> {
    const startObjId = new mongoose.Types.ObjectId(fromNodeId);
    const targetObjId = new mongoose.Types.ObjectId(toNodeId);
    const results: RoadmapPath[] = [];

    const startNode = await NodeModel.findById(startObjId);
    if (!startNode) return [];

    const rules = await EligibilityService.getAllRulesRaw();

    const dfs = async (
      currentNodeId: mongoose.Types.ObjectId,
      currentSteps: RoadmapStep[],
      visited: Set<string>,
      depth: number
    ) => {
      if (depth > maxDepth) return;

      if (currentNodeId.toString() === targetObjId.toString()) {
        results.push({ steps: [...currentSteps] });
        return;
      }

      visited.add(currentNodeId.toString());

      const relationships = await RelationshipModel.find({ fromNode: currentNodeId }).populate('toNode');

      for (const rel of relationships) {
        const nextNode = rel.toNode as unknown as INode;
        if (!nextNode) continue;

        // Perform eligibility validation check before continuing search branch
        const currentPathNodes = currentSteps.map((step) => step.node);
        const isEligible = EligibilityService.validateTransitionSync(currentPathNodes, nextNode, rules);
        
        let insertedSteps: RoadmapStep[] | null = null;
        if (!isEligible) {
          insertedSteps = await RoadmapEngine.resolveTransitionSteps(currentSteps, nextNode, rules);
          if (!insertedSteps) continue;
        }

        const nextIdStr = nextNode._id.toString();
        if (!visited.has(nextIdStr)) {
          const nextVisited = new Set(visited);
          if (insertedSteps) {
            insertedSteps.forEach((step) => nextVisited.add(step.node._id.toString()));
          }
          nextVisited.add(nextIdStr);

          const stepsWithEdge = [
            ...currentSteps.slice(0, currentSteps.length - 1),
            ...(insertedSteps || [{ node: currentSteps[currentSteps.length - 1].node, relationship: rel }]),
            { node: nextNode }
          ];

          await dfs(
            nextNode._id as mongoose.Types.ObjectId,
            stepsWithEdge,
            nextVisited,
            depth + (insertedSteps ? insertedSteps.length : 1)
          );
        }
      }
    };

    await dfs(startObjId, [{ node: startNode }], new Set<string>(), 0);

    // Sort pathways by path length (shortest paths first)
    return results.sort((a, b) => a.steps.length - b.steps.length);
  }

  /**
   * Career Path Generation.
   * Starts at a given node and finds all reachable pathways that terminate at an OCCUPATION node.
   */
  static async getReachableCareers(
    startNodeId: string,
    maxDepth: number = 8
  ): Promise<RoadmapPath[]> {
    const startObjId = new mongoose.Types.ObjectId(startNodeId);
    const results: RoadmapPath[] = [];

    const startNode = await NodeModel.findById(startObjId);
    if (!startNode) return [];

    const rules = await EligibilityService.getAllRulesRaw();

    const dfs = async (
      currentNodeId: mongoose.Types.ObjectId,
      currentSteps: RoadmapStep[],
      visited: Set<string>,
      depth: number
    ) => {
      if (depth > maxDepth) return;

      const currentNode = currentSteps[currentSteps.length - 1].node;

      // If it terminates at an occupation, capture this path
      if (currentNode.type === NodeType.Occupation) {
        results.push({ steps: [...currentSteps] });
        // We can still continue traversing to check if there are further paths, 
        // but typically occupations are sink nodes in educational pathways.
      }

      visited.add(currentNodeId.toString());

      const relationships = await RelationshipModel.find({ fromNode: currentNodeId }).populate('toNode');

      for (const rel of relationships) {
        const nextNode = rel.toNode as unknown as INode;
        if (!nextNode) continue;

        const currentPathNodes = currentSteps.map((step) => step.node);
        const isEligible = EligibilityService.validateTransitionSync(currentPathNodes, nextNode, rules);
        
        let insertedSteps: RoadmapStep[] | null = null;
        if (!isEligible) {
          insertedSteps = await RoadmapEngine.resolveTransitionSteps(currentSteps, nextNode, rules);
          if (!insertedSteps) continue;
        }

        const nextIdStr = nextNode._id.toString();
        if (!visited.has(nextIdStr)) {
          const nextVisited = new Set(visited);
          if (insertedSteps) {
            insertedSteps.forEach((step) => nextVisited.add(step.node._id.toString()));
          }
          nextVisited.add(nextIdStr);

          const stepsWithEdge = [
            ...currentSteps.slice(0, currentSteps.length - 1),
            ...(insertedSteps || [{ node: currentSteps[currentSteps.length - 1].node, relationship: rel }]),
            { node: nextNode }
          ];

          await dfs(
            nextNode._id as mongoose.Types.ObjectId,
            stepsWithEdge,
            nextVisited,
            depth + (insertedSteps ? insertedSteps.length : 1)
          );
        }
      }
    };

    await dfs(startObjId, [{ node: startNode }], new Set<string>(), 0);
    return results;
  }
}
