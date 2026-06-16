import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDatabase } from './config/db';
import { NodeModel } from './models/Node';
import { RoadmapEngine } from './services/roadmapEngine';

dotenv.config();

async function runCheck() {
  try {
    await connectDatabase();

    const commerce = await NodeModel.findOne({ name: /Commerce/ });
    const pcm = await NodeModel.findOne({ name: 'PCM' });
    const mbbs = await NodeModel.findOne({ name: 'MBBS' }) || await NodeModel.findOne({ name: /MBBS/ });
    const btechCse = await NodeModel.findOne({ name: 'B.Tech CSE' }) || await NodeModel.findOne({ name: /B.Tech/ });

    if (!commerce || !pcm || !mbbs || !btechCse) {
      console.error('Core nodes not found. Make sure master seeder is run.');
      process.exit(1);
    }

    console.log(`Commerce ID: ${commerce._id}, PCM ID: ${pcm._id}, MBBS ID: ${mbbs._id}, B.Tech CSE ID: ${btechCse._id}`);

    // TEST 1: Commerce -> MBBS (Should be blocked by BLOCK rule)
    console.log('\n--- VERIFYING BLACKLIST: Commerce -> MBBS ---');
    const pathCommerceToMbbs = await RoadmapEngine.findShortestPath(commerce._id.toString(), mbbs._id.toString());
    if (pathCommerceToMbbs) {
      console.error('❌ FAIL: Allowed invalid path Commerce -> MBBS!');
      console.log(pathCommerceToMbbs.steps.map(s => s.node.name).join(' -> '));
    } else {
      console.log('✅ SUCCESS: Correctly blocked Commerce -> MBBS!');
    }

    // TEST 2: Commerce -> B.Tech CSE (Should be blocked by ALLOW rule that only whitelists PCM)
    console.log('\n--- VERIFYING WHITELIST: Commerce -> B.Tech CSE ---');
    const pathCommerceToBtech = await RoadmapEngine.findShortestPath(commerce._id.toString(), btechCse._id.toString());
    if (pathCommerceToBtech) {
      console.error('❌ FAIL: Allowed invalid path Commerce -> B.Tech CSE!');
      console.log(pathCommerceToBtech.steps.map(s => s.node.name).join(' -> '));
    } else {
      console.log('✅ SUCCESS: Correctly blocked Commerce -> B.Tech CSE!');
    }

    // TEST 3: PCM -> B.Tech CSE (Should be allowed by whitelisting)
    console.log('\n--- VERIFYING WHITELIST: PCM -> B.Tech CSE ---');
    const pathPcmToBtech = await RoadmapEngine.findShortestPath(pcm._id.toString(), btechCse._id.toString());
    if (pathPcmToBtech) {
      console.log('✅ SUCCESS: Correctly allowed valid path PCM -> B.Tech CSE!');
      console.log(pathPcmToBtech.steps.map(s => s.node.name).join(' -> '));
    } else {
      console.error('❌ FAIL: Blocked valid path PCM -> B.Tech CSE!');
    }

    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
    await mongoose.connection.close();
  }
}

runCheck();
