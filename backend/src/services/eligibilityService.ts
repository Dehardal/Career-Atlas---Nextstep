import mongoose from 'mongoose';
import { EligibilityRuleModel, IEligibilityRule, RuleType } from '../models/EligibilityRule';
import { INode, NodeType } from '../models/Node';

export class EligibilityService {
  /**
   * Synchronously validates if transiting to nextNode is allowed based on the preceding path and rules.
   * Designed for high-performance in-memory matching during graph traversals.
   */
  static validateTransitionSync(
    currentPathNodes: INode[],
    nextNode: INode,
    rules: IEligibilityRule[] | Map<string, IEligibilityRule[]>
  ): boolean {
    const nextNodeId = nextNode._id.toString();
    const pathNodeIds = new Set(currentPathNodes.map((n) => n._id.toString()));

    // Collect all subjects accumulated in the path combination nodes
    const pathSubjects = new Set<string>();
    let hasSubjectCombination = false;
    currentPathNodes.forEach((n) => {
      if (n.type === NodeType.SubjectCombination) {
        hasSubjectCombination = true;
        if ((n as any).subjects) {
          (n as any).subjects.forEach((sub: string) => {
            pathSubjects.add(sub.toLowerCase().trim());
          });
        }
      }
    });

    // Get all rules targeting the nextNode
    let targetRules: IEligibilityRule[];
    if (rules instanceof Map) {
      targetRules = (rules as Map<string, IEligibilityRule[]>).get(nextNodeId) || [];
    } else {
      targetRules = (rules as IEligibilityRule[]).filter((rule) => {
        const targetId = typeof rule.targetNode === 'string' 
          ? rule.targetNode 
          : (rule.targetNode as any)._id?.toString() || rule.targetNode.toString();
        return targetId === nextNodeId;
      });
    }

    // If no rules are defined for this target node, it is allowed by default
    if (targetRules.length === 0) {
      return true;
    }

    // 1. Process BLOCK rules first (Blacklist has top priority)
    const blockRules = targetRules.filter((rule) => rule.ruleType === RuleType.Block);
    for (const rule of blockRules) {
      const sourceId = typeof rule.sourceNode === 'string' 
        ? rule.sourceNode 
        : (rule.sourceNode as any)._id?.toString() || rule.sourceNode.toString();
      
      if (pathNodeIds.has(sourceId)) {
        // Prerequisite is in the path, so this transition is explicitly blocked!
        return false;
      }
    }

    // 2. Process ALLOW rules (Whitelist validation)
    const allowRules = targetRules.filter((rule) => rule.ruleType === RuleType.Allow);
    
    // If rules are configured but there are no ALLOW rules (only BLOCK rules),
    // and we passed all BLOCK checks, then it is allowed!
    if (allowRules.length === 0) {
      return true;
    }

    // If ALLOW rules exist, the path must satisfy at least ONE of them
    let satisfiedAnyAllow = false;

    for (const rule of allowRules) {
      const sourceId = typeof rule.sourceNode === 'string' 
        ? rule.sourceNode 
        : (rule.sourceNode as any)._id?.toString() || rule.sourceNode.toString();

      // If the student does not have the source node in their path, this allow gate doesn't apply
      if (!pathNodeIds.has(sourceId)) {
        continue;
      }

      let satisfiedThisRule = true;

      // Check minimumQualification (if specified)
      if (rule.minimumQualification) {
        const qualNode = rule.minimumQualification as any;
        const qualId = qualNode._id?.toString() || qualNode.toString();
        
        let hasQual = pathNodeIds.has(qualId);
        
        // Exception: If qualification required is Class 12, and path contains a SubjectCombination,
        // then they are considered to have Class 12 qualification.
        if (!hasQual && qualNode.name && qualNode.name.includes('Class 12') && hasSubjectCombination) {
          hasQual = true;
        }
        
        if (!hasQual) {
          satisfiedThisRule = false;
        }
      }

      // Check mandatory subjects (if specified)
      if (satisfiedThisRule && rule.mandatorySubjects && rule.mandatorySubjects.length > 0) {
        const hasAllMandatory = rule.mandatorySubjects.every((sub) =>
          pathSubjects.has(sub.toLowerCase().trim())
        );
        if (!hasAllMandatory) {
          satisfiedThisRule = false;
        }
      }

      // Check entrance exams requirements (if specified)
      if (satisfiedThisRule && rule.entranceExamRequirements && rule.entranceExamRequirements.length > 0) {
        const hasSomeExams = rule.entranceExamRequirements.some((exam) => {
          const examId = typeof exam === 'string' 
            ? exam 
            : (exam as any)._id?.toString() || exam.toString();
          return pathNodeIds.has(examId);
        });
        if (!hasSomeExams) {
          satisfiedThisRule = false;
        }
      }

      if (satisfiedThisRule) {
        satisfiedAnyAllow = true;
        break; // Satisfied one ALLOW gate, path segment is valid!
      }
    }

    return satisfiedAnyAllow;
  }

  /**
   * Fetches all rules from MongoDB database with minimumQualification populated (ideal for raw pathfinding checks)
   */
  static async getAllRulesRaw(): Promise<IEligibilityRule[]> {
    return await EligibilityRuleModel.find().populate('minimumQualification');
  }

  /**
   * Fetches all rules populated with full node objects for Admin Panel display
   */
  static async getAllRulesPopulated(): Promise<IEligibilityRule[]> {
    return await EligibilityRuleModel.find()
      .populate('sourceNode')
      .populate('targetNode')
      .populate('entranceExamRequirements')
      .populate('minimumQualification');
  }
}
export default EligibilityService;
