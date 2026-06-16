import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDatabase } from './config/db';
import { NodeModel } from './models/Node';
import { RoadmapEngine } from './services/roadmapEngine';

dotenv.config();

const printPath = (path: any) => {
  return path.steps.map((step: any, index: number) => {
    const nodeStr = `(${step.node.type}: ${step.node.name})`;
    const relStr = step.relationship ? ` --[${step.relationship.type}]--> ` : '';
    return nodeStr + relStr;
  }).join('');
};

const runTest = async () => {
  try {
    await connectDatabase();

    // Find starting and ending nodes
    const class10 = await NodeModel.findOne({ name: 'Class 10' });
    const dataScientist = await NodeModel.findOne({ name: 'Data Scientist' });
    const softwareEngineer = await NodeModel.findOne({ name: 'Software Engineer' });

    if (!class10 || !dataScientist || !softwareEngineer) {
      console.error('Core nodes not found. Please run seed script first.');
      process.exit(1);
    }

    console.log(`\n--- TEST 1: BFS SHORTEST PATH FROM "${class10.name}" TO "${dataScientist.name}" ---`);
    const shortestPath = await RoadmapEngine.findShortestPath(class10.id, dataScientist.id);
    if (shortestPath) {
      console.log('Shortest Path Found:');
      console.log(printPath(shortestPath));
    } else {
      console.log('No path found.');
    }

    console.log(`\n--- TEST 2: DFS REACHABLE CAREERS (OCCUPATIONS) FROM "${class10.name}" ---`);
    const careerRoadmaps = await RoadmapEngine.getReachableCareers(class10.id, 8);
    console.log(`Found ${careerRoadmaps.length} total pathways leading to occupations:`);
    
    // Extract unique careers reached
    const uniqueCareers = new Set<string>();
    careerRoadmaps.forEach(path => {
      const lastNode = path.steps[path.steps.length - 1].node;
      uniqueCareers.add(` - [${lastNode.type}] ${lastNode.name} (${lastNode.description || ''})`);
    });
    console.log('Unique Occupations Reached:');
    uniqueCareers.forEach(c => console.log(c));

    console.log(`\n--- TEST 3: ALTERNATIVE PATHWAYS FROM "${class10.name}" TO "${softwareEngineer.name}" ---`);
    const altRoadmaps = await RoadmapEngine.findAlternativePaths(class10.id, softwareEngineer.id, 8);
    console.log(`Found ${altRoadmaps.length} alternative pathways (sorted by shortest first):`);
    altRoadmaps.forEach((path, i) => {
      console.log(`\nAlternative Path ${i + 1} (${path.steps.length} steps):`);
      console.log(printPath(path));
    });

    console.log(`\n--- TEST 4: BFS TREE LEVELS STARTING FROM "${class10.name}" (UP TO DEPTH 3) ---`);
    const bfsTree = await RoadmapEngine.getBfsTree(class10.id, 3);
    Object.keys(bfsTree).forEach(depthKey => {
      const depth = parseInt(depthKey, 10);
      console.log(`Depth ${depth}:`);
      bfsTree[depth].forEach(node => {
        console.log(` - [${node.type}] ${node.name}`);
      });
    });

    console.log('\nClosing database connection...');
    await mongoose.connection.close();
    console.log('Roadmap Engine testing complete!');
  } catch (error) {
    console.error('Error running roadmap engine test:', error);
    await mongoose.connection.close();
  }
};

runTest();
