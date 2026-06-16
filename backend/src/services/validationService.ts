import mongoose from 'mongoose';
import { NodeModel, NodeType, INode } from '../models/Node';
import { RelationshipModel, IRelationship } from '../models/Relationship';
import { EligibilityService } from './eligibilityService';

export interface ValidationIssue {
  type: 
    | 'BROKEN_RELATIONSHIP'
    | 'CIRCULAR_RELATIONSHIP'
    | 'INVALID_DEGREE_PATHWAY'
    | 'MISSING_ENTRANCE_EXAM_RELATION'
    | 'MISSING_ELIGIBILITY_RULE'
    | 'DUPLICATE_CAREER'
    | 'DUPLICATE_INSTITUTE';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  details?: any;
}

export interface ValidationReport {
  summary: {
    totalIssues: number;
    brokenRelationships: number;
    circularRelationships: number;
    invalidDegreePathways: number;
    missingEntranceExams: number;
    missingEligibilityRules: number;
    duplicateCareers: number;
    duplicateInstitutes: number;
  };
  issues: ValidationIssue[];
}

export class ValidationService {
  static async runDiagnostics(): Promise<ValidationReport> {
    const issues: ValidationIssue[] = [];

    // Load nodes and relationships once to minimize DB queries
    const allNodes = await NodeModel.find();
    const allRelationships = await RelationshipModel.find();
    const rules = await EligibilityService.getAllRulesRaw();

    const nodeIds = new Set(allNodes.map(n => n._id.toString()));
    const nodeMap = new Map<string, INode>(allNodes.map(n => [n._id.toString(), n]));

    // --- 1. DETECT BROKEN RELATIONSHIPS ---
    for (const rel of allRelationships) {
      const fromStr = rel.fromNode.toString();
      const toStr = rel.toNode.toString();

      if (!nodeIds.has(fromStr)) {
        issues.push({
          type: 'BROKEN_RELATIONSHIP',
          severity: 'CRITICAL',
          message: `Relationship of type '${rel.type}' (${rel._id}) points from a non-existent node ID: '${rel.fromNode}'.`,
          details: { relationshipId: rel._id, fromNode: rel.fromNode, toNode: rel.toNode }
        });
      }

      if (!nodeIds.has(toStr)) {
        issues.push({
          type: 'BROKEN_RELATIONSHIP',
          severity: 'CRITICAL',
          message: `Relationship of type '${rel.type}' (${rel._id}) points to a non-existent node ID: '${rel.toNode}'.`,
          details: { relationshipId: rel._id, fromNode: rel.fromNode, toNode: rel.toNode }
        });
      }
    }

    // --- 2. DETECT CIRCULAR RELATIONSHIPS (Cycles in Career Path Graph) ---
    // Construct adjacency list
    const adjacency: Record<string, string[]> = {};
    for (const rel of allRelationships) {
      const fromStr = rel.fromNode.toString();
      const toStr = rel.toNode.toString();
      // Only trace cycles through valid nodes
      if (nodeIds.has(fromStr) && nodeIds.has(toStr)) {
        if (!adjacency[fromStr]) adjacency[fromStr] = [];
        adjacency[fromStr].push(toStr);
      }
    }

    const visited = new Set<string>();
    const recStack = new Set<string>();
    const cycles: string[][] = [];

    const detectCyclesDfs = (node: string, currentPath: string[]) => {
      visited.add(node);
      recStack.add(node);
      currentPath.push(node);

      const neighbors = adjacency[node] || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          detectCyclesDfs(neighbor, [...currentPath]);
        } else if (recStack.has(neighbor)) {
          const startIdx = currentPath.indexOf(neighbor);
          if (startIdx !== -1) {
            cycles.push(currentPath.slice(startIdx));
          }
        }
      }

      recStack.delete(node);
    };

    for (const nodeId of nodeIds) {
      if (!visited.has(nodeId)) {
        detectCyclesDfs(nodeId, []);
      }
    }

    // Filter unique cycles to prevent duplicate reporting
    const reportedCycles = new Set<string>();
    for (const cycle of cycles) {
      // Sort cycle elements to normalize order (e.g. A->B->A is same cycle as B->A->B)
      const normalizedKey = [...cycle].sort().join(',');
      if (!reportedCycles.has(normalizedKey)) {
        reportedCycles.add(normalizedKey);
        const names = cycle.map(id => nodeMap.get(id)?.name || id);
        issues.push({
          type: 'CIRCULAR_RELATIONSHIP',
          severity: 'HIGH',
          message: `Circular reference detected in path: ${names.join(' → ')} $\rightarrow$ ${names[0]}.`,
          details: { cycle }
        });
      }
    }

    // --- 3. DETECT INVALID DEGREE PATHWAYS ---
    // Check if any direct LeadsTo or EligibleFor edges to a Degree node are blocked by eligibility rules
    for (const rel of allRelationships) {
      const fromStr = rel.fromNode.toString();
      const toStr = rel.toNode.toString();

      if (nodeIds.has(fromStr) && nodeIds.has(toStr)) {
        const fromNode = nodeMap.get(fromStr)!;
        const toNode = nodeMap.get(toStr)!;

        if (toNode.type === NodeType.Degree && rel.type !== 'OFFERS') {
          // Build a simulated path containing fromNode and its ancestors to satisfy eligibility rules
          let pathNodes = [fromNode];
          const visitedAncestors = new Set<string>([fromStr]);
          const queue = [fromStr];
          while (queue.length > 0) {
            const currId = queue.shift()!;
            const incoming = allRelationships.filter(r => r.toNode.toString() === currId);
            for (const relIn of incoming) {
              const parentIdStr = relIn.fromNode.toString();
              if (!visitedAncestors.has(parentIdStr) && nodeIds.has(parentIdStr)) {
                visitedAncestors.add(parentIdStr);
                pathNodes.push(nodeMap.get(parentIdStr)!);
                queue.push(parentIdStr);
              }
            }
          }

          // Split by stream to test eligibility under individual stream contexts
          const streamsInPath = pathNodes.filter(n => n.type === NodeType.Stream);
          let isEligible = false;

          if (streamsInPath.length > 1) {
            // Test each stream separately
            for (const streamNode of streamsInPath) {
              const streamIdStr = streamNode._id.toString();
              // Find combinations offered by this stream
              const offeredCombIds = new Set<string>();
              allRelationships.forEach(r => {
                if (r.type === 'OFFERS' && r.fromNode.toString() === streamIdStr) {
                  offeredCombIds.add(r.toNode.toString());
                }
              });

              // Filter pathNodes for this specific stream context
              const filteredPathNodes = pathNodes.filter(n => {
                if (n.type === NodeType.Stream) {
                  return n._id.toString() === streamIdStr;
                }
                if (n.type === NodeType.SubjectCombination) {
                  return offeredCombIds.has(n._id.toString());
                }
                return true;
              });

              if (EligibilityService.validateTransitionSync(filteredPathNodes, toNode, rules)) {
                isEligible = true;
                break;
              }
            }
          } else {
            isEligible = EligibilityService.validateTransitionSync(pathNodes, toNode, rules);
          }

          if (!isEligible) {
            issues.push({
              type: 'INVALID_DEGREE_PATHWAY',
              severity: 'MEDIUM',
              message: `Transition path from '${fromNode.name}' to '${toNode.name}' is blocked by eligibility rules, despite a direct relationship edge in the graph.`,
              details: { relationshipId: rel._id, fromNode: fromNode.name, toNode: toNode.name }
            });
          }
        }
      }
    }

    // --- 4. DETECT MISSING ENTRANCE EXAM RELATIONS ---
    // Exams should have both incoming and outgoing relationships
    const examNodes = allNodes.filter(n => n.type === NodeType.Exam);
    for (const exam of examNodes) {
      const examIdStr = exam._id.toString();
      const hasIncoming = allRelationships.some(r => r.toNode.toString() === examIdStr);
      const hasOutgoing = allRelationships.some(r => r.fromNode.toString() === examIdStr);

      if (!hasIncoming) {
        issues.push({
          type: 'MISSING_ENTRANCE_EXAM_RELATION',
          severity: 'MEDIUM',
          message: `Entrance Exam '${exam.name}' has no incoming relationships (no streams or subject combinations are eligible to take this exam).`,
          details: { examId: exam._id, examName: exam.name }
        });
      }

      if (!hasOutgoing) {
        issues.push({
          type: 'MISSING_ENTRANCE_EXAM_RELATION',
          severity: 'MEDIUM',
          message: `Entrance Exam '${exam.name}' has no outgoing relationships (this exam does not lead to any degrees).`,
          details: { examId: exam._id, examName: exam.name }
        });
      }
    }

    // --- 5. DETECT MISSING ELIGIBILITY RULES ---
    // Every Degree and Occupation node should have at least one eligibility rule targeting it
    const degreesAndCareers = allNodes.filter(n => 
      n.type === NodeType.Degree || n.type === NodeType.Occupation
    );
    const ruleTargets = new Set(rules.map(r => r.targetNode.toString()));

    for (const node of degreesAndCareers) {
      const idStr = node._id.toString();
      if (!ruleTargets.has(idStr)) {
        issues.push({
          type: 'MISSING_ELIGIBILITY_RULE',
          severity: 'LOW',
          message: `No eligibility rules target the ${node.type.toLowerCase()} node '${node.name}'.`,
          details: { nodeId: node._id, name: node.name, type: node.type }
        });
      }
    }

    // --- 6. DETECT DUPLICATE CAREERS ---
    const careerNodes = allNodes.filter(n => n.type === NodeType.Occupation);
    const careerMap = new Map<string, string[]>();
    for (const c of careerNodes) {
      const nameKey = c.name.toLowerCase().trim();
      if (!careerMap.has(nameKey)) careerMap.set(nameKey, []);
      careerMap.get(nameKey)!.push(c._id.toString());
    }

    for (const [name, ids] of careerMap) {
      if (ids.length > 1) {
        issues.push({
          type: 'DUPLICATE_CAREER',
          severity: 'LOW',
          message: `Duplicate Occupation name detected: '${name}' (Found ${ids.length} node instances).`,
          details: { name, ids }
        });
      }
    }

    // --- 7. DETECT DUPLICATE INSTITUTES ---
    const instituteNodes = allNodes.filter(n => n.type === NodeType.Institute);
    const instMap = new Map<string, string[]>();
    for (const inst of instituteNodes) {
      const nameKey = inst.name.toLowerCase().trim();
      if (!instMap.has(nameKey)) instMap.set(nameKey, []);
      instMap.get(nameKey)!.push(inst._id.toString());
    }

    for (const [name, ids] of instMap) {
      if (ids.length > 1) {
        issues.push({
          type: 'DUPLICATE_INSTITUTE',
          severity: 'LOW',
          message: `Duplicate Institute name detected: '${name}' (Found ${ids.length} node instances).`,
          details: { name, ids }
        });
      }
    }

    // --- SUMMARY CALCULATIONS ---
    const summary = {
      totalIssues: issues.length,
      brokenRelationships: issues.filter(i => i.type === 'BROKEN_RELATIONSHIP').length,
      circularRelationships: issues.filter(i => i.type === 'CIRCULAR_RELATIONSHIP').length,
      invalidDegreePathways: issues.filter(i => i.type === 'INVALID_DEGREE_PATHWAY').length,
      missingEntranceExams: issues.filter(i => i.type === 'MISSING_ENTRANCE_EXAM_RELATION').length,
      missingEligibilityRules: issues.filter(i => i.type === 'MISSING_ELIGIBILITY_RULE').length,
      duplicateCareers: issues.filter(i => i.type === 'DUPLICATE_CAREER').length,
      duplicateInstitutes: issues.filter(i => i.type === 'DUPLICATE_INSTITUTE').length
    };

    return {
      summary,
      issues
    };
  }
}
export default ValidationService;
