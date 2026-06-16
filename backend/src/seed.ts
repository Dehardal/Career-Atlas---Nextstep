import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDatabase } from './config/db';
import { 
  NodeModel, 
  NodeType,
  QualificationNodeModel,
  BoardNodeModel,
  StreamNodeModel,
  SubjectCombinationNodeModel,
  ExamNodeModel,
  DegreeNodeModel,
  OccupationNodeModel,
  SkillNodeModel,
  InstituteNodeModel
} from './models/Node';
import { RelationshipModel, RelationshipType } from './models/Relationship';

dotenv.config();

const runSeeding = async () => {
  try {
    await connectDatabase();
    
    console.log('Clearing old database records...');
    await NodeModel.deleteMany({});
    await RelationshipModel.deleteMany({});
    console.log('Database cleared.');

    console.log('Creating Nodes...');

    // 1. Qualifications
    const class8 = await QualificationNodeModel.create({
      name: 'Class 8',
      type: NodeType.Qualification,
      description: 'Middle School education benchmark',
      level: 8
    });

    const class10 = await QualificationNodeModel.create({
      name: 'Class 10 (Secondary School)',
      type: NodeType.Qualification,
      description: 'Secondary School Certification (SSC)',
      level: 10
    });

    const class12 = await QualificationNodeModel.create({
      name: 'Class 12 (Higher Secondary)',
      type: NodeType.Qualification,
      description: 'Higher Secondary Certificate (HSC)',
      level: 12
    });

    // 2. Boards
    const cbse = await BoardNodeModel.create({
      name: 'Central Board of Secondary Education',
      type: NodeType.Board,
      description: 'National level board of education in India for public and private schools',
      acronym: 'CBSE',
      region: 'NATIONAL'
    });

    // 3. Streams
    const scienceStream = await StreamNodeModel.create({
      name: 'Science Stream',
      type: NodeType.Stream,
      description: 'Focuses on scientific theories, mathematics, and natural sciences'
    });

    const commerceStream = await StreamNodeModel.create({
      name: 'Commerce Stream',
      type: NodeType.Stream,
      description: 'Focuses on trade, business, accounts, and economics'
    });

    // 4. Subject Combinations
    const pcm = await SubjectCombinationNodeModel.create({
      name: 'PCM',
      type: NodeType.SubjectCombination,
      description: 'Physics, Chemistry, and Mathematics group',
      subjects: ['Physics', 'Chemistry', 'Mathematics']
    });

    const pcb = await SubjectCombinationNodeModel.create({
      name: 'PCB',
      type: NodeType.SubjectCombination,
      description: 'Physics, Chemistry, and Biology group',
      subjects: ['Physics', 'Chemistry', 'Biology']
    });

    // 5. Entrance Exams
    const jeeMain = await ExamNodeModel.create({
      name: 'JEE Main',
      type: NodeType.Exam,
      description: 'Joint Entrance Examination for engineering colleges in India',
      conductingBody: 'NTA',
      website: 'https://jeemain.nta.ac.in',
      frequency: 'ANNUAL'
    });

    const neet = await ExamNodeModel.create({
      name: 'NEET UG',
      type: NodeType.Exam,
      description: 'National Eligibility cum Entrance Test for undergraduate medical courses',
      conductingBody: 'NTA',
      website: 'https://neet.nta.nic.in',
      frequency: 'ANNUAL'
    });

    // 6. Degrees
    const btechCS = await DegreeNodeModel.create({
      name: 'B.Tech in Computer Science',
      type: NodeType.Degree,
      description: 'Bachelor of Technology in Computer Science & Engineering',
      durationYears: 4,
      level: 'UG'
    });

    const mbbs = await DegreeNodeModel.create({
      name: 'MBBS (Bachelor of Medicine & Bachelor of Surgery)',
      type: NodeType.Degree,
      description: 'Undergraduate double degree in medicine and surgery',
      durationYears: 5.5,
      level: 'UG'
    });

    // 7. Occupations
    const softwareEngineer = await OccupationNodeModel.create({
      name: 'Software Engineer',
      type: NodeType.Occupation,
      description: 'Professional designing, writing, and testing software code',
      averageSalaryRange: { min: 800000, max: 2500000, currency: 'INR' },
      growthRate: 'HIGH',
      sector: 'IT'
    });

    const cardiologist = await OccupationNodeModel.create({
      name: 'Cardiologist',
      type: NodeType.Occupation,
      description: 'Medical doctor specializing in diagnosing and treating diseases of the heart',
      averageSalaryRange: { min: 1500000, max: 4500000, currency: 'INR' },
      growthRate: 'HIGH',
      sector: 'Healthcare'
    });

    // 8. Skills
    const codingSkill = await SkillNodeModel.create({
      name: 'Software Coding & Systems Design',
      type: NodeType.Skill,
      description: 'Ability to write code (e.g. JavaScript, Python) and design application architectures',
      category: 'TECHNICAL'
    });

    const anatomySkill = await SkillNodeModel.create({
      name: 'Medical Anatomy',
      type: NodeType.Skill,
      description: 'In-depth knowledge of physical human organs and systems structure',
      category: 'DOMAIN_SPECIFIC'
    });

    // 9. Institutes
    const iitBombay = await InstituteNodeModel.create({
      name: 'Indian Institute of Technology Bombay',
      type: NodeType.Institute,
      description: 'Premier engineering and technology institute located in Powai, Mumbai',
      location: { city: 'Mumbai', state: 'Maharashtra' },
      nirfRanking: 3,
      ownership: 'GOVERNMENT'
    });

    const aiimsDelhi = await InstituteNodeModel.create({
      name: 'All India Institute of Medical Sciences Delhi',
      type: NodeType.Institute,
      description: 'Premier medical college and research public university located in New Delhi',
      location: { city: 'New Delhi', state: 'Delhi' },
      nirfRanking: 1,
      ownership: 'GOVERNMENT'
    });

    console.log('Nodes successfully seeded!');
    console.log('Creating Relationships...');

    const edges = [
      // Class 8 -> Class 10
      { fromNode: class8._id, toNode: class10._id, type: RelationshipType.LeadsTo },
      
      // Class 10 -> Science Stream
      { fromNode: class10._id, toNode: scienceStream._id, type: RelationshipType.CanChoose },
      
      // Class 10 -> Commerce Stream (can choose)
      { fromNode: class10._id, toNode: commerceStream._id, type: RelationshipType.CanChoose },

      // Science Stream -> PCM / PCB subject combinations
      { fromNode: scienceStream._id, toNode: pcm._id, type: RelationshipType.Offers },
      { fromNode: scienceStream._id, toNode: pcb._id, type: RelationshipType.Offers },

      // Subject combination eligible for entrance exam
      { 
        fromNode: pcm._id, 
        toNode: jeeMain._id, 
        type: RelationshipType.EligibleFor, 
        metadata: { minimumPercentage: 75, description: 'Requires 75% marks in Class 12 board exams' } 
      },
      { 
        fromNode: pcb._id, 
        toNode: neet._id, 
        type: RelationshipType.EligibleFor,
        metadata: { minimumPercentage: 50, description: 'Requires 50% marks in Class 12 board examinations' }
      },

      // Board affiliation
      { fromNode: class10._id, toNode: cbse._id, type: RelationshipType.RelatedTo },
      { fromNode: class12._id, toNode: cbse._id, type: RelationshipType.RelatedTo },

      // Entrance exam / Subjects lead to degrees
      { fromNode: jeeMain._id, toNode: btechCS._id, type: RelationshipType.LeadsTo, metadata: { description: 'Securing a cut-off rank in JEE Main/Advanced' } },
      { fromNode: neet._id, toNode: mbbs._id, type: RelationshipType.LeadsTo, metadata: { description: 'Securing merit in NEET PG/UG ranking list' } },

      // Institutes offer degrees
      { fromNode: iitBombay._id, toNode: btechCS._id, type: RelationshipType.Offers },
      { fromNode: aiimsDelhi._id, toNode: mbbs._id, type: RelationshipType.Offers },

      // Degrees lead to occupations
      { fromNode: btechCS._id, toNode: softwareEngineer._id, type: RelationshipType.LeadsTo },
      { fromNode: mbbs._id, toNode: cardiologist._id, type: RelationshipType.LeadsTo, metadata: { description: 'Followed by MD/DM specialization in Cardiology' } },

      // Occupations require skills
      { fromNode: softwareEngineer._id, toNode: codingSkill._id, type: RelationshipType.Requires },
      { fromNode: cardiologist._id, toNode: anatomySkill._id, type: RelationshipType.Requires }
    ];

    for (const edge of edges) {
      await RelationshipModel.create(edge);
    }

    console.log(`Relationships successfully seeded: ${edges.length} connections created.`);
    
    mongoose.connection.close();
    console.log('Database seeding complete. Connection closed.');
  } catch (error) {
    console.error('Error seeding database:', error);
    mongoose.connection.close();
    process.exit(1);
  }
};

runSeeding();
