import mongoose from 'mongoose';
import { connectDatabase } from '../config/db';
import { 
  NodeModel, 
  NodeType, 
  InstituteNodeModel, 
  DegreeNodeModel, 
  ExamNodeModel,
  INode
} from '../models/Node';
import { InstituteCourseMappingModel } from '../models/InstituteCourseMapping';
import dotenv from 'dotenv';

dotenv.config();

async function seedMappings() {
  await connectDatabase();

  console.log('Clearing existing Institute-Course mappings...');
  await InstituteCourseMappingModel.deleteMany({});

  // Helper function to find or create Institute
  const getOrCreateInstitute = async (
    name: string,
    city: string,
    state: string,
    ranking: number,
    ownership: 'GOVERNMENT' | 'PRIVATE',
    category: string
  ): Promise<INode> => {
    let inst = await NodeModel.findOne({ name, type: NodeType.Institute });
    if (!inst) {
      inst = await InstituteNodeModel.create({
        name,
        type: NodeType.Institute,
        description: `${name} is a premier educational institution located in ${city}, ${state}.`,
        location: { city, state },
        nirfRanking: ranking,
        ownership,
        category
      });
      console.log(`Created Institute Node: ${name}`);
    } else {
      // Update existing properties to match
      inst = await InstituteNodeModel.findByIdAndUpdate(
        inst._id,
        { category, nirfRanking: ranking, ownership, location: { city, state } },
        { new: true }
      );
      console.log(`Updated Institute Node: ${name}`);
    }
    if (!inst) throw new Error(`Failed to find or create institute: ${name}`);
    return inst;
  };

  // Helper function to find or create Degree
  const getOrCreateDegree = async (name: string, durationYears: number, level: 'UG' | 'PG'): Promise<INode> => {
    let deg = await NodeModel.findOne({ name, type: NodeType.Degree });
    if (!deg) {
      deg = await DegreeNodeModel.create({
        name,
        type: NodeType.Degree,
        description: `${name} degree course.`,
        durationYears,
        level
      });
      console.log(`Created Degree Node: ${name}`);
    }
    if (!deg) throw new Error(`Failed to find or create degree: ${name}`);
    return deg;
  };

  // Helper function to find or create Exam
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
    if (!exam) throw new Error(`Failed to find or create exam: ${name}`);
    return exam;
  };

  // 1. IIT Bombay mapping
  const iitBombay = await getOrCreateInstitute(
    'Indian Institute of Technology Bombay',
    'Mumbai',
    'Maharashtra',
    3,
    'GOVERNMENT',
    'Technical'
  );
  const btechCs = await NodeModel.findOne({ name: 'B.Tech CSE', type: NodeType.Degree }) || 
                  await NodeModel.findOne({ name: /B.Tech/i, type: NodeType.Degree }) ||
                  await getOrCreateDegree('B.Tech CSE', 4, 'UG');
  const jeeAdvanced = await NodeModel.findOne({ name: 'JEE Advanced', type: NodeType.Exam }) || 
                      await getOrCreateExam('JEE Advanced', 'JAB', 'https://jeeadv.ac.in');

  await InstituteCourseMappingModel.create({
    institute: iitBombay._id,
    degree: btechCs._id,
    entranceExam: jeeAdvanced._id,
    specialization: 'Computer Science & Engineering',
    fees: 220000,
    seats: 120,
    placementStats: {
      averageSalary: 2400000,
      placementRate: 98
    }
  });
  console.log('Seeded IIT Bombay mapping.');

  // 2. AIIMS Delhi mapping
  const aiims = await getOrCreateInstitute(
    'All India Institute of Medical Sciences Delhi',
    'New Delhi',
    'Delhi',
    1,
    'GOVERNMENT',
    'Medical'
  );
  const mbbs = await NodeModel.findOne({ name: 'MBBS', type: NodeType.Degree }) || 
               await getOrCreateDegree('MBBS', 5.5, 'UG');
  const neet = await NodeModel.findOne({ name: 'NEET', type: NodeType.Exam }) || 
               await getOrCreateExam('NEET', 'NTA', 'https://neet.nta.nic.in');

  await InstituteCourseMappingModel.create({
    institute: aiims._id,
    degree: mbbs._id,
    entranceExam: neet._id,
    specialization: 'General Medicine',
    fees: 1628,
    seats: 125,
    placementStats: {
      averageSalary: 1800000,
      placementRate: 99
    }
  });
  console.log('Seeded AIIMS Delhi mapping.');

  // 3. NIFT Delhi mapping
  const nift = await getOrCreateInstitute(
    'National Institute of Fashion Technology Delhi',
    'New Delhi',
    'Delhi',
    11,
    'GOVERNMENT',
    'Design'
  );
  const bdesFashion = await getOrCreateDegree('B.Des Fashion Design', 4, 'UG');
  const niftEntrance = await getOrCreateExam('NIFT Entrance Exam', 'NIFT', 'https://nift.ac.in');

  await InstituteCourseMappingModel.create({
    institute: nift._id,
    degree: bdesFashion._id,
    entranceExam: niftEntrance._id,
    specialization: 'Fashion Design',
    fees: 290000,
    seats: 60,
    placementStats: {
      averageSalary: 850000,
      placementRate: 91
    }
  });
  console.log('Seeded NIFT Delhi mapping.');

  // 4. NID Ahmedabad mapping
  const nid = await getOrCreateInstitute(
    'National Institute of Design Ahmedabad',
    'Ahmedabad',
    'Gujarat',
    15,
    'GOVERNMENT',
    'Design'
  );
  const bdesProduct = await NodeModel.findOne({ name: /B.Des in Product Design/i, type: NodeType.Degree }) ||
                      await getOrCreateDegree('B.Des in Product Design', 4, 'UG');
  const nidDat = await NodeModel.findOne({ name: 'NID DAT', type: NodeType.Exam }) ||
                 await getOrCreateExam('NID DAT', 'NID', 'https://admissions.nid.edu');

  await InstituteCourseMappingModel.create({
    institute: nid._id,
    degree: bdesProduct._id,
    entranceExam: nidDat._id,
    specialization: 'Product Design',
    fees: 350000,
    seats: 45,
    placementStats: {
      averageSalary: 1200000,
      placementRate: 93
    }
  });
  console.log('Seeded NID Ahmedabad mapping.');

  // 5. NLSIU Bangalore mapping
  const nlsiu = await getOrCreateInstitute(
    'National Law School of India University Bangalore',
    'Bangalore',
    'Karnataka',
    4,
    'GOVERNMENT',
    'Law'
  );
  const ballb = await NodeModel.findOne({ name: /B.A. LLB/i, type: NodeType.Degree }) ||
                await getOrCreateDegree('B.A. LLB (Hons)', 5, 'UG');
  const clat = await NodeModel.findOne({ name: 'CLAT UG', type: NodeType.Exam }) ||
               await getOrCreateExam('CLAT UG', 'Consortium of National Law Universities', 'https://consortiumofnlus.ac.in');

  await InstituteCourseMappingModel.create({
    institute: nlsiu._id,
    degree: ballb._id,
    entranceExam: clat._id,
    specialization: 'Law (Hons)',
    fees: 275000,
    seats: 180,
    placementStats: {
      averageSalary: 1600000,
      placementRate: 96
    }
  });
  console.log('Seeded NLSIU Bangalore mapping.');

  // 6. BITS Pilani mapping
  const bitsPilani = await getOrCreateInstitute(
    'Birla Institute of Technology and Science, Pilani',
    'Pilani',
    'Rajasthan',
    25,
    'PRIVATE',
    'Technical'
  );
  const bitsat = await NodeModel.findOne({ name: 'BITSAT', type: NodeType.Exam }) ||
                 await getOrCreateExam('BITSAT', 'BITS Pilani', 'https://www.bitsadmission.com');
  await InstituteCourseMappingModel.create({
    institute: bitsPilani._id,
    degree: btechCs._id,
    entranceExam: bitsat._id,
    specialization: 'Computer Science & Engineering',
    fees: 450000,
    seats: 150,
    placementStats: {
      averageSalary: 2100000,
      placementRate: 97
    }
  });
  console.log('Seeded BITS Pilani mapping.');

  // 7. VIT Vellore mapping
  const vitVellore = await getOrCreateInstitute(
    'Vellore Institute of Technology',
    'Vellore',
    'Tamil Nadu',
    11,
    'PRIVATE',
    'Technical'
  );
  const viteee = await NodeModel.findOne({ name: 'VITEEE', type: NodeType.Exam }) ||
                 await getOrCreateExam('VITEEE', 'VIT', 'https://viteee.vit.ac.in');
  await InstituteCourseMappingModel.create({
    institute: vitVellore._id,
    degree: btechCs._id,
    entranceExam: viteee._id,
    specialization: 'Computer Science & Engineering',
    fees: 198000,
    seats: 240,
    placementStats: {
      averageSalary: 900000,
      placementRate: 92
    }
  });
  console.log('Seeded VIT Vellore mapping.');

  // 8. Maulana Azad Medical College mapping
  const mamc = await getOrCreateInstitute(
    'Maulana Azad Medical College Delhi',
    'New Delhi',
    'Delhi',
    24,
    'GOVERNMENT',
    'Medical'
  );
  await InstituteCourseMappingModel.create({
    institute: mamc._id,
    degree: mbbs._id,
    entranceExam: neet._id,
    specialization: 'General Medicine',
    fees: 15450,
    seats: 250,
    placementStats: {
      averageSalary: 1500000,
      placementRate: 98
    }
  });
  console.log('Seeded MAMC Delhi mapping.');

  // 9. SRCC mapping
  const srcc = await getOrCreateInstitute(
    'Shri Ram College of Commerce (SRCC) Delhi',
    'Delhi',
    'Delhi',
    19,
    'GOVERNMENT',
    'Commerce'
  );
  const bcomHons = await NodeModel.findOne({ name: 'B.Com (Hons)', type: NodeType.Degree }) ||
                   await getOrCreateDegree('B.Com (Hons)', 3, 'UG');
  const baEco = await NodeModel.findOne({ name: 'B.A. Economics (Hons)', type: NodeType.Degree }) ||
                await getOrCreateDegree('B.A. Economics (Hons)', 3, 'UG');
  const cuetArtsExam = await NodeModel.findOne({ name: 'CUET UG (Arts & Humanities)', type: NodeType.Exam }) ||
                       await getOrCreateExam('CUET UG (Arts & Humanities)', 'NTA', 'https://cuet.samarth.ac.in');

  await InstituteCourseMappingModel.create({
    institute: srcc._id,
    degree: bcomHons._id,
    entranceExam: cuetArtsExam._id,
    specialization: 'Commerce (Hons)',
    fees: 30000,
    seats: 600,
    placementStats: {
      averageSalary: 1000000,
      placementRate: 95
    }
  });
  await InstituteCourseMappingModel.create({
    institute: srcc._id,
    degree: baEco._id,
    entranceExam: cuetArtsExam._id,
    specialization: 'Economics (Hons)',
    fees: 30000,
    seats: 150,
    placementStats: {
      averageSalary: 1100000,
      placementRate: 94
    }
  });
  console.log('Seeded SRCC Delhi mapping.');

  // 10. IIM Ahmedabad mapping
  const iima = await getOrCreateInstitute(
    'Indian Institute of Management Ahmedabad',
    'Ahmedabad',
    'Gujarat',
    1,
    'GOVERNMENT',
    'Management'
  );
  const mba = await NodeModel.findOne({ name: 'MBA', type: NodeType.Degree }) ||
              await getOrCreateDegree('MBA', 2, 'PG');
  const cat = await NodeModel.findOne({ name: 'CAT', type: NodeType.Exam }) ||
              await getOrCreateExam('CAT', 'IIMs', 'https://iimcat.ac.in');

  await InstituteCourseMappingModel.create({
    institute: iima._id,
    degree: mba._id,
    entranceExam: cat._id,
    specialization: 'Post Graduate Program in Management (MBA)',
    fees: 2300000,
    seats: 400,
    placementStats: {
      averageSalary: 3200000,
      placementRate: 100
    }
  });
  console.log('Seeded IIM Ahmedabad mapping.');

  // 11. St. Stephen's College additional mappings
  const stStephensNode = await NodeModel.findOne({ name: "St. Stephen's College Delhi", type: NodeType.Institute });
  if (stStephensNode) {
    const baHistory = await NodeModel.findOne({ name: 'B.A. (Hons) in History', type: NodeType.Degree }) ||
                      await getOrCreateDegree('B.A. (Hons) in History', 3, 'UG');
    const baPolSci = await NodeModel.findOne({ name: 'B.A. (Hons) in Political Science', type: NodeType.Degree }) ||
                     await getOrCreateDegree('B.A. (Hons) in Political Science', 3, 'UG');

    await InstituteCourseMappingModel.create({
      institute: stStephensNode._id,
      degree: baHistory._id,
      entranceExam: cuetArtsExam._id,
      specialization: 'History (Hons)',
      fees: 40000,
      seats: 60,
      placementStats: {
        averageSalary: 800000,
        placementRate: 90
      }
    });
    await InstituteCourseMappingModel.create({
      institute: stStephensNode._id,
      degree: baPolSci._id,
      entranceExam: cuetArtsExam._id,
      specialization: 'Political Science (Hons)',
      fees: 40000,
      seats: 60,
      placementStats: {
        averageSalary: 850000,
        placementRate: 91
      }
    });
    console.log("Seeded St. Stephen's additional mappings.");
  }

  console.log('Institute-Course mappings seeding completed successfully!');
  mongoose.connection.close();
}

seedMappings().catch(err => {
  console.error(err);
  mongoose.connection.close();
});
