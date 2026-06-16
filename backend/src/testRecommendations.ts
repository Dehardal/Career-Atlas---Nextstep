import mongoose from 'mongoose';
import { connectDatabase } from './config/db';
import { NodeModel, NodeType } from './models/Node';
import { RelationshipModel, RelationshipType } from './models/Relationship';
import { InstituteCourseMappingModel } from './models/InstituteCourseMapping';

async function runTest() {
  await connectDatabase();

  console.log('--- RECOMMENDATION ENGINE TEST ---');

  // 1. Fetch a degree and an occupation
  const degree = await NodeModel.findOne({ name: { $regex: /B.Tech/i }, type: NodeType.Degree });
  const career = await NodeModel.findOne({ name: { $regex: /Software/i }, type: NodeType.Occupation });

  if (!degree) {
    console.error('Could not find a Degree node (e.g. B.Tech).');
    mongoose.connection.close();
    process.exit(1);
  }

  console.log(`Found Degree: ${degree.name} (${degree._id})`);

  if (career) {
    console.log(`Found Occupation: ${career.name} (${career._id})`);
    
    // Ensure there is a relationship connecting B.Tech CSE to Software Engineer
    const leadsToRel = await RelationshipModel.findOne({
      fromNode: degree._id,
      toNode: career._id,
      type: RelationshipType.LeadsTo
    });

    if (!leadsToRel) {
      console.log(`Creating LeadsTo relationship from ${degree.name} to ${career.name}...`);
      await RelationshipModel.create({
        fromNode: degree._id,
        toNode: career._id,
        type: RelationshipType.LeadsTo,
        metadata: { description: 'Graduates enter as junior software developers.' }
      });
    }
  }

  // 2. Query recommendations by Degree (Degree-Based)
  console.log('\n--- 2. Recommendations for Degree:', degree.name);
  const degreeRecommendations = await InstituteCourseMappingModel.find({ degree: degree._id })
    .populate('institute')
    .populate('degree');

  console.log(`Found ${degreeRecommendations.length} recommendations:`);
  degreeRecommendations.forEach((rec: any, idx) => {
    console.log(`  [${idx + 1}] Institute: ${rec.institute?.name}`);
    console.log(`      Ownership: ${rec.institute?.ownership} | State: ${rec.institute?.location?.state}`);
    console.log(`      Specialization: ${rec.specialization} | Fees: INR ${rec.fees}`);
    console.log(`      NIRF Rank: #${rec.institute?.nirfRanking ?? 'N/A'}`);
    console.log(`      Placement stats: ${rec.placementStats?.averageSalary ? `Average package ₹${(rec.placementStats.averageSalary/100000).toFixed(1)}L` : 'N/A'}, Placement rate: ${rec.placementStats?.placementRate ?? 'N/A'}%`);
  });

  // 3. Query recommendations by Career (Career-Based)
  if (career) {
    console.log('\n--- 3. Recommendations for Career:', career.name);
    // Find degrees that lead to this career
    const relationships = await RelationshipModel.find({ toNode: career._id });
    const fromNodeIds = relationships.map(r => r.fromNode);
    
    const degrees = await NodeModel.find({
      _id: { $in: fromNodeIds },
      type: NodeType.Degree
    });
    const degreeIds = degrees.map(d => d._id);

    const careerRecommendations = await InstituteCourseMappingModel.find({
      degree: { $in: degreeIds }
    })
      .populate('institute')
      .populate('degree');

    console.log(`Found ${careerRecommendations.length} recommendations linked to this career:`);
    careerRecommendations.forEach((rec: any, idx) => {
      console.log(`  [${idx + 1}] Institute: ${rec.institute?.name} (via degree ${rec.degree?.name})`);
      console.log(`      Placement stats: Average package ₹${(rec.placementStats?.averageSalary/100000).toFixed(1)}L, Placement rate: ${rec.placementStats?.placementRate}%`);
    });
  }

  // 4. Test Sorting by package descending
  console.log('\n--- 4. Recommendations sorted by Package (Average package descending):');
  const allRecs = await InstituteCourseMappingModel.find()
    .populate('institute')
    .populate('degree');
  
  allRecs.sort((a: any, b: any) => {
    const pkgA = a.placementStats?.averageSalary ?? 0;
    const pkgB = b.placementStats?.averageSalary ?? 0;
    return pkgB - pkgA;
  });

  allRecs.forEach((rec: any, idx) => {
    console.log(`  [${idx + 1}] ${rec.institute?.name} | Specialization: ${rec.specialization}`);
    console.log(`      Avg Package: ₹${(rec.placementStats?.averageSalary / 100000).toFixed(2)}L | Placement Rate: ${rec.placementStats?.placementRate}%`);
  });

  mongoose.connection.close();
  console.log('\n--- TEST FINISHED ---');
}

runTest().catch((err) => {
  console.error('Test run failed:', err);
  mongoose.connection.close();
  process.exit(1);
});
