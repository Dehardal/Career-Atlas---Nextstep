import mongoose from 'mongoose';
import { connectDatabase } from '../config/db';
import { ExamNodeModel, NodeType } from '../models/Node';
import dotenv from 'dotenv';

dotenv.config();

const examMetadataList = [
  {
    name: 'JEE Main',
    conductingBody: 'National Testing Agency (NTA)',
    website: 'https://jeemain.nta.ac.in',
    frequency: 'BI_ANNUAL',
    eligibilityDescription: 'Passed Class 12 or equivalent with Physics, Chemistry, and Mathematics.',
    streamRequirements: ['Science'],
    subjectRequirements: ['Physics', 'Chemistry', 'Mathematics'],
    ageMin: 16,
    ageMax: 25,
    maxAttempts: 3
  },
  {
    name: 'JEE Advanced',
    conductingBody: 'Joint Admission Board (JAB)',
    website: 'https://jeeadv.ac.in',
    frequency: 'ANNUAL',
    eligibilityDescription: 'Must be among the top 2.5 lakh candidates in JEE Main Paper-1 and satisfy age limit.',
    streamRequirements: ['Science'],
    subjectRequirements: ['Physics', 'Chemistry', 'Mathematics'],
    ageMin: 16,
    ageMax: 25,
    maxAttempts: 2
  },
  {
    name: 'NEET',
    conductingBody: 'National Testing Agency (NTA)',
    website: 'https://neet.nta.nic.in',
    frequency: 'ANNUAL',
    eligibilityDescription: 'Passed Class 12 or equivalent with Physics, Chemistry, Biology/Biotechnology, and English.',
    streamRequirements: ['Science'],
    subjectRequirements: ['Physics', 'Chemistry', 'Biology'],
    ageMin: 17,
    ageMax: 25,
    maxAttempts: 99
  },
  {
    name: 'CLAT UG',
    conductingBody: 'Consortium of National Law Universities (NLUs)',
    website: 'https://consortiumofnlus.ac.in',
    frequency: 'ANNUAL',
    eligibilityDescription: 'Passed Class 12 or equivalent with minimum 45% marks (40% for SC/ST). No upper age limit.',
    streamRequirements: [],
    subjectRequirements: [],
    ageMin: 16,
    ageMax: 99,
    maxAttempts: 99
  },
  {
    name: 'NIFT Entrance Exam',
    conductingBody: 'National Institute of Fashion Technology (NIFT)',
    website: 'https://nift.ac.in',
    frequency: 'ANNUAL',
    eligibilityDescription: 'Passed Class 12 or equivalent from any recognized board.',
    streamRequirements: [],
    subjectRequirements: [],
    ageMin: 16,
    ageMax: 24,
    maxAttempts: 3
  },
  {
    name: 'NID DAT',
    conductingBody: 'National Institute of Design (NID)',
    website: 'https://admissions.nid.edu',
    frequency: 'ANNUAL',
    eligibilityDescription: 'Passed or appearing in Class 12 or equivalent from any recognized board.',
    streamRequirements: [],
    subjectRequirements: [],
    ageMin: 16,
    ageMax: 20,
    maxAttempts: 3
  },
  {
    name: 'NCHMCT JEE',
    conductingBody: 'National Testing Agency (NTA)',
    website: 'https://nchmjee.nta.nic.in',
    frequency: 'ANNUAL',
    eligibilityDescription: 'Passed Class 12 or equivalent with English as a compulsory subject.',
    streamRequirements: [],
    subjectRequirements: ['English'],
    ageMin: 17,
    ageMax: 25,
    maxAttempts: 3
  }
];

async function seedExamsMetadata() {
  await connectDatabase();

  console.log('Seeding Exam Metadata updates...');

  for (const metadata of examMetadataList) {
    // Attempt to update the exam matching by name case-insensitively
    const examNode = await ExamNodeModel.findOne({
      name: { $regex: new RegExp(`^${metadata.name}$`, 'i') },
      type: NodeType.Exam
    });

    if (examNode) {
      // Update existing
      console.log(`Updating metadata for existing exam: ${examNode.name}`);
      await ExamNodeModel.findByIdAndUpdate(examNode._id, metadata, { new: true });
    } else {
      // Create new one if it doesn't exist
      console.log(`Creating new exam node: ${metadata.name}`);
      await ExamNodeModel.create({
        ...metadata,
        type: NodeType.Exam,
        description: `Entrance Exam conducted by ${metadata.conductingBody}`
      });
    }
  }

  console.log('Exam metadata seeded successfully!');
  mongoose.connection.close();
}

seedExamsMetadata().catch((err) => {
  console.error('Failed to seed exam metadata:', err);
  mongoose.connection.close();
  process.exit(1);
});
