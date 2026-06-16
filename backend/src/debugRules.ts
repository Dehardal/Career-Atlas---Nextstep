import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDatabase } from './config/db';
import { NodeModel, NodeType, INode } from './models/Node';
import { RelationshipModel, IRelationship } from './models/Relationship';
import { EligibilityRuleModel } from './models/EligibilityRule';
import { EligibilityService } from './services/eligibilityService';

dotenv.config();

async function debugRules() {
  await connectDatabase();

  const allNodes = await NodeModel.find();
  const allRelationships = await RelationshipModel.find();
  const rules = await EligibilityService.getAllRulesRaw();

  const nodeIds = new Set(allNodes.map(n => n._id.toString()));
  const nodeMap = new Map<string, INode>(allNodes.map(n => [n._id.toString(), n]));

  // Let's debug NEET -> MBBS
  const neet = allNodes.find(n => n.name === 'NEET');
  const mbbs = allNodes.find(n => n.name === 'MBBS');

  if (neet && mbbs) {
    console.log('--- DEBUGGING NEET -> MBBS ---');
    const pathNodes: INode[] = [neet];
    const visitedAncestors = new Set<string>([neet._id.toString()]);
    const queue = [neet._id.toString()];

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

    console.log('Simulated path nodes:');
    pathNodes.forEach(n => console.log(` - [${n.type}] ${n.name} (subjects: ${(n as any).subjects})`));

    // Print MBBS rules
    const mbbsRules = rules.filter(r => {
      const targetId = typeof r.targetNode === 'string' 
        ? r.targetNode 
        : (r.targetNode as any)._id?.toString() || r.targetNode.toString();
      return targetId === mbbs._id.toString();
    });

    console.log('\nMBBS Rules:', mbbsRules.length);
    mbbsRules.forEach((rule, idx) => {
      console.log(`Rule [${idx+1}]: type=${rule.ruleType}, source=${rule.sourceNode}`);
      console.log(`  MinQual=${rule.minimumQualification ? (rule.minimumQualification as any).name : 'none'}`);
      console.log(`  MandatorySubjects=${rule.mandatorySubjects}`);
      console.log(`  Exams=${rule.entranceExamRequirements}`);
    });

    const isEligible = EligibilityService.validateTransitionSync(pathNodes, mbbs, rules);
    console.log('\nIs Eligible:', isEligible);
  }

  // Let's debug PCB -> B.Pharm
  const pcb = allNodes.find(n => n.name === 'PCB');
  const bpharm = allNodes.find(n => n.name === 'B.Pharm');

  if (pcb && bpharm) {
    console.log('\n--- DEBUGGING PCB -> B.PHARM ---');
    const pathNodes: INode[] = [pcb];
    const visitedAncestors = new Set<string>([pcb._id.toString()]);
    const queue = [pcb._id.toString()];

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

    console.log('Simulated path nodes:');
    pathNodes.forEach(n => console.log(` - [${n.type}] ${n.name}`));

    const bpharmRules = rules.filter(r => {
      const targetId = typeof r.targetNode === 'string' 
        ? r.targetNode 
        : (r.targetNode as any)._id?.toString() || r.targetNode.toString();
      return targetId === bpharm._id.toString();
    });

    console.log('\nB.Pharm Rules:', bpharmRules.length);
    bpharmRules.forEach((rule, idx) => {
      console.log(`Rule [${idx+1}]: type=${rule.ruleType}, source=${rule.sourceNode}`);
      console.log(`  MinQual=${rule.minimumQualification ? (rule.minimumQualification as any).name : 'none'}`);
      console.log(`  MandatorySubjects=${rule.mandatorySubjects}`);
      console.log(`  Exams=${rule.entranceExamRequirements}`);
    });

    const isEligible = EligibilityService.validateTransitionSync(pathNodes, bpharm, rules);
    console.log('\nIs Eligible:', isEligible);
  }

  await mongoose.connection.close();
}

debugRules();
