import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDatabase } from '../config/db';
import { NodeModel, NodeType, INode, DegreeNodeModel, ExamNodeModel } from '../models/Node';
import { RelationshipModel, RelationshipType } from '../models/Relationship';
import { InstituteCourseMappingModel } from '../models/InstituteCourseMapping';

dotenv.config();

async function runPgGovtMigration() {
  try {
    await connectDatabase();
    console.log('--- STARTING PG PATHWAYS & GOVT EXAMS EXPANSION MIGRATION ---');

    // 1. Helper to find or create nodes
    const getOrCreateDegree = async (name: string, durationYears: number, level: 'UG' | 'PG'): Promise<INode> => {
      let deg = await NodeModel.findOne({ name, type: NodeType.Degree });
      if (!deg) {
        deg = await DegreeNodeModel.create({
          name,
          type: NodeType.Degree,
          description: `${name} postgraduate degree course.`,
          durationYears,
          level
        });
        console.log(`Created PG Degree Node: ${name}`);
      }
      return deg;
    };

    const getOrCreateExam = async (name: string, body: string, website: string): Promise<INode> => {
      let exam = await NodeModel.findOne({ name, type: NodeType.Exam });
      if (!exam) {
        exam = await ExamNodeModel.create({
          name,
          type: NodeType.Exam,
          description: `${name} entrance examination conducted by ${body}.`,
          conductingBody: body,
          website,
          frequency: 'ANNUAL'
        });
        console.log(`Created Exam Node: ${name}`);
      }
      return exam;
    };

    const ensureRelationship = async (from: any, to: any, type: RelationshipType, description: string = '') => {
      if (!from || !to) return;
      await RelationshipModel.findOneAndUpdate(
        { fromNode: from._id, toNode: to._id, type },
        { $set: { 'metadata.description': description } },
        { upsert: true }
      );
    };

    const ensureMapping = async (data: {
      institute: any;
      degree: any;
      entranceExam?: any;
      specialization: string;
      fees: number;
      seats: number;
      averageSalary: number;
      placementRate: number;
    }) => {
      if (!data.institute || !data.degree) return;
      await InstituteCourseMappingModel.findOneAndUpdate(
        { 
          institute: data.institute._id, 
          degree: data.degree._id, 
          specialization: data.specialization 
        },
        {
          $set: {
            entranceExam: data.entranceExam ? data.entranceExam._id : undefined,
            fees: data.fees,
            seats: data.seats,
            placementStats: {
              averageSalary: data.averageSalary,
              placementRate: data.placementRate
            }
          }
        },
        { upsert: true }
      );
      console.log(`Course Mapping: ${data.institute.name} offers ${data.degree.name} (${data.specialization})`);
    };

    // 2. Create PG degree nodes
    const msc = await getOrCreateDegree('M.Sc', 2, 'PG');
    const ma = await getOrCreateDegree('M.A', 2, 'PG');
    const mtech = await getOrCreateDegree('M.Tech', 2, 'PG');
    const mba = await NodeModel.findOne({ name: 'MBA', type: NodeType.Degree }) ||
                await getOrCreateDegree('MBA', 2, 'PG');

    // Create PG entrance exams
    const gate = await getOrCreateExam('GATE', 'IITs', 'https://gate.iitb.ac.in');
    const cuetPg = await getOrCreateExam('CUET PG', 'NTA', 'https://cuet.nta.nic.in');

    // Ensure exam-to-degree leads to
    await ensureRelationship(gate, mtech, RelationshipType.LeadsTo, 'Admissions to M.Tech courses via GATE');
    await ensureRelationship(cuetPg, msc, RelationshipType.LeadsTo, 'Admissions to M.Sc courses via CUET PG');
    await ensureRelationship(cuetPg, ma, RelationshipType.LeadsTo, 'Admissions to M.A courses via CUET PG');

    // 3. Fetch all UG Degrees
    const allUgDegrees = await NodeModel.find({ type: NodeType.Degree, level: 'UG' });
    console.log(`Fetched ${allUgDegrees.length} UG Degrees for transition mappings.`);

    const cat = await NodeModel.findOne({ name: 'CAT', type: NodeType.Exam });
    const sscCgl = await NodeModel.findOne({ name: 'SSC CGL', type: NodeType.Exam });
    const cdsExam = await NodeModel.findOne({ name: 'CDS Exam', type: NodeType.Exam }) || 
                    await NodeModel.findOne({ name: 'CDS', type: NodeType.Exam });

    if (!cat || !sscCgl || !cdsExam) {
      throw new Error('Core exams (CAT, SSC CGL, CDS) not found in DB.');
    }

    // 4. Map UG to PG and Government exams
    for (const ug of allUgDegrees) {
      const name = ug.name;

      // Connect ALL UG degrees to CAT (for MBA)
      await ensureRelationship(ug, cat, RelationshipType.EligibleFor, 'Eligible for CAT after graduation');

      // Connect ALL UG degrees to MBA directly (for direct/sponsored admission)
      await ensureRelationship(ug, mba, RelationshipType.EligibleFor, 'Direct/sponsored admission to MBA');

      // Connect ALL UG degrees to SSC CGL (for public inspector roles)
      await ensureRelationship(ug, sscCgl, RelationshipType.EligibleFor, 'Eligible for SSC CGL government posts');

      // Connect ALL UG degrees to CDS Exam (for defense officer roles)
      await ensureRelationship(ug, cdsExam, RelationshipType.EligibleFor, 'Eligible for CDS exam wings after graduation');

      // Connect Science UG degrees -> M.Sc
      const isScience = name.includes('B.Sc') || name.includes('B.Pharm') || name.includes('BPT') || name.includes('MBBS') || name.includes('BDS') || name.includes('BAMS') || name.includes('BHMS');
      if (isScience) {
        await ensureRelationship(ug, cuetPg, RelationshipType.EligibleFor, 'Eligible for M.Sc admissions via CUET PG');
        await ensureRelationship(ug, msc, RelationshipType.EligibleFor, 'Direct/merit admission to M.Sc');
      }

      // Connect Arts/Humanities/Law UG degrees -> M.A
      const isArts = name.includes('B.A.') || name.includes('B.A') || name.includes('B.Com') || name.includes('BBA') || name.includes('B.Des');
      if (isArts) {
        await ensureRelationship(ug, cuetPg, RelationshipType.EligibleFor, 'Eligible for M.A admissions via CUET PG');
        await ensureRelationship(ug, ma, RelationshipType.EligibleFor, 'Direct/merit admission to M.A');
      }

      // Connect Engineering/Tech UG degrees -> M.Tech
      const isEngineering = name.includes('B.Tech') || name.includes('B.Arch') || name.includes('BCA');
      if (isEngineering) {
        await ensureRelationship(ug, gate, RelationshipType.EligibleFor, 'Eligible for M.Tech admissions via GATE');
        await ensureRelationship(ug, mtech, RelationshipType.EligibleFor, 'Direct/sponsored admission to M.Tech');
      }
    }
    console.log('Graph relationships for PG and Government exams successfully completed!');

    // 5. Connect premier institutes to offered PG degrees
    const iitBombay = await NodeModel.findOne({ name: 'Indian Institute of Technology Bombay', type: NodeType.Institute });
    const stStephens = await NodeModel.findOne({ name: "St. Stephen's College Delhi", type: NodeType.Institute });
    const iimAhmedabad = await NodeModel.findOne({ name: 'Indian Institute of Management Ahmedabad', type: NodeType.Institute });

    console.log('\nEnsuring institute offered relationships and mappings for PG...');
    // IIT Bombay -> M.Tech
    if (iitBombay) {
      await ensureRelationship(iitBombay, mtech, RelationshipType.Offers, 'Offers M.Tech PG courses');
      await ensureRelationship(iitBombay, gate, RelationshipType.Requires, 'Requires GATE exam for M.Tech admissions');
      await ensureMapping({
        institute: iitBombay,
        degree: mtech,
        entranceExam: gate,
        specialization: 'Technology & Engineering (M.Tech)',
        fees: 90000,
        seats: 300,
        averageSalary: 1800000,
        placementRate: 96
      });
    }

    // St. Stephen's -> M.A, M.Sc
    if (stStephens) {
      await ensureRelationship(stStephens, ma, RelationshipType.Offers, 'Offers Master of Arts courses');
      await ensureRelationship(stStephens, msc, RelationshipType.Offers, 'Offers Master of Science courses');
      await ensureRelationship(stStephens, cuetPg, RelationshipType.Requires, 'Requires CUET PG for postgraduate admission');
      
      await ensureMapping({
        institute: stStephens,
        degree: ma,
        entranceExam: cuetPg,
        specialization: 'History (M.A)',
        fees: 25000,
        seats: 40,
        averageSalary: 900000,
        placementRate: 88
      });

      await ensureMapping({
        institute: stStephens,
        degree: msc,
        entranceExam: cuetPg,
        specialization: 'Mathematics (M.Sc)',
        fees: 28000,
        seats: 30,
        averageSalary: 1000000,
        placementRate: 89
      });
    }

    // Ensure M.Sc, M.A, M.Tech lead to their corresponding Occupations (e.g. Researcher, Professor)
    const researcher = await NodeModel.findOne({ name: 'Historian / Research Analyst', type: NodeType.Occupation });
    if (researcher) {
      await ensureRelationship(ma, researcher, RelationshipType.LeadsTo, 'Leads to advanced research roles');
    }

    console.log('\n--- PG PATHWAYS & GOVT EXAMS MIGRATION SUCCESSFULLY COMPLETED ---');
    await mongoose.connection.close();
  } catch (err) {
    console.error('Migration failed:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
}

runPgGovtMigration();
