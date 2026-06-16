import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDatabase } from './config/db';
import { NodeModel, NodeType } from './models/Node';
import { GraphService } from './services/graphService';

dotenv.config();

const runTest = async () => {
  try {
    await connectDatabase();

    // 1. Find the start node (Class 8) and end node (Software Engineer)
    const class8 = await NodeModel.findOne({ name: 'Class 8' });
    const softwareEngineer = await NodeModel.findOne({ name: 'Software Engineer' });

    if (!class8 || !softwareEngineer) {
      console.error('Seed data not found. Please run seed script first.');
      process.exit(1);
    }

    console.log(`\n--- TEST 1: FIND ALL PATHS FROM "${class8.name}" TO "${softwareEngineer.name}" ---`);
    
    const paths = await GraphService.findAllPaths(
      class8.id,
      softwareEngineer.id,
      8 // depth
    );

    console.log(`Found ${paths.length} pathway(s):`);
    paths.forEach((path, i) => {
      console.log(`\nPathway ${i + 1}:`);
      const stepsStr = path.steps.map((node, index) => {
        const rel = path.relationships[index];
        return `(${node.type}: ${node.name})` + (rel ? ` --[${rel}]--> ` : '');
      }).join('');
      console.log(stepsStr);
    });

    console.log(`\n--- TEST 2: GET ALL REACHABLE NODES FROM "${class8.name}" (USING $graphLookup) ---`);
    const subgraph = await GraphService.getReachableNodes(class8.id, 6);
    
    console.log(`Total Reachable Nodes: ${subgraph.nodes.length}`);
    console.log('Nodes found:');
    subgraph.nodes.forEach((node: any) => {
      console.log(` - [${node.type}] ${node.name}`);
    });

    console.log(`\nTotal Relationships: ${subgraph.edges.length}`);
    subgraph.edges.forEach((edge: any) => {
      const fromNode = subgraph.nodes.find((n: any) => n._id.toString() === edge.fromNode.toString());
      const toNode = subgraph.nodes.find((n: any) => n._id.toString() === edge.toNode.toString());
      if (fromNode && toNode) {
        console.log(` - ${fromNode.name} --[${edge.type}]--> ${toNode.name}`);
      }
    });

    console.log('\nClosing connection...');
    await mongoose.connection.close();
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error running graph test:', error);
    await mongoose.connection.close();
  }
};

runTest();
