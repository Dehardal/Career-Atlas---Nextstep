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

export const seedDesign = async (shared: ISharedNodes): Promise<void> => {
  console.log('Seeding Design Pathway...');

  // 1. Exams
  const uceed = await ExamNodeModel.findOneAndUpdate(
    { name: 'UCEED', type: NodeType.Exam },
    { 
      conductingBody: 'IIT Bombay', 
      website: 'https://www.uceed.iitb.ac.in', 
      frequency: 'ANNUAL',
      description: 'Undergraduate Common Entrance Examination for Design admissions in IITs and partner institutes' 
    },
    { upsert: true, new: true }
  );

  const nidDat = await ExamNodeModel.findOneAndUpdate(
    { name: 'NID DAT', type: NodeType.Exam },
    { 
      conductingBody: 'National Institute of Design', 
      website: 'https://admissions.nid.edu', 
      frequency: 'ANNUAL',
      description: 'Design Aptitude Test for admission to NID campuses' 
    },
    { upsert: true, new: true }
  );

  // Link Class 12 to design exams
  await RelationshipModel.findOneAndUpdate(
    { fromNode: shared.class12._id, toNode: uceed._id, type: RelationshipType.EligibleFor },
    {},
    { upsert: true }
  );

  await RelationshipModel.findOneAndUpdate(
    { fromNode: shared.class12._id, toNode: nidDat._id, type: RelationshipType.EligibleFor },
    {},
    { upsert: true }
  );

  // 2. Degrees
  const bdes = await DegreeNodeModel.findOneAndUpdate(
    { name: 'B.Des in Product Design', type: NodeType.Degree },
    { 
      durationYears: 4, 
      level: 'UG',
      description: 'Bachelor of Design specializing in product design, ergonomics, and visual aesthetics' 
    },
    { upsert: true, new: true }
  );

  // Link Exams to Degrees
  await RelationshipModel.findOneAndUpdate(
    { fromNode: uceed._id, toNode: bdes._id, type: RelationshipType.LeadsTo },
    {},
    { upsert: true }
  );

  await RelationshipModel.findOneAndUpdate(
    { fromNode: nidDat._id, toNode: bdes._id, type: RelationshipType.LeadsTo },
    {},
    { upsert: true }
  );

  // 3. Occupations
  const uxDesigner = await OccupationNodeModel.findOneAndUpdate(
    { name: 'UX/UI Product Designer', type: NodeType.Occupation },
    { 
      averageSalaryRange: { min: 600000, max: 2000000, currency: 'INR' },
      growthRate: 'HIGH',
      sector: 'Design & IT',
      description: 'Design digital experiences, wireframes, user interfaces, and product blueprints' 
    },
    { upsert: true, new: true }
  );

  // Link Degrees to Occupations
  await RelationshipModel.findOneAndUpdate(
    { fromNode: bdes._id, toNode: uxDesigner._id, type: RelationshipType.LeadsTo },
    {},
    { upsert: true }
  );

  // 4. Skills
  const uxSkill = await SkillNodeModel.findOneAndUpdate(
    { name: 'User Experience & Prototyping', type: NodeType.Skill },
    { category: 'TECHNICAL', description: 'Wireframing, user persona mappings, and creating clickable prototypes using tools like Figma' },
    { upsert: true, new: true }
  );

  // Link Occupations to Skills
  await RelationshipModel.findOneAndUpdate(
    { fromNode: uxDesigner._id, toNode: uxSkill._id, type: RelationshipType.Requires },
    {},
    { upsert: true }
  );

  // 5. Institutes
  const nidAhmedabad = await InstituteNodeModel.findOneAndUpdate(
    { name: 'National Institute of Design Ahmedabad', type: NodeType.Institute },
    { 
      location: { city: 'Ahmedabad', state: 'Gujarat' },
      ownership: 'GOVERNMENT',
      description: 'Premier national design institute recognized as an institution of national importance' 
    },
    { upsert: true, new: true }
  );

  // Link Institutes to degrees they offer
  await RelationshipModel.findOneAndUpdate(
    { fromNode: nidAhmedabad._id, toNode: bdes._id, type: RelationshipType.Offers },
    {},
    { upsert: true }
  );

  // --- NIFT FASHION DESIGN PATHWAY ---
  const niftEntrance = await ExamNodeModel.findOneAndUpdate(
    { name: 'NIFT Entrance Exam', type: NodeType.Exam },
    { 
      conductingBody: 'NIFT', 
      website: 'https://nift.ac.in', 
      frequency: 'ANNUAL',
      description: 'Entrance Examination for admission to NIFT undergraduate programs' 
    },
    { upsert: true, new: true }
  );

  await RelationshipModel.findOneAndUpdate(
    { fromNode: shared.class12._id, toNode: niftEntrance._id, type: RelationshipType.EligibleFor },
    {},
    { upsert: true }
  );

  const bdesFashion = await DegreeNodeModel.findOneAndUpdate(
    { name: 'B.Des Fashion Design', type: NodeType.Degree },
    { 
      durationYears: 4, 
      level: 'UG',
      description: 'Bachelor of Design in Fashion Design covering apparel design, fashion theory, and garment construction' 
    },
    { upsert: true, new: true }
  );

  await RelationshipModel.findOneAndUpdate(
    { fromNode: niftEntrance._id, toNode: bdesFashion._id, type: RelationshipType.LeadsTo },
    {},
    { upsert: true }
  );

  const fashionDesigner = await OccupationNodeModel.findOneAndUpdate(
    { name: 'Fashion Designer', type: NodeType.Occupation },
    { 
      averageSalaryRange: { min: 400000, max: 1500000, currency: 'INR' },
      growthRate: 'MEDIUM',
      sector: 'Design & Fashion',
      description: 'Professional designing and manufacturing apparel, accessories, and fashion ranges' 
    },
    { upsert: true, new: true }
  );

  await RelationshipModel.findOneAndUpdate(
    { fromNode: bdesFashion._id, toNode: fashionDesigner._id, type: RelationshipType.LeadsTo },
    {},
    { upsert: true }
  );

  const fashionSkill = await SkillNodeModel.findOneAndUpdate(
    { name: 'Fashion Illustration & Garment Construction', type: NodeType.Skill },
    { category: 'TECHNICAL', description: 'Sketching design concepts, pattern making, draping, and sewing garments' },
    { upsert: true, new: true }
  );

  await RelationshipModel.findOneAndUpdate(
    { fromNode: fashionDesigner._id, toNode: fashionSkill._id, type: RelationshipType.Requires },
    {},
    { upsert: true }
  );

  const niftDelhi = await InstituteNodeModel.findOneAndUpdate(
    { name: 'National Institute of Fashion Technology Delhi', type: NodeType.Institute },
    { 
      location: { city: 'New Delhi', state: 'Delhi' },
      ownership: 'GOVERNMENT',
      nirfRanking: 11,
      category: 'Design',
      description: 'Premier national institute for fashion technology education in India' 
    },
    { upsert: true, new: true }
  );

  await RelationshipModel.findOneAndUpdate(
    { fromNode: niftDelhi._id, toNode: bdesFashion._id, type: RelationshipType.Offers },
    {},
    { upsert: true }
  );

  await RelationshipModel.findOneAndUpdate(
    { fromNode: niftDelhi._id, toNode: niftEntrance._id, type: RelationshipType.Requires },
    {},
    { upsert: true }
  );

  console.log('Design Seeding Complete!');
};

// Check if run directly
if (require.main === module) {
  (async () => {
    try {
      await ensureConnection();
      const shared = await getOrCreateSharedNodes();
      await seedDesign(shared);
      await mongoose.connection.close();
      console.log('Standalone Design Seeding Completed Successfully.');
      process.exit(0);
    } catch (err) {
      console.error('Standalone Design Seeding Failed:', err);
      process.exit(1);
    }
  })();
}
