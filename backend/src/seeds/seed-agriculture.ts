import mongoose from 'mongoose';
import { getOrCreateSharedNodes, ensureConnection, ISharedNodes } from './seed-helper';
import { 
  SubjectCombinationNodeModel, 
  ExamNodeModel, 
  DegreeNodeModel, 
  OccupationNodeModel, 
  SkillNodeModel, 
  InstituteNodeModel, 
  NodeType
} from '../models/Node';
import { RelationshipModel, RelationshipType } from '../models/Relationship';

export const seedAgriculture = async (shared: ISharedNodes): Promise<void> => {
  console.log('Seeding Agriculture Pathway...');

  // 1. Fetch PCB and PCMB subject combinations
  const pcb = await SubjectCombinationNodeModel.findOne({ name: 'PCB', type: NodeType.SubjectCombination });
  const pcmb = await SubjectCombinationNodeModel.findOne({ name: 'PCMB', type: NodeType.SubjectCombination });
  
  // 2. Exams
  const icarAieea = await ExamNodeModel.findOneAndUpdate(
    { name: 'ICAR AIEEA UG', type: NodeType.Exam },
    { 
      conductingBody: 'NTA', 
      website: 'https://icar.nta.ac.in', 
      frequency: 'ANNUAL',
      description: 'All India Entrance Examination for Admission to undergraduate agricultural science degrees' 
    },
    { upsert: true, new: true }
  );

  // Link PCB to agriculture exam
  if (pcb) {
    await RelationshipModel.findOneAndUpdate(
      { fromNode: pcb._id, toNode: icarAieea._id, type: RelationshipType.EligibleFor },
      {},
      { upsert: true }
    );
  }

  // Link PCMB to agriculture exam
  if (pcmb) {
    await RelationshipModel.findOneAndUpdate(
      { fromNode: pcmb._id, toNode: icarAieea._id, type: RelationshipType.EligibleFor },
      {},
      { upsert: true }
    );
  }

  // 3. Degrees
  const bscAgri = await DegreeNodeModel.findOneAndUpdate(
    { name: 'B.Sc (Hons) in Agriculture', type: NodeType.Degree },
    { 
      durationYears: 4, 
      level: 'UG',
      description: 'Four-year degree study in agronomy, plant pathology, genetics, agricultural economics, and soil science' 
    },
    { upsert: true, new: true }
  );

  // Link Exam to Degree
  await RelationshipModel.findOneAndUpdate(
    { fromNode: icarAieea._id, toNode: bscAgri._id, type: RelationshipType.LeadsTo },
    {},
    { upsert: true }
  );

  // 4. Occupations
  const agronomist = await OccupationNodeModel.findOneAndUpdate(
    { name: 'Agronomist / Crop Scientist', type: NodeType.Occupation },
    { 
      averageSalaryRange: { min: 450000, max: 1400000, currency: 'INR' },
      growthRate: 'MEDIUM',
      sector: 'Agriculture & Biotechnology',
      description: 'Research crop rotation, plant breeding, soil health, and develop sustainable farming frameworks' 
    },
    { upsert: true, new: true }
  );

  // Link Degrees to Occupations
  await RelationshipModel.findOneAndUpdate(
    { fromNode: bscAgri._id, toNode: agronomist._id, type: RelationshipType.LeadsTo },
    {},
    { upsert: true }
  );

  // 5. Skills
  const soilScience = await SkillNodeModel.findOneAndUpdate(
    { name: 'Soil Science & Testing', type: NodeType.Skill },
    { category: 'TECHNICAL', description: 'Analyzing soil chemistry, nutrient compositions, water holding indices' },
    { upsert: true, new: true }
  );

  // Link Occupations to Skills
  await RelationshipModel.findOneAndUpdate(
    { fromNode: agronomist._id, toNode: soilScience._id, type: RelationshipType.Requires },
    {},
    { upsert: true }
  );

  // 6. Institutes
  const gbpuat = await InstituteNodeModel.findOneAndUpdate(
    { name: 'Govind Ballabh Pant University of Agriculture and Technology', type: NodeType.Institute },
    { 
      location: { city: 'Pantnagar', state: 'Uttarakhand' },
      ownership: 'GOVERNMENT',
      description: 'First agricultural university in India, pioneer of the Green Revolution' 
    },
    { upsert: true, new: true }
  );

  // Link Institutes to degrees they offer
  await RelationshipModel.findOneAndUpdate(
    { fromNode: gbpuat._id, toNode: bscAgri._id, type: RelationshipType.Offers },
    {},
    { upsert: true }
  );

  console.log('Agriculture Seeding Complete!');
};

// Check if run directly
if (require.main === module) {
  (async () => {
    try {
      await ensureConnection();
      const shared = await getOrCreateSharedNodes();
      await seedAgriculture(shared);
      await mongoose.connection.close();
      console.log('Standalone Agriculture Seeding Completed Successfully.');
      process.exit(0);
    } catch (err) {
      console.error('Standalone Agriculture Seeding Failed:', err);
      process.exit(1);
    }
  })();
}
