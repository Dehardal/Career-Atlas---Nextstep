import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDatabase } from '../config/db';
import { NodeModel, NodeType, INode } from '../models/Node';
import { RelationshipModel, RelationshipType } from '../models/Relationship';
import { InstituteCourseMappingModel } from '../models/InstituteCourseMapping';

dotenv.config();

async function runMigration() {
  try {
    await connectDatabase();
    console.log('--- STARTING INSTITUTE COVERAGE COMPLETION MIGRATION ---');

    // 1. Merge duplicate SRCC Delhi node into canonical Shri Ram College of Commerce (SRCC) Delhi
    const srccDelhi = await NodeModel.findOne({ name: 'SRCC Delhi', type: NodeType.Institute });
    const canonicalSrcc = await NodeModel.findOne({ name: 'Shri Ram College of Commerce (SRCC) Delhi', type: NodeType.Institute });

    if (srccDelhi && canonicalSrcc) {
      console.log(`Merging SRCC Delhi (${srccDelhi._id}) into Shri Ram College of Commerce (SRCC) Delhi (${canonicalSrcc._id})...`);

      // Redirect relationships
      const relationships = await RelationshipModel.find({
        $or: [
          { fromNode: srccDelhi._id },
          { toNode: srccDelhi._id }
        ]
      });

      console.log(`Found ${relationships.length} relationships connected to SRCC Delhi.`);
      for (const rel of relationships) {
        const fromId = rel.fromNode.toString() === srccDelhi._id.toString() ? canonicalSrcc._id : rel.fromNode;
        const toId = rel.toNode.toString() === srccDelhi._id.toString() ? canonicalSrcc._id : rel.toNode;

        const existRel = await RelationshipModel.findOne({
          fromNode: fromId,
          toNode: toId,
          type: rel.type
        });

        if (existRel) {
          console.log(`Relationship of type ${rel.type} already exists for canonical SRCC. Deleting duplicate.`);
          await RelationshipModel.findByIdAndDelete(rel._id);
        } else {
          rel.fromNode = fromId as any;
          rel.toNode = toId as any;
          await rel.save();
        }
      }

      // Redirect Course Mappings (if any)
      const updatedMappings = await InstituteCourseMappingModel.updateMany(
        { institute: srccDelhi._id },
        { institute: canonicalSrcc._id }
      );
      console.log(`Updated ${updatedMappings.modifiedCount} course mappings.`);

      // Delete duplicate node
      await NodeModel.findByIdAndDelete(srccDelhi._id);
      console.log('Deleted duplicate SRCC Delhi node successfully.');
    } else if (srccDelhi && !canonicalSrcc) {
      console.log('Renaming SRCC Delhi to Shri Ram College of Commerce (SRCC) Delhi to serve as canonical.');
      srccDelhi.name = 'Shri Ram College of Commerce (SRCC) Delhi';
      await srccDelhi.save();
    } else {
      console.log('No duplicate SRCC Delhi node found.');
    }

    // Fetch required nodes
    const iitBombay = await NodeModel.findOne({ name: 'Indian Institute of Technology Bombay', type: NodeType.Institute });
    const aiimsDelhi = await NodeModel.findOne({ name: 'All India Institute of Medical Sciences Delhi', type: NodeType.Institute });
    const ndaKhadakwasla = await NodeModel.findOne({ name: 'National Defence Academy Khadakwasla', type: NodeType.Institute });
    const stStephens = await NodeModel.findOne({ name: "St. Stephen's College Delhi", type: NodeType.Institute });
    const ihmPusa = await NodeModel.findOne({ name: 'Institute of Hotel Management Catering & Nutrition Pusa Delhi', type: NodeType.Institute });
    const gbpuat = await NodeModel.findOne({ name: 'Govind Ballabh Pant University of Agriculture and Technology', type: NodeType.Institute });

    const btechCse = await NodeModel.findOne({ name: 'B.Tech CSE', type: NodeType.Degree });
    const btechAi = await NodeModel.findOne({ name: 'B.Tech AI', type: NodeType.Degree });
    const mbbs = await NodeModel.findOne({ name: 'MBBS', type: NodeType.Degree });
    const bscNursing = await NodeModel.findOne({ name: 'B.Sc Nursing', type: NodeType.Degree });
    const baEnglish = await NodeModel.findOne({ name: 'B.A. (Hons) in English', type: NodeType.Degree });
    const bscMilStudies = await NodeModel.findOne({ name: 'B.Sc in Military Studies', type: NodeType.Degree });
    const bscHospitality = await NodeModel.findOne({ name: 'B.Sc in Hospitality & Hotel Administration', type: NodeType.Degree });
    const bscAgri = await NodeModel.findOne({ name: 'B.Sc (Hons) in Agriculture', type: NodeType.Degree });

    const jeeAdvanced = await NodeModel.findOne({ name: 'JEE Advanced', type: NodeType.Exam });
    const neet = await NodeModel.findOne({ name: 'NEET', type: NodeType.Exam });
    const ndaExam = await NodeModel.findOne({ name: 'NDA Exam', type: NodeType.Exam }) || await NodeModel.findOne({ name: 'NDA', type: NodeType.Exam });
    const cuetArts = await NodeModel.findOne({ name: 'CUET UG (Arts & Humanities)', type: NodeType.Exam });
    const nchmctJee = await NodeModel.findOne({ name: 'NCHMCT JEE', type: NodeType.Exam });
    const icarAieea = await NodeModel.findOne({ name: 'ICAR AIEEA UG', type: NodeType.Exam });

    // Helper to ensure relationship exists
    const ensureRelationship = async (from: any, to: any, type: RelationshipType) => {
      if (!from || !to) return;
      await RelationshipModel.findOneAndUpdate(
        { fromNode: from._id, toNode: to._id, type },
        {},
        { upsert: true }
      );
      console.log(`Relationship ensured: ${from.name} --[${type}]--> ${to.name}`);
    };

    // Helper to ensure Course Mapping exists
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
      if (!data.institute || !data.degree) {
        console.warn(`Skipping mapping for missing institute or degree: ${data.specialization}`);
        return;
      }

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
      console.log(`Course Mapping ensured: ${data.institute.name} offering ${data.degree.name} (${data.specialization})`);
    };

    // 2. Ensure Graph relationships are complete
    console.log('\nEnsuring graph relationships...');
    // IIT Bombay -> B.Tech AI (Offers)
    await ensureRelationship(iitBombay, btechAi, RelationshipType.Offers);
    await ensureRelationship(iitBombay, jeeAdvanced, RelationshipType.Requires);

    // IHM Pusa -> Hospitality (Offers, Requires)
    await ensureRelationship(ihmPusa, bscHospitality, RelationshipType.Offers);
    await ensureRelationship(ihmPusa, nchmctJee, RelationshipType.Requires);

    // NDA Khadakwasla -> Military studies (Offers, Requires)
    await ensureRelationship(ndaKhadakwasla, bscMilStudies, RelationshipType.Offers);
    await ensureRelationship(ndaKhadakwasla, ndaExam, RelationshipType.Requires);

    // 3. Ensure Course Mappings are complete
    console.log('\nEnsuring course mapping documents...');

    // IIT Bombay - B.Tech CSE (verify/complete)
    await ensureMapping({
      institute: iitBombay,
      degree: btechCse,
      entranceExam: jeeAdvanced,
      specialization: 'Computer Science & Engineering',
      fees: 220000,
      seats: 120,
      averageSalary: 2400000,
      placementRate: 98
    });

    // IIT Bombay - B.Tech AI
    await ensureMapping({
      institute: iitBombay,
      degree: btechAi,
      entranceExam: jeeAdvanced,
      specialization: 'Artificial Intelligence & Machine Learning',
      fees: 220000,
      seats: 60,
      averageSalary: 2600000,
      placementRate: 99
    });

    // AIIMS Delhi - MBBS (verify/complete)
    await ensureMapping({
      institute: aiimsDelhi,
      degree: mbbs,
      entranceExam: neet,
      specialization: 'General Medicine',
      fees: 1628,
      seats: 125,
      averageSalary: 1800000,
      placementRate: 99
    });

    // AIIMS Delhi - B.Sc Nursing
    await ensureMapping({
      institute: aiimsDelhi,
      degree: bscNursing,
      entranceExam: neet,
      specialization: 'Nursing',
      fees: 1500,
      seats: 50,
      averageSalary: 450000,
      placementRate: 95
    });

    // St. Stephen's - B.A. (Hons) in English
    await ensureMapping({
      institute: stStephens,
      degree: baEnglish,
      entranceExam: cuetArts,
      specialization: 'English (Hons)',
      fees: 40000,
      seats: 60,
      averageSalary: 750000,
      placementRate: 89
    });

    // NDA Khadakwasla - B.Sc in Military Studies
    await ensureMapping({
      institute: ndaKhadakwasla,
      degree: bscMilStudies,
      entranceExam: ndaExam,
      specialization: 'Military Studies',
      fees: 0,
      seats: 350,
      averageSalary: 1200000,
      placementRate: 100
    });

    // IHM Pusa - B.Sc in Hospitality & Hotel Administration
    await ensureMapping({
      institute: ihmPusa,
      degree: bscHospitality,
      entranceExam: nchmctJee,
      specialization: 'Hospitality & Hotel Administration',
      fees: 120000,
      seats: 180,
      averageSalary: 550000,
      placementRate: 94
    });

    // GBPUAT - B.Sc (Hons) in Agriculture
    await ensureMapping({
      institute: gbpuat,
      degree: bscAgri,
      entranceExam: icarAieea,
      specialization: 'Agriculture',
      fees: 50000,
      seats: 120,
      averageSalary: 600000,
      placementRate: 90
    });

    console.log('\n--- INSTITUTE COVERAGE COMPLETION MIGRATION COMPLETED SUCCESSFUL ---');
    await mongoose.connection.close();
  } catch (err) {
    console.error('Migration failed:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
}

runMigration();
