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

export const seedDefence = async (shared: ISharedNodes): Promise<void> => {
  console.log('Seeding Defence Pathway...');

  // 1. Exams
  const nda = await ExamNodeModel.findOneAndUpdate(
    { name: 'NDA Exam', type: NodeType.Exam },
    { 
      conductingBody: 'UPSC', 
      website: 'https://upsc.gov.in', 
      frequency: 'BI_ANNUAL',
      description: 'National Defence Academy Entrance Exam for Class 12 candidates' 
    },
    { upsert: true, new: true }
  );

  const cds = await ExamNodeModel.findOneAndUpdate(
    { name: 'CDS Exam', type: NodeType.Exam },
    { 
      conductingBody: 'UPSC', 
      website: 'https://upsc.gov.in', 
      frequency: 'BI_ANNUAL',
      description: 'Combined Defence Services Exam for university graduates' 
    },
    { upsert: true, new: true }
  );

  // Link qualifications to NDA
  await RelationshipModel.findOneAndUpdate(
    { fromNode: shared.class12._id, toNode: nda._id, type: RelationshipType.EligibleFor },
    { metadata: { description: 'Open to Class 12 student appearing or passed' } },
    { upsert: true }
  );

  // 2. Degrees
  const bscMilitary = await DegreeNodeModel.findOneAndUpdate(
    { name: 'B.Sc in Military Studies', type: NodeType.Degree },
    { 
      durationYears: 3, 
      level: 'UG',
      description: 'Three-year undergraduate degree offered inside the National Defence Academy' 
    },
    { upsert: true, new: true }
  );

  // Link Exams to Degrees
  await RelationshipModel.findOneAndUpdate(
    { fromNode: nda._id, toNode: bscMilitary._id, type: RelationshipType.LeadsTo },
    { metadata: { description: 'Requires clearing NDA exam, SSB Interview, and medical tests' } },
    { upsert: true }
  );

  // 3. Occupations
  const armyOfficer = await OccupationNodeModel.findOneAndUpdate(
    { name: 'Commissioned Officer (Indian Army)', type: NodeType.Occupation },
    { 
      averageSalaryRange: { min: 700000, max: 2000000, currency: 'INR' },
      growthRate: 'MEDIUM',
      sector: 'Defence Services',
      description: 'Lieutenant and above ranks in the Indian Armed Forces commanding troops' 
    },
    { upsert: true, new: true }
  );

  // Link Degrees to Occupations
  await RelationshipModel.findOneAndUpdate(
    { fromNode: bscMilitary._id, toNode: armyOfficer._id, type: RelationshipType.LeadsTo },
    { metadata: { description: 'Followed by 1-year training at IMA Dehradun before commissioning' } },
    { upsert: true }
  );

  // Link all Degree nodes to CDS Exam
  const cdsExam = await ExamNodeModel.findOne({ name: 'CDS Exam', type: NodeType.Exam });
  if (cdsExam) {
    const degrees = await DegreeNodeModel.find({});
    for (const degree of degrees) {
      await RelationshipModel.findOneAndUpdate(
        { fromNode: degree._id, toNode: cdsExam._id, type: RelationshipType.EligibleFor },
        { metadata: { description: 'Graduation from a recognized university' } },
        { upsert: true }
      );
    }

    await RelationshipModel.findOneAndUpdate(
      { fromNode: cdsExam._id, toNode: armyOfficer._id, type: RelationshipType.LeadsTo },
      { metadata: { description: 'Requires clearing CDS Exam, SSB Interview, and medical tests' } },
      { upsert: true }
    );
  }

  // 4. Skills
  const leadership = await SkillNodeModel.findOneAndUpdate(
    { name: 'Physical Endurance & Leadership', type: NodeType.Skill },
    { category: 'SOFT', description: 'Exceptional physical fitness, courage, decision-making, and troop command capability' },
    { upsert: true, new: true }
  );

  // Link Occupations to Skills
  await RelationshipModel.findOneAndUpdate(
    { fromNode: armyOfficer._id, toNode: leadership._id, type: RelationshipType.Requires },
    {},
    { upsert: true }
  );

  // 5. Institutes
  const ndaPune = await InstituteNodeModel.findOneAndUpdate(
    { name: 'National Defence Academy Khadakwasla', type: NodeType.Institute },
    { 
      location: { city: 'Pune', state: 'Maharashtra' },
      ownership: 'GOVERNMENT',
      description: 'Joint services academy of the Indian Armed Forces training cadets of three services' 
    },
    { upsert: true, new: true }
  );

  // Link Institutes to degrees they offer
  await RelationshipModel.findOneAndUpdate(
    { fromNode: ndaPune._id, toNode: bscMilitary._id, type: RelationshipType.Offers },
    {},
    { upsert: true }
  );

  console.log('Defence Seeding Complete!');
};

// Check if run directly
if (require.main === module) {
  (async () => {
    try {
      await ensureConnection();
      const shared = await getOrCreateSharedNodes();
      await seedDefence(shared);
      await mongoose.connection.close();
      console.log('Standalone Defence Seeding Completed Successfully.');
      process.exit(0);
    } catch (err) {
      console.error('Standalone Defence Seeding Failed:', err);
      process.exit(1);
    }
  })();
}
