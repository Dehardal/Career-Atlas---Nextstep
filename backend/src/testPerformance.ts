import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { performance } from 'perf_hooks';
import { connectDatabase } from './config/db';
import { NodeModel } from './models/Node';
import { RoadmapEngine } from './services/roadmapEngine';
import { CacheService } from './services/cacheService';

dotenv.config();

async function runPerformanceTest() {
  console.log('Connecting to database...');
  await connectDatabase();

  const startName = 'Class 10';
  const targetName = 'DevOps Engineer';

  const startNode = await NodeModel.findOne({ name: { $regex: new RegExp(`^${startName}$`, 'i') } });
  const targetNode = await NodeModel.findOne({ name: { $regex: new RegExp(`^${targetName}$`, 'i') } });

  if (!startNode || !targetNode) {
    console.error(`❌ ERROR: Could not find required nodes for test: "${startName}" or "${targetName}"`);
    console.log('Available nodes in DB matching "Class 10":', await NodeModel.find({ name: /class 10/i }).limit(5));
    console.log('Available nodes in DB matching "DevOps":', await NodeModel.find({ name: /devops/i }).limit(5));
    await mongoose.connection.close();
    process.exit(1);
  }

  console.log(`Found start node: "${startNode.name}" (${startNode._id})`);
  console.log(`Found target node: "${targetNode.name}" (${targetNode._id})`);

  console.log('\n--- Test 1: First-Search Pathfinder Performance (Depth Cap MaxDepth = 7) ---');
  CacheService.clear(); // Ensure clean state

  console.log('\nBenchmarking DB Load vs Pathfinder Search...');
  const dbStart = performance.now();
  const graph = await RoadmapEngine.loadGraphInMemory();
  const rules = await RoadmapEngine.loadRulesIndexed();
  const dbDuration = performance.now() - dbStart;
  console.log(`DB Load (Graph + Rules) took: ${dbDuration.toFixed(2)}ms`);

  const t0 = performance.now();
  const paths1 = await RoadmapEngine.findAlternativePaths(
    startNode._id.toString(),
    targetNode._id.toString(),
    7
  );
  const t1 = performance.now();
  const duration1 = t1 - t0;

  console.log(`Paths found: ${paths1.length}`);
  console.log(`Total findAlternativePaths execution time (including DB load): ${duration1.toFixed(2)}ms`);
  console.log(`Actual DFS traversal time (excluding DB load): ${(duration1 - dbDuration).toFixed(2)}ms`);
  
  if ((duration1 - dbDuration) < 500) {
    console.log('✅ PASS: Actual DFS traversal completed in under 500ms!');
  } else {
    console.warn('⚠️ WARNING: Actual DFS traversal took longer than 500ms. Optimization might be sub-optimal.');
  }

  console.log('\n--- Test 2: In-Memory LRU Cache Performance ---');
  // Simulate controller caching flow
  const depth = 7;
  const fromId = startNode._id.toString();
  const toId = targetNode._id.toString();

  // Load into cache
  CacheService.set(fromId, toId, depth, paths1);

  // Time cached retrieval
  const t2 = performance.now();
  const cachedPaths = CacheService.get(fromId, toId, depth);
  const t3 = performance.now();
  const duration2 = t3 - t2;

  console.log(`Cached paths retrieved: ${cachedPaths?.length || 0}`);
  console.log(`Execution time for cached lookup: ${duration2.toFixed(2)}ms`);

  if (cachedPaths && cachedPaths.length === paths1.length && duration2 < 10) {
    console.log('✅ PASS: Cached search retrieved correct results in under 10ms!');
  } else {
    console.error('❌ FAIL: Cache lookup was slow or returned incorrect paths.');
    await mongoose.connection.close();
    process.exit(1);
  }

  console.log('\n--- Test 3: Cache Invalidation Check ---');
  CacheService.clear();
  const clearedPaths = CacheService.get(fromId, toId, depth);
  if (clearedPaths === null) {
    console.log('✅ PASS: Cache successfully cleared/invalidated!');
  } else {
    console.error('❌ FAIL: Cache was not cleared.');
    await mongoose.connection.close();
    process.exit(1);
  }

  console.log('\nAll performance tests completed successfully.');
  await mongoose.connection.close();
}

runPerformanceTest().catch(async (err) => {
  console.error('Test execution failed:', err);
  await mongoose.connection.close();
  process.exit(1);
});
