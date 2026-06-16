import mongoose from 'mongoose';
import { connectDatabase } from '../config/db';
import { NodeModel, NodeType } from '../models/Node';
import { EligibilityRuleModel, RuleType } from '../models/EligibilityRule';
import { RelationshipModel } from '../models/Relationship';
import dotenv from 'dotenv';

dotenv.config();

async function seedRules() {
  await connectDatabase();

  console.log('Clearing existing eligibility rules...');
  await EligibilityRuleModel.deleteMany({});

  // 1. Fetch nodes from DB
  const class12Node = await NodeModel.findOne({ name: 'Class 12', type: NodeType.Qualification });
  const pcmNode = await NodeModel.findOne({ name: 'PCM', type: NodeType.SubjectCombination });
  const pcbNode = await NodeModel.findOne({ name: 'PCB', type: NodeType.SubjectCombination });
  const pcmbNode = await NodeModel.findOne({ name: 'PCMB', type: NodeType.SubjectCombination });
  
  const commerceNode = await NodeModel.findOne({ name: 'Commerce Stream', type: NodeType.Stream });
  const commerceMathNode = await NodeModel.findOne({ name: 'Commerce with Mathematics', type: NodeType.SubjectCombination });
  
  const artsNode = await NodeModel.findOne({ name: 'Arts & Humanities Stream', type: NodeType.Stream });
  const humanitiesCoreNode = await NodeModel.findOne({ name: 'History, Political Science, and English', type: NodeType.SubjectCombination });
  const humanitiesLegalNode = await NodeModel.findOne({ name: 'Humanities with Legal Studies', type: NodeType.SubjectCombination });

  // Degrees
  const btechCs = await NodeModel.findOne({ name: 'B.Tech CSE', type: NodeType.Degree });
  const mbbsNode = await NodeModel.findOne({ name: 'MBBS', type: NodeType.Degree });
  const bcomNode = await NodeModel.findOne({ name: 'B.Com', type: NodeType.Degree });
  const bcomHonsNode = await NodeModel.findOne({ name: 'B.Com (Hons)', type: NodeType.Degree });
  const baEcoNode = await NodeModel.findOne({ name: 'B.A. Economics (Hons)', type: NodeType.Degree });
  const mscNode = await NodeModel.findOne({ name: 'M.Sc', type: NodeType.Degree });
  const maNode = await NodeModel.findOne({ name: 'M.A', type: NodeType.Degree });
  const mtechNode = await NodeModel.findOne({ name: 'M.Tech', type: NodeType.Degree });
  const mbaNode = await NodeModel.findOne({ name: 'MBA', type: NodeType.Degree });

  // Exams
  const neetNode = await NodeModel.findOne({ name: 'NEET', type: NodeType.Exam });
  const jeeAdvancedNode = await NodeModel.findOne({ name: 'JEE Advanced', type: NodeType.Exam });
  const jeeMainNode = await NodeModel.findOne({ name: 'JEE Main', type: NodeType.Exam });
  const bitsatNode = await NodeModel.findOne({ name: 'BITSAT', type: NodeType.Exam });
  const viteeeNode = await NodeModel.findOne({ name: 'VITEEE', type: NodeType.Exam });
  const catNode = await NodeModel.findOne({ name: 'CAT', type: NodeType.Exam });
  const gateNode = await NodeModel.findOne({ name: 'GATE', type: NodeType.Exam });
  const cuetPgNode = await NodeModel.findOne({ name: 'CUET PG', type: NodeType.Exam });

  if (!class12Node) {
    console.error('Could not find Class 12 qualification node in DB.');
    mongoose.connection.close();
    process.exit(1);
  }

  // 2. Define custom eligibility rules
  const customRules = [];

  // BLOCK Rule: Commerce Stream -> MBBS
  if (commerceNode && mbbsNode) {
    customRules.push({
      sourceNode: commerceNode._id,
      targetNode: mbbsNode._id,
      ruleType: RuleType.Block,
      exceptions: 'Direct MBBS entry from commerce stream is strictly prohibited under National Medical Commission guidelines.'
    });
  }

  // ALLOW Rule: PCM -> B.Tech CSE
  if (pcmNode && btechCs) {
    const exams: mongoose.Types.ObjectId[] = [];
    if (jeeAdvancedNode) exams.push(jeeAdvancedNode._id as mongoose.Types.ObjectId);
    if (jeeMainNode) exams.push(jeeMainNode._id as mongoose.Types.ObjectId);
    if (bitsatNode) exams.push(bitsatNode._id as mongoose.Types.ObjectId);
    if (viteeeNode) exams.push(viteeeNode._id as mongoose.Types.ObjectId);

    customRules.push({
      sourceNode: pcmNode._id,
      targetNode: btechCs._id,
      ruleType: RuleType.Allow,
      minimumQualification: class12Node._id,
      mandatorySubjects: ['Physics', 'Chemistry', 'Mathematics'],
      entranceExamRequirements: exams,
      exceptions: 'Diploma in Engineering holders can seek lateral entry directly.'
    });
  }

  // ALLOW Rule: PCB -> MBBS
  if (pcbNode && mbbsNode) {
    customRules.push({
      sourceNode: pcbNode._id,
      targetNode: mbbsNode._id,
      ruleType: RuleType.Allow,
      minimumQualification: class12Node._id,
      mandatorySubjects: ['Physics', 'Chemistry', 'Biology'],
      entranceExamRequirements: neetNode ? [neetNode._id] : [],
      exceptions: 'Must obtain valid score in NEET.'
    });
  }

  // ALLOW Rule: Commerce Stream -> B.Com
  if (commerceNode && bcomNode) {
    customRules.push({
      sourceNode: commerceNode._id,
      targetNode: bcomNode._id,
      ruleType: RuleType.Allow,
      minimumQualification: class12Node._id,
      exceptions: 'Non-commerce students may enter B.Com subject to university eligibility criteria.'
    });
  }

  // ALLOW Rule: Commerce with Mathematics -> B.Com
  if (commerceMathNode && bcomNode) {
    customRules.push({
      sourceNode: commerceMathNode._id,
      targetNode: bcomNode._id,
      ruleType: RuleType.Allow,
      minimumQualification: class12Node._id,
      exceptions: 'Requires passing class 12 boards.'
    });
  }

  // --- NEW CUSTOM POSTGRADUATE RULES ---
  
  // MBA rules open to all streams
  const streamsAndCombinationsForMba = [commerceNode, pcmNode, pcbNode, pcmbNode, artsNode, commerceMathNode, humanitiesCoreNode, humanitiesLegalNode];
  if (mbaNode) {
    for (const node of streamsAndCombinationsForMba) {
      if (node) {
        customRules.push({
          sourceNode: node._id,
          targetNode: mbaNode._id,
          ruleType: RuleType.Allow,
          minimumQualification: class12Node._id,
          entranceExamRequirements: [],
          exceptions: 'Requires graduation degree.'
        });
      }
    }
  }

  // M.Sc rules open ONLY to Science streams
  const scienceForMsc = [pcmNode, pcbNode, pcmbNode];
  if (mscNode) {
    for (const node of scienceForMsc) {
      if (node) {
        customRules.push({
          sourceNode: node._id,
          targetNode: mscNode._id,
          ruleType: RuleType.Allow,
          minimumQualification: class12Node._id,
          entranceExamRequirements: [],
          exceptions: 'Requires Science graduation background.'
        });
      }
    }
  }

  // M.Tech rules open ONLY to Science/Tech streams
  const scienceForMtech = [pcmNode, pcmbNode];
  if (mtechNode) {
    for (const node of scienceForMtech) {
      if (node) {
        customRules.push({
          sourceNode: node._id,
          targetNode: mtechNode._id,
          ruleType: RuleType.Allow,
          minimumQualification: class12Node._id,
          entranceExamRequirements: [],
          exceptions: 'Requires Physics, Chemistry, and Mathematics background.'
        });
      }
    }
  }

  // M.A rules open to all streams
  const allForMa = [commerceNode, pcmNode, pcbNode, pcmbNode, artsNode, commerceMathNode, humanitiesCoreNode, humanitiesLegalNode];
  if (maNode) {
    for (const node of allForMa) {
      if (node) {
        customRules.push({
          sourceNode: node._id,
          targetNode: maNode._id,
          ruleType: RuleType.Allow,
          minimumQualification: class12Node._id,
          entranceExamRequirements: [],
          exceptions: 'Requires graduation degree.'
        });
      }
    }
  }

  // --- EXPLICIT POSTGRADUATE BLOCK RULES ---
  // BLOCK Arts and Commerce from Science/Tech PG degrees (M.Sc and M.Tech)
  if (artsNode && mscNode) {
    customRules.push({
      sourceNode: artsNode._id,
      targetNode: mscNode._id,
      ruleType: RuleType.Block,
      exceptions: 'Arts students are strictly ineligible for Master of Science degrees.'
    });
  }
  if (commerceNode && mscNode) {
    customRules.push({
      sourceNode: commerceNode._id,
      targetNode: mscNode._id,
      ruleType: RuleType.Block,
      exceptions: 'Commerce students are strictly ineligible for Master of Science degrees.'
    });
  }
  if (artsNode && mtechNode) {
    customRules.push({
      sourceNode: artsNode._id,
      targetNode: mtechNode._id,
      ruleType: RuleType.Block,
      exceptions: 'Arts students are strictly ineligible for Master of Technology degrees.'
    });
  }
  if (commerceNode && mtechNode) {
    customRules.push({
      sourceNode: commerceNode._id,
      targetNode: mtechNode._id,
      ruleType: RuleType.Block,
      exceptions: 'Commerce students are strictly ineligible for Master of Technology degrees.'
    });
  }

  // Seed custom rules
  for (const ruleData of customRules) {
    await EligibilityRuleModel.findOneAndUpdate(
      { sourceNode: ruleData.sourceNode, targetNode: ruleData.targetNode },
      ruleData,
      { upsert: true }
    );
  }
  console.log(`Seeded ${customRules.length} custom eligibility rules.`);

  // 2.5 Apply rule inheritance
  console.log('Applying rule inheritance for sub-combinations and streams...');
  const inheritanceMap = [
    { child: pcmbNode, parents: [pcmNode, pcbNode] },
    { child: commerceMathNode, parents: [commerceNode] },
    { child: humanitiesCoreNode, parents: [artsNode] },
    { child: humanitiesLegalNode, parents: [artsNode] }
  ];

  let inheritedRulesCount = 0;
  for (const mapping of inheritanceMap) {
    const childNode = mapping.child;
    if (!childNode) continue;

    for (const parentNode of mapping.parents) {
      if (!parentNode) continue;

      const parentRules = await EligibilityRuleModel.find({ sourceNode: parentNode._id });
      for (const parentRule of parentRules) {
        const existingChildRule = await EligibilityRuleModel.findOne({
          sourceNode: childNode._id,
          targetNode: parentRule.targetNode
        });

        if (existingChildRule) {
          // If a rule exists, block rules override allow rules
          if (parentRule.ruleType === RuleType.Block) {
            existingChildRule.ruleType = RuleType.Block;
            existingChildRule.exceptions = parentRule.exceptions;
            await existingChildRule.save();
          }
          continue;
        }

        const newRule = new EligibilityRuleModel({
          sourceNode: childNode._id,
          targetNode: parentRule.targetNode,
          ruleType: parentRule.ruleType,
          minimumQualification: parentRule.minimumQualification,
          mandatorySubjects: parentRule.mandatorySubjects,
          preferredSubjects: parentRule.preferredSubjects,
          entranceExamRequirements: parentRule.entranceExamRequirements,
          exceptions: parentRule.exceptions || `Inherited from ${parentNode.name} eligibility rules.`
        });
        await newRule.save();
        inheritedRulesCount++;
      }
    }
  }
  console.log(`Successfully applied rule inheritance: Seeded/Merged ${inheritedRulesCount} rules.`);

  // 3. Dynamically generate eligibility rules for any remaining Degrees
  const degrees = await NodeModel.find({ type: NodeType.Degree });
  let dynamicDegreeRulesCount = 0;

  // Helper to trace back to source nodes and collect exams along all incoming paths recursively
  async function traceBackSourcesAndExams(
    currentNodeId: mongoose.Types.ObjectId,
    visited: Set<string> = new Set()
  ): Promise<Map<string, { sourceNode: any, exams: mongoose.Types.ObjectId[] }>> {
    const result = new Map<string, { sourceNode: any, exams: mongoose.Types.ObjectId[] }>();
    const currIdStr = currentNodeId.toString();

    if (visited.has(currIdStr)) return result;
    visited.add(currIdStr);

    const node = await NodeModel.findById(currentNodeId);
    if (!node) return result;

    if (
      node.type === NodeType.SubjectCombination ||
      node.type === NodeType.Stream ||
      node.type === NodeType.Qualification
    ) {
      result.set(currIdStr, { sourceNode: node, exams: [] });
      return result;
    }

    const incoming = await RelationshipModel.find({ toNode: currentNodeId });
    for (const rel of incoming) {
      const parent = await NodeModel.findById(rel.fromNode);
      if (!parent) continue;

      const parentSources = await traceBackSourcesAndExams(parent._id as mongoose.Types.ObjectId, new Set(visited));
      for (const [srcId, val] of parentSources.entries()) {
        if (!result.has(srcId)) {
          result.set(srcId, { sourceNode: val.sourceNode, exams: [] });
        }
        const resEntry = result.get(srcId)!;
        val.exams.forEach(e => {
          if (!resEntry.exams.some(ex => ex.toString() === e.toString())) {
            resEntry.exams.push(e);
          }
        });
        if (parent.type === NodeType.Exam) {
          if (!resEntry.exams.some(e => e.toString() === parent._id.toString())) {
            resEntry.exams.push(parent._id as mongoose.Types.ObjectId);
          }
        }
      }
    }

    return result;
  }

  for (const deg of degrees) {
    const sourcesAndExams = await traceBackSourcesAndExams(deg._id as mongoose.Types.ObjectId);

    for (const [sourceIdStr, entry] of sourcesAndExams.entries()) {
      const sourceNode = entry.sourceNode;
      const exams = entry.exams;

      const existingRule = await EligibilityRuleModel.findOne({
        sourceNode: sourceNode._id,
        targetNode: deg._id
      });
      if (existingRule) continue;

      await EligibilityRuleModel.findOneAndUpdate(
        { sourceNode: sourceNode._id, targetNode: deg._id },
        {
          $setOnInsert: {
            ruleType: RuleType.Allow,
            minimumQualification: class12Node._id,
            mandatorySubjects: sourceNode.type === NodeType.SubjectCombination ? (sourceNode as any).subjects : [],
            exceptions: '',
            entranceExamRequirements: exams
          }
        },
        { upsert: true }
      );
      dynamicDegreeRulesCount++;
      console.log(`Dynamically seeded rule for Degree: ${sourceNode.name} -> ${deg.name}`);
    }
  }
  console.log(`Dynamically seeded ${dynamicDegreeRulesCount} Degree rules.`);

  // 4. Dynamically generate eligibility rules for all Occupations
  const occupations = await NodeModel.find({ type: NodeType.Occupation });
  let dynamicOccRulesCount = 0;

  for (const occ of occupations) {
    const incoming = await RelationshipModel.find({ toNode: occ._id });
    for (const rel of incoming) {
      const parent = await NodeModel.findById(rel.fromNode);
      if (parent && (parent.type === NodeType.Degree || parent.type === NodeType.Exam)) {
        const existingOccRule = await EligibilityRuleModel.findOne({
          sourceNode: parent._id,
          targetNode: occ._id
        });
        if (existingOccRule) continue;

        await EligibilityRuleModel.findOneAndUpdate(
          { sourceNode: parent._id, targetNode: occ._id },
          {
            $setOnInsert: {
              ruleType: RuleType.Allow,
              mandatorySubjects: [],
              preferredSubjects: [],
              entranceExamRequirements: [],
              exceptions: ''
            }
          },
          { upsert: true }
        );
        dynamicOccRulesCount++;
        console.log(`Dynamically seeded rule for Occupation: ${parent.name} -> ${occ.name}`);
      }
    }
  }
  console.log(`Dynamically seeded ${dynamicOccRulesCount} Occupation rules.`);

  console.log('All Eligibility Rules Seeded Successfully!');
  mongoose.connection.close();
}

seedRules().catch((err) => {
  console.error(err);
  mongoose.connection.close();
});
