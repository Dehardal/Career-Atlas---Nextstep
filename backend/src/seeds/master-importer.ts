import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDatabase } from '../config/db';
import { getOrCreateSharedNodes, ISharedNodes } from './seed-helper';
import { NodeModel } from '../models/Node';
import { RelationshipModel } from '../models/Relationship';

// Import domain seeds
import { seedEngineering } from './seed-engineering';
import { seedMedical } from './seed-medical';
import { seedCommerce } from './seed-commerce';
import { seedLaw } from './seed-law';
import { seedDefence } from './seed-defence';
import { seedDesign } from './seed-design';
import { seedGovernment } from './seed-government';
import { seedArts } from './seed-arts';
import { seedHospitality } from './seed-hospitality';
import { seedAgriculture } from './seed-agriculture';

dotenv.config();

const runMasterImport = async () => {
  try {
    console.log('--- STARTING MASTER GRAPH IMPORT ---');
    await connectDatabase();

    console.log('Clearing existing Graph Nodes and Relationships from database...');
    const deletedNodes = await NodeModel.deleteMany({});
    const deletedRelationships = await RelationshipModel.deleteMany({});
    console.log(`Cleared: ${deletedNodes.deletedCount} nodes, ${deletedRelationships.deletedCount} relationships.`);

    console.log('\nInitializing Shared Base Nodes...');
    const shared: ISharedNodes = await getOrCreateSharedNodes();
    console.log('Shared Base Nodes ready.');

    // Execute each domain seed sequentially
    console.log('\nRunning Sector Seeders...');
    await seedEngineering(shared);
    await seedMedical(shared);
    await seedCommerce(shared);
    await seedLaw(shared);
    await seedDefence(shared);
    await seedDesign(shared);
    await seedGovernment(shared);
    await seedArts(shared);
    await seedHospitality(shared);
    await seedAgriculture(shared);

    // Fetch and report database counts
    const totalNodes = await NodeModel.countDocuments({});
    const totalRelationships = await RelationshipModel.countDocuments({});

    console.log('\n=========================================');
    console.log('  MASTER DATA SEEDING COMPLETE  ');
    console.log('=========================================');
    console.log(` - Total Graph Nodes: ${totalNodes}`);
    console.log(` - Total Relationships: ${totalRelationships}`);
    console.log('=========================================');

    await mongoose.connection.close();
    console.log('Database connection closed safely.');
    process.exit(0);
  } catch (error) {
    console.error('Master Importer Failed:', error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

runMasterImport();
