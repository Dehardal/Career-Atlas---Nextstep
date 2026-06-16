import mongoose from 'mongoose';
import { getOrCreateSharedNodes, ensureConnection, ISharedNodes } from './seed-helper';
import { 
  ExamNodeModel, 
  DegreeNodeModel, 
  OccupationNodeModel, 
  SkillNodeModel, 
  InstituteNodeModel, 
  NodeType
} from '../models/Node';
import { RelationshipModel, RelationshipType } from '../models/Relationship';

export const seedHospitality = async (shared: ISharedNodes): Promise<void> => {
  console.log('Seeding Hospitality Pathway...');

  // 1. Exams
  const nchmctJee = await ExamNodeModel.findOneAndUpdate(
    { name: 'NCHMCT JEE', type: NodeType.Exam },
    { 
      conductingBody: 'NTA', 
      website: 'https://nchmjee.nta.nic.in', 
      frequency: 'ANNUAL',
      description: 'National Council for Hotel Management Joint Entrance Examination for undergraduate hotel administration' 
    },
    { upsert: true, new: true }
  );

  // Link Class 12 to exam
  await RelationshipModel.findOneAndUpdate(
    { fromNode: shared.class12._id, toNode: nchmctJee._id, type: RelationshipType.EligibleFor },
    {},
    { upsert: true }
  );

  // 2. Degrees
  const bscHha = await DegreeNodeModel.findOneAndUpdate(
    { name: 'B.Sc in Hospitality & Hotel Administration', type: NodeType.Degree },
    { 
      durationYears: 3, 
      level: 'UG',
      description: 'Three-year undergraduate degree covering food production, food & beverage service, housekeeping, and front office' 
    },
    { upsert: true, new: true }
  );

  // Link Exam to Degree
  await RelationshipModel.findOneAndUpdate(
    { fromNode: nchmctJee._id, toNode: bscHha._id, type: RelationshipType.LeadsTo },
    {},
    { upsert: true }
  );

  // 3. Occupations
  const chef = await OccupationNodeModel.findOneAndUpdate(
    { name: 'Executive Chef', type: NodeType.Occupation },
    { 
      averageSalaryRange: { min: 500000, max: 2000000, currency: 'INR' },
      growthRate: 'MEDIUM',
      sector: 'Hospitality',
      description: 'Head of professional kitchen managing food planning, recipes, culinary crews, and logistics' 
    },
    { upsert: true, new: true }
  );

  const hotelManager = await OccupationNodeModel.findOneAndUpdate(
    { name: 'Hotel Operations General Manager', type: NodeType.Occupation },
    { 
      averageSalaryRange: { min: 800000, max: 2500000, currency: 'INR' },
      growthRate: 'HIGH',
      sector: 'Hospitality',
      description: 'Overseeing all hotel operations, guest services, housekeeping, budgeting, and events' 
    },
    { upsert: true, new: true }
  );

  // Link Degrees to Occupations
  await RelationshipModel.findOneAndUpdate(
    { fromNode: bscHha._id, toNode: chef._id, type: RelationshipType.LeadsTo },
    {},
    { upsert: true }
  );

  await RelationshipModel.findOneAndUpdate(
    { fromNode: bscHha._id, toNode: hotelManager._id, type: RelationshipType.LeadsTo },
    {},
    { upsert: true }
  );

  // 4. Skills
  const culinaryArts = await SkillNodeModel.findOneAndUpdate(
    { name: 'Culinary Arts & Food Production', type: NodeType.Skill },
    { category: 'TECHNICAL', description: 'Recipe development, knife skills, food safety, inventory control, and menu creation' },
    { upsert: true, new: true }
  );

  // Link Occupations to Skills
  await RelationshipModel.findOneAndUpdate(
    { fromNode: chef._id, toNode: culinaryArts._id, type: RelationshipType.Requires },
    {},
    { upsert: true }
  );

  // 5. Institutes
  const ihmPusa = await InstituteNodeModel.findOneAndUpdate(
    { name: 'Institute of Hotel Management Catering & Nutrition Pusa Delhi', type: NodeType.Institute },
    { 
      location: { city: 'New Delhi', state: 'Delhi' },
      ownership: 'GOVERNMENT',
      description: 'Top-ranked hospitality education institute under NCHMCT' 
    },
    { upsert: true, new: true }
  );

  // Link Institutes to degrees they offer
  await RelationshipModel.findOneAndUpdate(
    { fromNode: ihmPusa._id, toNode: bscHha._id, type: RelationshipType.Offers },
    {},
    { upsert: true }
  );

  console.log('Hospitality Seeding Complete!');
};

// Check if run directly
if (require.main === module) {
  (async () => {
    try {
      await ensureConnection();
      const shared = await getOrCreateSharedNodes();
      await seedHospitality(shared);
      await mongoose.connection.close();
      console.log('Standalone Hospitality Seeding Completed Successfully.');
      process.exit(0);
    } catch (err) {
      console.error('Standalone Hospitality Seeding Failed:', err);
      process.exit(1);
    }
  })();
}
