import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { getOrCreateSharedNodes, ensureConnection, ISharedNodes } from './seed-helper';
import { 
  NodeModel,
  SubjectCombinationNodeModel, 
  ExamNodeModel, 
  DegreeNodeModel, 
  OccupationNodeModel, 
  SkillNodeModel, 
  InstituteNodeModel, 
  NodeType
} from '../models/Node';
import { RelationshipModel, RelationshipType } from '../models/Relationship';

export const seedMedical = async (shared: ISharedNodes): Promise<void> => {
  console.log('Seeding Medical Pathway from JSON file...');

  // 1. Read JSON data
  const dataPath = path.join(__dirname, 'data', 'medical-data.json');
  const rawData = fs.readFileSync(dataPath, 'utf8');
  const { nodes, relationships } = JSON.parse(rawData);

  // 2. Create Nodes and build a name-to-id mapping dictionary
  const nameToIdMap = new Map<string, mongoose.Types.ObjectId>();

  for (const node of nodes) {
    let model: any = NodeModel;
    if (node.type === NodeType.SubjectCombination) model = SubjectCombinationNodeModel;
    else if (node.type === NodeType.Exam) model = ExamNodeModel;
    else if (node.type === NodeType.Degree) model = DegreeNodeModel;
    else if (node.type === NodeType.Occupation) model = OccupationNodeModel;
    else if (node.type === NodeType.Skill) model = SkillNodeModel;
    else if (node.type === NodeType.Institute) model = InstituteNodeModel;

    const savedNode = await model.findOneAndUpdate(
      { name: node.name, type: node.type },
      node,
      { upsert: true, new: true }
    );

    nameToIdMap.set(node.name, savedNode._id as mongoose.Types.ObjectId);
  }

  // 3. Create Relationships using the resolved node IDs
  for (const rel of relationships) {
    let fromNodeId = nameToIdMap.get(rel.fromNodeName);
    if (!fromNodeId) {
      // Check if it is a shared base node
      const found = await NodeModel.findOne({ name: rel.fromNodeName });
      if (found) fromNodeId = found._id as mongoose.Types.ObjectId;
    }

    let toNodeId = nameToIdMap.get(rel.toNodeName);
    if (!toNodeId) {
      // Check if it is a shared base node
      const found = await NodeModel.findOne({ name: rel.toNodeName });
      if (found) toNodeId = found._id as mongoose.Types.ObjectId;
    }

    if (fromNodeId && toNodeId) {
      await RelationshipModel.findOneAndUpdate(
        { fromNode: fromNodeId, toNode: toNodeId, type: rel.type as RelationshipType },
        { metadata: rel.metadata },
        { upsert: true }
      );
    } else {
      console.warn(`Could not resolve relationship between: "${rel.fromNodeName}" and "${rel.toNodeName}"`);
    }
  }

  console.log('Medical Seeding Complete!');
};

// Check if run directly
if (require.main === module) {
  (async () => {
    try {
      await ensureConnection();
      const shared = await getOrCreateSharedNodes();
      await seedMedical(shared);
      await mongoose.connection.close();
      console.log('Standalone Medical Seeding Completed Successfully.');
      process.exit(0);
    } catch (err) {
      console.error('Standalone Medical Seeding Failed:', err);
      process.exit(1);
    }
  })();
}
