import mongoose from 'mongoose';
import { connectDatabase } from './config/db';
import { NodeModel, NodeType } from './models/Node';
import { InstituteCourseMappingModel } from './models/InstituteCourseMapping';
import dotenv from 'dotenv';

dotenv.config();

async function runTest() {
  try {
    await connectDatabase();

    console.log('--- DB NODES CHECK ---');
    const nodes = await NodeModel.find({
      type: { $in: [NodeType.Institute, NodeType.Degree, NodeType.Exam] }
    }).select('name type');

    console.log(`Found ${nodes.length} matching nodes:`);
    nodes.forEach(n => {
      console.log(` - [${n.type}] ${n.name} (${n._id})`);
    });

    console.log('\n--- MAPPINGS CHECK ---');
    const mappings = await InstituteCourseMappingModel.find()
      .populate('institute')
      .populate('degree')
      .populate('entranceExam');
    
    console.log(`Found ${mappings.length} mappings:`);
    mappings.forEach((m, idx) => {
      console.log(`\nMapping #${idx + 1}:`);
      console.log(` - Institute: ${m.institute ? (m.institute as any).name : 'N/A'}`);
      console.log(` - Degree: ${m.degree ? (m.degree as any).name : 'N/A'}`);
      console.log(` - Exam: ${m.entranceExam ? (m.entranceExam as any).name : 'None'}`);
      console.log(` - Specialization: ${m.specialization}`);
      console.log(` - Fees: ${m.fees}, Seats: ${m.seats}`);
    });

    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
    await mongoose.connection.close();
  }
}

runTest();
