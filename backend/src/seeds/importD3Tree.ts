import fs from 'fs';
import path from 'path';
import vm from 'vm';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDatabase } from '../config/db';
import { 
  NodeModel, 
  NodeType,
  QualificationNodeModel,
  StreamNodeModel,
  SubjectCombinationNodeModel,
  ExamNodeModel,
  DegreeNodeModel,
  OccupationNodeModel
} from '../models/Node';
import { RelationshipModel, RelationshipType } from '../models/Relationship';

dotenv.config();

// Path to D3 index.html
const D3_FILE_PATH = 'C:\\Users\\ddaya\\Downloads\\index.html';

const runImport = async () => {
  try {
    console.log(`Reading D3 index.html from ${D3_FILE_PATH}...`);
    const fileContent = fs.readFileSync(D3_FILE_PATH, 'utf-8');

    // Extract the evaluation code containing treeData from script tag
    const scriptStartTag = '<script>';
    const startIdx = fileContent.indexOf(scriptStartTag);
    if (startIdx === -1) {
      throw new Error('Could not find script start tag in index.html');
    }

    const scriptOffset = startIdx + scriptStartTag.length;
    // We truncate before COUNT STATS section to avoid DOM document/window references
    const countStatsMarker = '// ═══════════════════════════════════════════════════════════════════════\r\n// COUNT STATS';
    const countStatsMarkerUnix = '// ═══════════════════════════════════════════════════════════════════════\n// COUNT STATS';
    let endIdx = fileContent.indexOf(countStatsMarker);
    if (endIdx === -1) {
      endIdx = fileContent.indexOf(countStatsMarkerUnix);
    }
    if (endIdx === -1) {
      throw new Error('Could not find count stats marker in index.html');
    }

    const scriptCode = fileContent.substring(scriptOffset, endIdx);

    console.log('Evaluating treeData using Node.js VM...');
    const sandbox: any = {};
    vm.createContext(sandbox);
    // Execute helper functions and definitions, then evaluate treeData
    const treeData = vm.runInContext(scriptCode + '\n;treeData;', sandbox);

    if (!treeData || typeof treeData !== 'object') {
      throw new Error('Failed to evaluate treeData object from index.html');
    }

    console.log('Tree data evaluated successfully.');

    // Connect to database
    await connectDatabase();

    console.log('Clearing old database records...');
    await NodeModel.deleteMany({});
    await RelationshipModel.deleteMany({});
    console.log('Database cleared.');

    console.log('Creating baseline Qualification, Stream, Subject, and Exam nodes...');

    // 1. Qualifications
    const class10 = await QualificationNodeModel.create({
      name: 'Class 10 (Secondary)',
      type: NodeType.Qualification,
      description: 'Secondary School Certification (SSC)',
      level: 10
    });

    const class12 = await QualificationNodeModel.create({
      name: 'Class 12 (Higher Secondary)',
      type: NodeType.Qualification,
      description: 'Higher Secondary Certificate (HSC) or equivalent boards',
      level: 12
    });

    // 2. Streams
    const scienceStream = await StreamNodeModel.create({
      name: 'Science Stream',
      type: NodeType.Stream,
      description: 'Scientific theories, mathematics, and natural science disciplines'
    });

    const commerceStream = await StreamNodeModel.create({
      name: 'Commerce Stream',
      type: NodeType.Stream,
      description: 'Trade, accounts, economics, and business studies disciplines'
    });

    const artsStream = await StreamNodeModel.create({
      name: 'Arts & Humanities Stream',
      type: NodeType.Stream,
      description: 'Social sciences, languages, humanities, and fine arts disciplines'
    });

    const vocationalStream = await StreamNodeModel.create({
      name: 'Vocational Stream',
      type: NodeType.Stream,
      description: 'Occupational trades, skill certifications, and industrial engineering diplomas'
    });

    // 3. Subject Combinations
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

    const commerceSubjects = await SubjectCombinationNodeModel.create({
      name: 'Commerce core subjects',
      type: NodeType.SubjectCombination,
      description: 'Accountancy, Business Studies, and Economics group',
      subjects: ['Accountancy', 'Business Studies', 'Economics']
    });

    const humanitiesSubjects = await SubjectCombinationNodeModel.create({
      name: 'Humanities core subjects',
      type: NodeType.SubjectCombination,
      description: 'History, Political Science, and Geography group',
      subjects: ['History', 'Political Science', 'Geography']
    });

    // 4. Entrance Exams
    const jeeMain = await ExamNodeModel.create({
      name: 'JEE Main / Advanced',
      type: NodeType.Exam,
      description: 'Joint Entrance Examination for top engineering institutes in India',
      conductingBody: 'NTA / IITs',
      frequency: 'ANNUAL',
      website: 'https://jeemain.nta.ac.in'
    });

    const neet = await ExamNodeModel.create({
      name: 'NEET UG',
      type: NodeType.Exam,
      description: 'National Eligibility cum Entrance Test for undergraduate medical and allied courses',
      conductingBody: 'NTA',
      frequency: 'ANNUAL',
      website: 'https://neet.nta.nic.in'
    });

    const clat = await ExamNodeModel.create({
      name: 'CLAT',
      type: NodeType.Exam,
      description: 'Common Law Admission Test for premier National Law Universities in India',
      conductingBody: 'Consortium of NLUs',
      frequency: 'ANNUAL',
      website: 'https://consortiumofnlus.ac.in'
    });

    const nata = await ExamNodeModel.create({
      name: 'NATA',
      type: NodeType.Exam,
      description: 'National Aptitude Test in Architecture for B.Arch admissions',
      conductingBody: 'Council of Architecture',
      frequency: 'ANNUAL',
      website: 'https://nata.in'
    });

    const upscCse = await ExamNodeModel.create({
      name: 'UPSC Civil Services Exam',
      type: NodeType.Exam,
      description: 'Civil Services Examination for IAS, IPS, IRS, and allied central service selections',
      conductingBody: 'UPSC',
      frequency: 'ANNUAL',
      website: 'https://upsc.gov.in'
    });

    // 5. Degrees
    const btech = await DegreeNodeModel.create({
      name: 'B.Tech / B.E.',
      type: NodeType.Degree,
      description: 'Bachelor of Technology / Bachelor of Engineering',
      durationYears: 4,
      level: 'UG'
    });

    const barch = await DegreeNodeModel.create({
      name: 'B.Arch',
      type: NodeType.Degree,
      description: 'Bachelor of Architecture',
      durationYears: 5,
      level: 'UG'
    });

    const mbbs = await DegreeNodeModel.create({
      name: 'MBBS',
      type: NodeType.Degree,
      description: 'Bachelor of Medicine & Bachelor of Surgery',
      durationYears: 5.5,
      level: 'UG'
    });

    const bds = await DegreeNodeModel.create({
      name: 'BDS',
      type: NodeType.Degree,
      description: 'Bachelor of Dental Surgery',
      durationYears: 5,
      level: 'UG'
    });

    const bams = await DegreeNodeModel.create({
      name: 'BAMS',
      type: NodeType.Degree,
      description: 'Bachelor of Ayurvedic Medicine and Surgery',
      durationYears: 5.5,
      level: 'UG'
    });

    const bscAlliedHealth = await DegreeNodeModel.create({
      name: 'B.Sc Allied Health Sciences',
      type: NodeType.Degree,
      description: 'Bachelor of Science in Medical Lab, OT, Radiology, or Physiotherapy',
      durationYears: 3,
      level: 'UG'
    });

    const bpharm = await DegreeNodeModel.create({
      name: 'B.Pharm',
      type: NodeType.Degree,
      description: 'Bachelor of Pharmacy',
      durationYears: 4,
      level: 'UG'
    });

    const bvsc = await DegreeNodeModel.create({
      name: 'B.V.Sc & AH',
      type: NodeType.Degree,
      description: 'Bachelor of Veterinary Science & Animal Husbandry',
      durationYears: 5,
      level: 'UG'
    });

    const bscBiotech = await DegreeNodeModel.create({
      name: 'B.Sc Biotechnology / Microbiology',
      type: NodeType.Degree,
      description: 'Bachelor of Science in Genetics, Biotech, or Microbiology research fields',
      durationYears: 3,
      level: 'UG'
    });

    const bscAgri = await DegreeNodeModel.create({
      name: 'B.Sc Agriculture / Horticulture',
      type: NodeType.Degree,
      description: 'Bachelor of Science in Agriculture, Agronomy, or Forestry sciences',
      durationYears: 4,
      level: 'UG'
    });

    const bcom = await DegreeNodeModel.create({
      name: 'B.Com / B.Com Hons',
      type: NodeType.Degree,
      description: 'Bachelor of Commerce in Accounting, Auditing, or Economics',
      durationYears: 3,
      level: 'UG'
    });

    const bba = await DegreeNodeModel.create({
      name: 'BBA / BMS',
      type: NodeType.Degree,
      description: 'Bachelor of Business Administration / Bachelor of Management Studies',
      durationYears: 3,
      level: 'UG'
    });

    const bhm = await DegreeNodeModel.create({
      name: 'BHM',
      type: NodeType.Degree,
      description: 'Bachelor of Hotel Management / Culinary Arts',
      durationYears: 3,
      level: 'UG'
    });

    const llb = await DegreeNodeModel.create({
      name: 'Integrated LLB',
      type: NodeType.Degree,
      description: 'Integrated Bachelor of Laws (e.g. BA LLB, B.Com LLB, BBA LLB)',
      durationYears: 5,
      level: 'UG'
    });

    const bed = await DegreeNodeModel.create({
      name: 'B.Ed / D.El.Ed',
      type: NodeType.Degree,
      description: 'Bachelor of Education for professional school-level teaching',
      durationYears: 2,
      level: 'UG'
    });

    const bdes = await DegreeNodeModel.create({
      name: 'B.Des / BFA',
      type: NodeType.Degree,
      description: 'Bachelor of Design / Bachelor of Fine Arts',
      durationYears: 4,
      level: 'UG'
    });

    const bjmc = await DegreeNodeModel.create({
      name: 'BJMC',
      type: NodeType.Degree,
      description: 'Bachelor of Journalism and Mass Communication',
      durationYears: 3,
      level: 'UG'
    });

    const bsw = await DegreeNodeModel.create({
      name: 'BSW / MSW',
      type: NodeType.Degree,
      description: 'Bachelor of Social Work / community dev studies',
      durationYears: 3,
      level: 'UG'
    });

    const genericGraduation = await DegreeNodeModel.create({
      name: 'Graduation (Any Stream)',
      type: NodeType.Degree,
      description: 'Bachelor degree in any academic branch (minimum eligibility for government service exams)',
      durationYears: 3,
      level: 'UG'
    });

    const bscPure = await DegreeNodeModel.create({
      name: 'B.Sc (Pure Sciences)',
      type: NodeType.Degree,
      description: 'Bachelor of Science in Physics, Chemistry, Mathematics, or Earth Sciences',
      durationYears: 3,
      level: 'UG'
    });

    const itiDiploma = await DegreeNodeModel.create({
      name: 'ITI Certificate / Trade Diploma',
      type: NodeType.Degree,
      description: 'Industrial Training Institute certificate in electrical, plumbing, masonry, or welding trades',
      durationYears: 2,
      level: 'DIPLOMA'
    });

    const polytechnicDiploma = await DegreeNodeModel.create({
      name: 'Polytechnic Engineering Diploma',
      type: NodeType.Degree,
      description: 'Three-year technical engineering diploma',
      durationYears: 3,
      level: 'DIPLOMA'
    });

    console.log('Baseline nodes created.');

    // Connect Baseline nodes
    console.log('Connecting baseline education pathways...');
    const baselineEdges = [
      // Class 10 -> Class 12
      { fromNode: class10._id, toNode: class12._id, type: RelationshipType.LeadsTo },
      
      // Class 10 -> Skilled Trades (ITI) / Polytechnic
      { fromNode: class10._id, toNode: vocationalStream._id, type: RelationshipType.CanChoose },
      { fromNode: vocationalStream._id, toNode: itiDiploma._id, type: RelationshipType.Offers },
      { fromNode: vocationalStream._id, toNode: polytechnicDiploma._id, type: RelationshipType.Offers },

      // Class 12 -> Streams
      { fromNode: class12._id, toNode: scienceStream._id, type: RelationshipType.CanChoose },
      { fromNode: class12._id, toNode: commerceStream._id, type: RelationshipType.CanChoose },
      { fromNode: class12._id, toNode: artsStream._id, type: RelationshipType.CanChoose },

      // Science Stream offers PCM / PCB
      { fromNode: scienceStream._id, toNode: pcm._id, type: RelationshipType.Offers },
      { fromNode: scienceStream._id, toNode: pcb._id, type: RelationshipType.Offers },

      // Commerce Stream offers Commerce subjects
      { fromNode: commerceStream._id, toNode: commerceSubjects._id, type: RelationshipType.Offers },

      // Arts Stream offers Humanities subjects
      { fromNode: artsStream._id, toNode: humanitiesSubjects._id, type: RelationshipType.Offers },

      // Subject combinations eligible for exams
      { fromNode: pcm._id, toNode: jeeMain._id, type: RelationshipType.EligibleFor },
      { fromNode: pcm._id, toNode: nata._id, type: RelationshipType.EligibleFor },
      { fromNode: pcb._id, toNode: neet._id, type: RelationshipType.EligibleFor },
      { fromNode: humanitiesSubjects._id, toNode: clat._id, type: RelationshipType.EligibleFor },

      // Exams leads to degrees
      { fromNode: jeeMain._id, toNode: btech._id, type: RelationshipType.LeadsTo },
      { fromNode: nata._id, toNode: barch._id, type: RelationshipType.LeadsTo },
      { fromNode: neet._id, toNode: mbbs._id, type: RelationshipType.LeadsTo },
      { fromNode: neet._id, toNode: bds._id, type: RelationshipType.LeadsTo },
      { fromNode: neet._id, toNode: bams._id, type: RelationshipType.LeadsTo },
      { fromNode: neet._id, toNode: bpharm._id, type: RelationshipType.LeadsTo },
      { fromNode: clat._id, toNode: llb._id, type: RelationshipType.LeadsTo },

      // Direct Stream degrees (without exams)
      { fromNode: pcm._id, toNode: bscPure._id, type: RelationshipType.LeadsTo },
      { fromNode: pcb._id, toNode: bscAlliedHealth._id, type: RelationshipType.LeadsTo },
      { fromNode: pcb._id, toNode: bvsc._id, type: RelationshipType.LeadsTo },
      { fromNode: pcb._id, toNode: bscBiotech._id, type: RelationshipType.LeadsTo },
      { fromNode: pcb._id, toNode: bscAgri._id, type: RelationshipType.LeadsTo },
      
      { fromNode: commerceSubjects._id, toNode: bcom._id, type: RelationshipType.LeadsTo },
      { fromNode: commerceSubjects._id, toNode: bba._id, type: RelationshipType.LeadsTo },
      { fromNode: commerceSubjects._id, toNode: bhm._id, type: RelationshipType.LeadsTo },

      { fromNode: humanitiesSubjects._id, toNode: bed._id, type: RelationshipType.LeadsTo },
      { fromNode: humanitiesSubjects._id, toNode: bdes._id, type: RelationshipType.LeadsTo },
      { fromNode: humanitiesSubjects._id, toNode: bjmc._id, type: RelationshipType.LeadsTo },
      { fromNode: humanitiesSubjects._id, toNode: bsw._id, type: RelationshipType.LeadsTo },
      { fromNode: humanitiesSubjects._id, toNode: genericGraduation._id, type: RelationshipType.LeadsTo },

      // Civil services
      { fromNode: genericGraduation._id, toNode: upscCse._id, type: RelationshipType.EligibleFor }
    ];

    for (const edge of baselineEdges) {
      await RelationshipModel.create(edge);
    }
    console.log('Baseline pathway connections wired successfully.');

    // 6. Recursively parse and import formal D3 tree roles
    console.log('Starting recursive parsing of formal D3 tree roles...');
    let nodeCount = 0;
    let relationshipCount = 0;

    // Helper to map D3 category to Mongo Degree node ID
    const getDegreeForD3Category = (catName: string, subcatName?: string): mongoose.Types.ObjectId | null => {
      catName = catName.trim();
      const subName = subcatName ? subcatName.trim() : '';

      if (catName === 'Engineering & Technology' || catName === 'Emerging Fields') {
        return btech._id as mongoose.Types.ObjectId;
      }
      if (catName === 'Architecture') {
        return barch._id as mongoose.Types.ObjectId;
      }
      if (catName === 'Medical & Healthcare') {
        if (subName.startsWith('Allopathic')) return mbbs._id as mongoose.Types.ObjectId;
        if (subName.startsWith('Dental')) return bds._id as mongoose.Types.ObjectId;
        if (subName.startsWith('AYUSH')) return bams._id as mongoose.Types.ObjectId;
        if (subName.startsWith('Allied Health')) return bscAlliedHealth._id as mongoose.Types.ObjectId;
        if (subName.startsWith('Pharma')) return bpharm._id as mongoose.Types.ObjectId;
        if (subName.startsWith('Veterinary')) return bvsc._id as mongoose.Types.ObjectId;
        if (subName.startsWith('Research & Biotech')) return bscBiotech._id as mongoose.Types.ObjectId;
        return bscAlliedHealth._id as mongoose.Types.ObjectId;
      }
      if (catName === 'Agriculture & Allied') {
        return bscAgri._id as mongoose.Types.ObjectId;
      }
      if (catName === 'Pure Sciences & Research') {
        return bscPure._id as mongoose.Types.ObjectId;
      }
      if (catName === 'Business, Finance & Mgmt') {
        if (subName.startsWith('Corporate Mgmt')) return bba._id as mongoose.Types.ObjectId;
        return bcom._id as mongoose.Types.ObjectId;
      }
      if (catName === 'Hospitality, Travel & Tourism') {
        return bhm._id as mongoose.Types.ObjectId;
      }
      if (catName === 'Retail, Sales & E-commerce') {
        return bba._id as mongoose.Types.ObjectId;
      }
      if (catName === 'Law & Legal Services') {
        return llb._id as mongoose.Types.ObjectId;
      }
      if (catName === 'Education & Academia') {
        return bed._id as mongoose.Types.ObjectId;
      }
      if (catName === 'Arts, Design & Creative') {
        return bdes._id as mongoose.Types.ObjectId;
      }
      if (catName === 'Media, Journalism & Comm') {
        return bjmc._id as mongoose.Types.ObjectId;
      }
      if (catName === 'Social Services & NGO') {
        return bsw._id as mongoose.Types.ObjectId;
      }
      if (catName === 'Skilled Trades (ITI)') {
        return itiDiploma._id as mongoose.Types.ObjectId;
      }
      if (catName === 'Polytechnic Diploma') {
        return polytechnicDiploma._id as mongoose.Types.ObjectId;
      }
      if (catName === 'Manufacturing & Industrial') {
        return polytechnicDiploma._id as mongoose.Types.ObjectId;
      }
      return null;
    };

    // Store mapped node objects to construct edges later
    const createdOccupations = new Map<string, any>();

    const traverse = async (d3Node: any, parentCategoryName?: string, parentSubcatName?: string) => {
      const name = d3Node.name;
      const type = d3Node.nodeType;

      // Filter constraint: Skip informal, sports, gig economy, and religious streams
      const skipNames = [
        'SPORTS & FITNESS', 'Professional Sports',
        'NO FIXED ENTRY', 'Content Creation & Digital', 'Freelance & Gig Economy', 'Self-Employment / Business', 'Religious & Spiritual',
        'INFORMAL SECTOR', 'Informal Work',
        'NIOS (Open Schooling)', 'Acting / Film (Direct)'
      ];
      if (skipNames.includes(name)) {
        console.log(`Skipping excluded path branch: "${name}"`);
        return;
      }

      let currentCategory = parentCategoryName;
      let currentSubcat = parentSubcatName;

      if (type === 'category') {
        currentCategory = name;
      } else if (type === 'subcat') {
        currentSubcat = name;
      }

      // If this is a role (nodeType 'role' or 'future_role' or 'highest')
      const isRole = type === 'role' || type === 'future_role' || type === 'highest' || d3Node.highest;
      if (isRole && currentCategory) {
        const degreeId = getDegreeForD3Category(currentCategory, currentSubcat);
        if (degreeId) {
          // Determine average salary range depending on category
          let salaryRange = { min: 400000, max: 1200000, currency: 'INR' };
          if (currentCategory.includes('Engineering') || currentCategory.includes('Medical')) {
            salaryRange = { min: 800000, max: 3000000, currency: 'INR' };
          } else if (currentCategory.includes('Finance') || currentCategory.includes('Law')) {
            salaryRange = { min: 600000, max: 2000000, currency: 'INR' };
          }

          // Create the occupation node
          const cleanName = name.replace(/^🔮\s*/, '').replace(/^★\s*/, '').trim();
          const uniqueKey = `${cleanName}-${currentCategory}`;

          if (!createdOccupations.has(uniqueKey)) {
            const occNode = await OccupationNodeModel.create({
              name: cleanName,
              type: NodeType.Occupation,
              description: d3Node.sub || `Professional pathway career destination role in ${currentCategory} - ${currentSubcat || 'General'}.`,
              averageSalaryRange: salaryRange,
              growthRate: type === 'future_role' ? 'HIGH' : 'MEDIUM',
              sector: currentCategory
            });

            createdOccupations.set(uniqueKey, occNode);
            nodeCount++;

            // Link the degree to the newly created occupation node
            await RelationshipModel.create({
              fromNode: degreeId,
              toNode: occNode._id,
              type: RelationshipType.LeadsTo
            });
            relationshipCount++;
          }
        }
      }

      // Recursively parse children
      if (d3Node.children && d3Node.children.length > 0) {
        for (const child of d3Node.children) {
          await traverse(child, currentCategory, currentSubcat);
        }
      }
      // Recursively parse direct roles if subcat array exists
      if (d3Node.roles && d3Node.roles.length > 0) {
        for (const roleName of d3Node.roles) {
          await traverse({ name: roleName, nodeType: 'role', sub: d3Node.sub }, currentCategory, currentSubcat);
        }
      }
    };

    // Traverse starting at root children
    for (const child of treeData.children) {
      await traverse(child);
    }

    // Special Case: Civil Services (UPSC)
    console.log('Seeding special Civil Service mapping roles directly to UPSC CSE exam...');
    const civilServiceDegreeId = upscCse._id; // Link directly from the exam node
    const civilServiceCategory = 'Civil Services (UPSC)';
    const cseRoles = [
      "IAS Officer", "IPS Officer", "IFS Officer (Foreign)", "IRS Officer (Revenue)", 
      "State PCS Officer", "Municipal Commissioner", "Block Dev Officer", "Tehsildar"
    ];
    for (const rName of cseRoles) {
      const occNode = await OccupationNodeModel.create({
        name: rName,
        type: NodeType.Occupation,
        description: `Administration and civil services officer selected through standard Union Public Service Commission competitive exams.`,
        averageSalaryRange: { min: 700000, max: 2400000, currency: 'INR' },
        growthRate: 'HIGH',
        sector: civilServiceCategory
      });
      nodeCount++;

      await RelationshipModel.create({
        fromNode: civilServiceDegreeId,
        toNode: occNode._id,
        type: RelationshipType.LeadsTo
      });
      relationshipCount++;
    }

    console.log('----------------------------------------------------');
    console.log('IMPORT SUCCESSFUL!');
    console.log(`- Formal occupations loaded: ${nodeCount}`);
    console.log(`- Pathway relationship edges wired: ${relationshipCount + baselineEdges.length}`);
    console.log('----------------------------------------------------');

    mongoose.connection.close();
    console.log('Database seeding complete. Connection closed.');
  } catch (err) {
    console.error('Error importing D3 tree data:', err);
    if (mongoose.connection) {
      mongoose.connection.close();
    }
    process.exit(1);
  }
};

runImport();
