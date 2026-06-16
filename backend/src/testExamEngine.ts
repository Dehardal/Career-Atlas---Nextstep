import mongoose from 'mongoose';
import { connectDatabase } from './config/db';
import { NodeModel, NodeType } from './models/Node';
import { RoadmapEngine } from './services/roadmapEngine';
import { RelationshipModel } from './models/Relationship';

async function runTest() {
  await connectDatabase();

  console.log('--- ENTRANCE EXAM ENGINE TEST ---');

  // 1. Fetch PCM and B.Tech CSE nodes
  const pcmNode = await NodeModel.findOne({ name: 'PCM', type: NodeType.SubjectCombination });
  const btechNode = await NodeModel.findOne({ name: { $regex: /B.Tech/i }, type: NodeType.Degree });

  if (!pcmNode || !btechNode) {
    console.error('Could not find PCM or B.Tech node. Ensure database is fully seeded.');
    mongoose.connection.close();
    process.exit(1);
  }

  console.log(`Start Node: ${pcmNode.name} (${pcmNode._id})`);
  console.log(`Target Node: ${btechNode.name} (${btechNode._id})`);

  // 2. Check if a direct relationship exists between PCM and B.Tech CSE
  const directRel = await RelationshipModel.findOne({
    fromNode: pcmNode._id,
    toNode: btechNode._id
  });
  console.log(`Direct relationship in DB: ${directRel ? 'YES' : 'NO'}`);

  // 3. Find path using RoadmapEngine
  console.log('Running findShortestPath...');
  const shortestPath = await RoadmapEngine.findShortestPath(
    pcmNode._id.toString(),
    btechNode._id.toString()
  );

  if (shortestPath) {
    console.log('\nShortest Path Found:');
    shortestPath.steps.forEach((step, idx) => {
      console.log(`  Step ${idx + 1}: Node = ${step.node.name} (${step.node.type})`);
      if (step.relationship) {
        console.log(`          --[${step.relationship.type}]-->`);
      }
    });
  } else {
    console.log('\nNo Shortest Path Found!');
  }

  // 3.5 Test resolveTransitionSteps directly with [PCM] -> B.Tech CSE
  console.log('\nTesting resolveTransitionSteps directly...');
  const { EligibilityService } = require('./services/eligibilityService');
  const rules = await EligibilityService.getAllRulesRaw();
  const mockPath = [{ node: pcmNode }];
  const resolvedSteps = await RoadmapEngine.resolveTransitionSteps(mockPath, btechNode, rules);
  
  if (resolvedSteps) {
    console.log('Successfully resolved transition by inserting exam steps:');
    resolvedSteps.forEach((step, idx) => {
      console.log(`  Inserted Step ${idx + 1}: ${step.node.name} (${step.node.type})`);
      if (step.relationship) {
        console.log(`          --[${step.relationship.type}]: "${step.relationship.metadata?.description || ''}"-->`);
      }
    });
  } else {
    console.log('Could not resolve transition via exam insertion.');
  }

  // 4. Find alternative paths
  console.log('\nRunning findAlternativePaths...');
  const altPaths = await RoadmapEngine.findAlternativePaths(
    pcmNode._id.toString(),
    btechNode._id.toString()
  );

  console.log(`Found ${altPaths.length} alternative pathways.`);
  altPaths.forEach((path, pathIdx) => {
    console.log(`\nPath Option ${pathIdx + 1} (${path.steps.length} steps):`);
    path.steps.forEach((step, idx) => {
      console.log(`  Step ${idx + 1}: ${step.node.name} (${step.node.type})`);
      if (step.relationship) {
        console.log(`          --[${step.relationship.type}]-->`);
      }
    });
  });

  mongoose.connection.close();
  console.log('--- TEST FINISHED ---');
}

runTest().catch((err) => {
  console.error('Test run failed:', err);
  mongoose.connection.close();
  process.exit(1);
});
