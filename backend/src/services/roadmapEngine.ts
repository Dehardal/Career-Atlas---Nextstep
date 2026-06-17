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

interface InMemoryGraph {
  nodes: Map<string, INode>;
  outgoing: Map<string, IRelationship[]>;
  incoming: Map<string, IRelationship[]>;
}

export class RoadmapEngine {
  private static cachedGraph: InMemoryGraph | null = null;
  private static cachedRules: Map<string, any[]> | null = null;

  /**
   * Clears the globally cached graph and rules in memory
   */
  public static clearGraphCache(): void {
    RoadmapEngine.cachedGraph = null;
    RoadmapEngine.cachedRules = null;
    console.log('RoadmapEngine cached graph and rules cleared.');
  }

  /**
   * Helper to load the entire graph from MongoDB into memory
   */
  static async loadGraphInMemory(): Promise<InMemoryGraph> {
    if (RoadmapEngine.cachedGraph) {
      return RoadmapEngine.cachedGraph;
    }

    const nodesList = await NodeModel.find({});
    const relsList = await RelationshipModel.find({});
    
    const nodes = new Map<string, INode>();
    const outgoing = new Map<string, IRelationship[]>();
    const incoming = new Map<string, IRelationship[]>();
    
    for (const node of nodesList) {
      nodes.set(node._id.toString(), node);
    }
    
    for (const rel of relsList) {
      const fromId = rel.fromNode.toString();
      const toId = rel.toNode.toString();
      
      if (!outgoing.has(fromId)) {
        outgoing.set(fromId, []);
      }
      outgoing.get(fromId)!.push(rel);
      
      if (!incoming.has(toId)) {
        incoming.set(toId, []);
      }
      incoming.get(toId)!.push(rel);
    }
    
    RoadmapEngine.cachedGraph = { nodes, outgoing, incoming };
    return RoadmapEngine.cachedGraph;
  }

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
   * This is fully synchronous using the preloaded in-memory graph.
   */
  static resolveTransitionStepsSync(
    currentPath: RoadmapStep[],
    nextNode: INode,
    rules: any[] | Map<string, any[]>,
    graph: InMemoryGraph
  ): RoadmapStep[] | null {
    const currentPathNodes = currentPath.map((s) => s.node);
    const isDirectlyEligible = EligibilityService.validateTransitionSync(currentPathNodes, nextNode, rules);
    if (isDirectlyEligible) {
      return null;
    }

    const nextNodeId = nextNode._id.toString();
    const pathNodeIds = new Set(currentPathNodes.map((n) => n._id.toString()));

    // 0. Pre-check if any BLOCK rule forbids this transition for any node in the path
    let targetRules: any[];
    if (rules instanceof Map) {
      targetRules = rules.get(nextNodeId) || [];
    } else {
      targetRules = rules.filter((r) => {
        const targetId = typeof r.targetNode === 'string' ? r.targetNode : r.targetNode?._id?.toString();
        return targetId === nextNodeId;
      });
    }

    const blockRules = targetRules.filter((r) => r.ruleType === 'BLOCK');
    for (const rule of blockRules) {
      const sourceId = typeof rule.sourceNode === 'string' ? rule.sourceNode : rule.sourceNode?._id?.toString();
      if (pathNodeIds.has(sourceId)) {
        return null; // Explicitly blocked, cannot resolve by inserting exams
      }
    }

    const allowRules = targetRules.filter((r) => r.ruleType === 'ALLOW');

    if (allowRules.length === 0) {
      return null;
    }

    for (const rule of allowRules) {
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
          const examNodes = missingExamIds
            .map((id: any) => graph.nodes.get(id.toString() || id))
            .filter(Boolean) as INode[];
            
          let currentSourceNode = currentPath[currentPath.length - 1].node;

          const searchNodeIds = new Set([
            currentSourceNode._id.toString(),
            ...missingExamIds.map((id: any) => id.toString() || id)
          ]);
          const targetNodeIds = new Set([
            ...missingExamIds.map((id: any) => id.toString() || id),
            nextNode._id.toString()
          ]);

          const examRelationships: IRelationship[] = [];
          for (const fromId of searchNodeIds) {
            const rels = graph.outgoing.get(fromId) || [];
            for (const r of rels) {
              if (targetNodeIds.has(r.toNode.toString())) {
                examRelationships.push(r);
              }
            }
          }

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

          const insertedSteps: RoadmapStep[] = [];
          
          for (let i = 0; i < orderedExams.length; i++) {
            const examNode = orderedExams[i];
            let rel = examRelationships.find((r) => 
              r.fromNode.toString() === currentSourceNode._id.toString() && 
              r.toNode.toString() === examNode._id.toString()
            );

            if (!rel) {
              rel = {
                _id: new mongoose.Types.ObjectId().toString(),
                fromNode: currentSourceNode._id,
                toNode: examNode._id,
                type: RelationshipType.EligibleFor,
                metadata: { description: `Required entrance exam for ${nextNode.name}` }
              } as any;
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
            finalRel = {
              _id: new mongoose.Types.ObjectId().toString(),
              fromNode: currentSourceNode._id,
              toNode: nextNode._id,
              type: RelationshipType.LeadsTo,
              metadata: { description: `Admission based on exam score` }
            } as any;
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

  static async loadRulesIndexed(): Promise<Map<string, any[]>> {
    if (RoadmapEngine.cachedRules) {
      return RoadmapEngine.cachedRules;
    }
    const rawRules = await EligibilityService.getAllRulesRaw();
    const rulesMap = new Map<string, any[]>();
    for (const rule of rawRules) {
      const targetId = typeof rule.targetNode === 'string' 
        ? rule.targetNode 
        : (rule.targetNode as any)._id?.toString() || rule.targetNode.toString();
      if (!rulesMap.has(targetId)) {
        rulesMap.set(targetId, []);
      }
      rulesMap.get(targetId)!.push(rule);
    }
    RoadmapEngine.cachedRules = rulesMap;
    return RoadmapEngine.cachedRules;
  }

  /**
   * Backward-compatible async wrapper to resolve transition steps using preloaded graph.
   */
  static async resolveTransitionSteps(
    currentPath: RoadmapStep[],
    nextNode: INode,
    rules: any[]
  ): Promise<RoadmapStep[] | null> {
    const graph = await RoadmapEngine.loadGraphInMemory();
    const rulesMap = new Map<string, any[]>();
    for (const rule of rules) {
      const targetId = typeof rule.targetNode === 'string' 
        ? rule.targetNode 
        : (rule.targetNode as any)._id?.toString() || rule.targetNode.toString();
      if (!rulesMap.has(targetId)) {
        rulesMap.set(targetId, []);
      }
      rulesMap.get(targetId)!.push(rule);
    }
    return RoadmapEngine.resolveTransitionStepsSync(currentPath, nextNode, rulesMap, graph);
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

    const graph = await RoadmapEngine.loadGraphInMemory();

    const startNode = graph.nodes.get(startObjId.toString());
    if (!startNode) return null;

    const rules = await RoadmapEngine.loadRulesIndexed();

    const queue: Array<RoadmapStep[]> = [
      [{ node: startNode }]
    ];
    visited.add(startObjId.toString());

    while (queue.length > 0) {
      const currentPath = queue.shift()!;
      const lastStep = currentPath[currentPath.length - 1];
      const currentNodeId = lastStep.node._id.toString();

      if (currentNodeId === targetObjId.toString()) {
        return { steps: currentPath };
      }

      const relationships = graph.outgoing.get(currentNodeId) || [];
      
      for (const rel of relationships) {
        const nextNodeId = rel.toNode.toString();
        const nextNode = graph.nodes.get(nextNodeId);
        if (!nextNode) continue;

        const currentPathNodes = currentPath.map((step) => step.node);
        const isEligible = EligibilityService.validateTransitionSync(currentPathNodes, nextNode, rules);
        
        let insertedSteps: RoadmapStep[] | null = null;
        if (!isEligible) {
          insertedSteps = RoadmapEngine.resolveTransitionStepsSync(currentPath, nextNode, rules, graph);
          if (!insertedSteps) continue;
        }
        
        if (!visited.has(nextNodeId)) {
          if (insertedSteps) {
            insertedSteps.forEach((step) => visited.add(step.node._id.toString()));
          }
          visited.add(nextNodeId);
          
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
    maxDepth: number = 7
  ): Promise<RoadmapPath[]> {
    const startObjId = new mongoose.Types.ObjectId(fromNodeId);
    const targetObjId = new mongoose.Types.ObjectId(toNodeId);
    
    const graph = await RoadmapEngine.loadGraphInMemory();
    
    const startNode = graph.nodes.get(startObjId.toString());
    if (!startNode) return [];
    
    const rules = await RoadmapEngine.loadRulesIndexed();
    const results: RoadmapPath[] = [];

    const dfs = (
      currentNodeId: string,
      currentSteps: RoadmapStep[],
      visited: Set<string>,
      depth: number
    ) => {
      if (depth > maxDepth) return;

      if (currentNodeId === targetObjId.toString()) {
        results.push({ steps: [...currentSteps] });
        return;
      }

      visited.add(currentNodeId);

      const relationships = graph.outgoing.get(currentNodeId) || [];

      for (const rel of relationships) {
        const nextNodeId = rel.toNode.toString();
        const nextNode = graph.nodes.get(nextNodeId);
        if (!nextNode) continue;

        const currentPathNodes = currentSteps.map((step) => step.node);
        const isEligible = EligibilityService.validateTransitionSync(currentPathNodes, nextNode, rules);
        
        let insertedSteps: RoadmapStep[] | null = null;
        if (!isEligible) {
          insertedSteps = RoadmapEngine.resolveTransitionStepsSync(currentSteps, nextNode, rules, graph);
          if (!insertedSteps) continue;
        }

        if (!visited.has(nextNodeId)) {
          const nextVisited = new Set(visited);
          if (insertedSteps) {
            insertedSteps.forEach((step) => nextVisited.add(step.node._id.toString()));
          }
          nextVisited.add(nextNodeId);

          const stepsWithEdge = [
            ...currentSteps.slice(0, currentSteps.length - 1),
            ...(insertedSteps || [{ node: currentSteps[currentSteps.length - 1].node, relationship: rel }]),
            { node: nextNode }
          ];

          dfs(
            nextNodeId,
            stepsWithEdge,
            nextVisited,
            depth + (insertedSteps ? insertedSteps.length : 1)
          );
        }
      }
    };

    dfs(startObjId.toString(), [{ node: startNode }], new Set<string>(), 0);

    return results.sort((a, b) => a.steps.length - b.steps.length);
  }

  /**
   * Career Path Generation.
   * Starts at a given node and finds all reachable pathways that terminate at an OCCUPATION node.
   */
  static async getReachableCareers(
    startNodeId: string,
    maxDepth: number = 7
  ): Promise<RoadmapPath[]> {
    const startObjId = new mongoose.Types.ObjectId(startNodeId);
    
    const graph = await RoadmapEngine.loadGraphInMemory();
    
    const startNode = graph.nodes.get(startObjId.toString());
    if (!startNode) return [];

    const rules = await RoadmapEngine.loadRulesIndexed();
    const results: RoadmapPath[] = [];

    const dfs = (
      currentNodeId: string,
      currentSteps: RoadmapStep[],
      visited: Set<string>,
      depth: number
    ) => {
      if (depth > maxDepth) return;

      const currentNode = currentSteps[currentSteps.length - 1].node;

      if (currentNode.type === NodeType.Occupation) {
        results.push({ steps: [...currentSteps] });
      }

      visited.add(currentNodeId);

      const relationships = graph.outgoing.get(currentNodeId) || [];

      for (const rel of relationships) {
        const nextNodeId = rel.toNode.toString();
        const nextNode = graph.nodes.get(nextNodeId);
        if (!nextNode) continue;

        const currentPathNodes = currentSteps.map((step) => step.node);
        const isEligible = EligibilityService.validateTransitionSync(currentPathNodes, nextNode, rules);
        
        let insertedSteps: RoadmapStep[] | null = null;
        if (!isEligible) {
          insertedSteps = RoadmapEngine.resolveTransitionStepsSync(currentSteps, nextNode, rules, graph);
          if (!insertedSteps) continue;
        }

        if (!visited.has(nextNodeId)) {
          const nextVisited = new Set(visited);
          if (insertedSteps) {
            insertedSteps.forEach((step) => nextVisited.add(step.node._id.toString()));
          }
          nextVisited.add(nextNodeId);

          const stepsWithEdge = [
            ...currentSteps.slice(0, currentSteps.length - 1),
            ...(insertedSteps || [{ node: currentSteps[currentSteps.length - 1].node, relationship: rel }]),
            { node: nextNode }
          ];

          dfs(
            nextNodeId,
            stepsWithEdge,
            nextVisited,
            depth + (insertedSteps ? insertedSteps.length : 1)
          );
        }
      }
    };

    dfs(startObjId.toString(), [{ node: startNode }], new Set<string>(), 0);
    return results;
  }
}
