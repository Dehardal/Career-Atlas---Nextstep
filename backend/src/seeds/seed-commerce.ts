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

export const seedCommerce = async (shared: ISharedNodes): Promise<void> => {
  console.log('Seeding Commerce Pathway from JSON file...');

  // 1. Read JSON data
  const dataPath = path.join(__dirname, 'data', 'commerce-data.json');
  const rawData = fs.readFileSync(dataPath, 'utf8');
  const { nodes, relationships } = JSON.parse(rawData);

  // 2. Map class 10 to Commerce Stream, and Commerce Stream to Class 12
  await RelationshipModel.findOneAndUpdate(
    { fromNode: shared.class10._id, toNode: shared.commerceStream._id, type: RelationshipType.CanChoose },
    {},
    { upsert: true }
  );

  await RelationshipModel.findOneAndUpdate(
    { fromNode: shared.commerceStream._id, toNode: shared.class12._id, type: RelationshipType.LeadsTo },
    {},
    { upsert: true }
  );

  // 3. Create Nodes and build a name-to-id mapping dictionary
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

  // 4. Create Relationships using the resolved node IDs
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

  console.log('Commerce Seeding Complete!');
};

// Check if run directly
if (require.main === module) {
  (async () => {
    try {
      await ensureConnection();
      const shared = await getOrCreateSharedNodes();
      await seedCommerce(shared);
      await mongoose.connection.close();
      console.log('Standalone Commerce Seeding Completed Successfully.');
      process.exit(0);
    } catch (err) {
      console.error('Standalone Commerce Seeding Failed:', err);
      process.exit(1);
    }
  })();
}
