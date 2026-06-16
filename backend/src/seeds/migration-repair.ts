import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDatabase } from '../config/db';
import { 
  NodeModel, 
  NodeType, 
  SubjectCombinationNodeModel, 
  ExamNodeModel, 
  DegreeNodeModel, 
  InstituteNodeModel
} from '../models/Node';
import { RelationshipModel, RelationshipType } from '../models/Relationship';
import { EligibilityRuleModel } from '../models/EligibilityRule';

dotenv.config();

async function runMigration() {
  try {
    await connectDatabase();
    console.log('--- STARTING KNOWLEDGE GRAPH REPAIR MIGRATION ---');

    const nodeMap = new Map<string, any>();
    
    // Helper to find or create nodes
    const ensureNode = async (
      name: string,
      type: NodeType,
      createData: any
    ): Promise<any> => {
      let node: any = await NodeModel.findOne({ name, type });
      if (!node) {
        // Fallback check: try case-insensitive or close matches to prevent duplicates
        const regexNode = await NodeModel.findOne({
          name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
          type
        });
        if (regexNode) {
          console.log(`Found matching node "${regexNode.name}" for "${name}". Reusing existing.`);
          node = regexNode;
        } else {
          let model: any = NodeModel;
          if (type === NodeType.SubjectCombination) model = SubjectCombinationNodeModel;
          else if (type === NodeType.Exam) model = ExamNodeModel;
          else if (type === NodeType.Degree) model = DegreeNodeModel;
          else if (type === NodeType.Institute) model = InstituteNodeModel;
          
          node = await model.create({
            name,
            type,
            ...createData
          });
          console.log(`Created Node: [${type}] ${name}`);
        }
      } else {
        console.log(`Node already exists: [${type}] ${name}`);
      }
      nodeMap.set(name, node);
      return node;
    };

    // ==========================================
    // TASK 1: CREATE MISSING NODES
    // ==========================================
    console.log('\n[Task 1] Ensuring missing nodes exist...');

    // 1. PCMB
    const pcmb = await ensureNode('PCMB', NodeType.SubjectCombination, {
      description: 'Physics, Chemistry, Mathematics, and Biology subject combination',
      subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology']
    });

    // 2. B.Arch
    const barch = await ensureNode('B.Arch', NodeType.Degree, {
      description: 'Bachelor of Architecture, professional degree in designing and planning structures.',
      durationYears: 5,
      level: 'UG'
    });

    // 3. NATA
    const nata = await ensureNode('NATA', NodeType.Exam, {
      conductingBody: 'Council of Architecture (CoA)',
      website: 'https://www.nata.in',
      frequency: 'ANNUAL',
      description: 'National Aptitude Test in Architecture for admission to B.Arch programs.',
      streamRequirements: ['Science'],
      subjectRequirements: ['Physics', 'Chemistry', 'Mathematics']
    });

    // 4. B.Sc Nursing
    const bscNursing = await ensureNode('B.Sc Nursing', NodeType.Degree, {
      description: 'Bachelor of Science in Nursing, professional training for healthcare and patient support.',
      durationYears: 4,
      level: 'UG'
    });

    // 5. B.Pharm
    const bpharm = await ensureNode('B.Pharm', NodeType.Degree, {
      description: 'Bachelor of Pharmacy, training in compounding, dispensing, and industrial pharmacology.',
      durationYears: 4,
      level: 'UG'
    });

    // 6. B.A History
    const baHistory = await ensureNode('B.A History', NodeType.Degree, {
      description: 'Bachelor of Arts in History, covering ancient, medieval, and modern world histories.',
      durationYears: 3,
      level: 'UG'
    });

    // 7. B.A Political Science
    const baPolSci = await ensureNode('B.A Political Science', NodeType.Degree, {
      description: 'Bachelor of Arts in Political Science, studying political systems, constitutions, and public policy.',
      durationYears: 3,
      level: 'UG'
    });

    // 8. SRCC Delhi
    const srcc = await ensureNode('SRCC Delhi', NodeType.Institute, {
      description: 'Shri Ram College of Commerce, Delhi University. Premier commerce college in India.',
      location: { city: 'Delhi', state: 'Delhi' },
      ownership: 'GOVERNMENT',
      nirfRanking: 19,
      category: 'Commerce'
    });

    // Also load existing nodes we will need
    const class12: any = await NodeModel.findOne({ name: 'Class 12', type: NodeType.Qualification });
    const pcm: any = await NodeModel.findOne({ name: 'PCM', type: NodeType.SubjectCombination });
    const pcb: any = await NodeModel.findOne({ name: 'PCB', type: NodeType.SubjectCombination });
    const scienceStream: any = await NodeModel.findOne({ name: 'Science Stream', type: NodeType.Stream });
    const artsStream: any = await NodeModel.findOne({ name: 'Arts & Humanities Stream', type: NodeType.Stream });

    // ==========================================
    // TASK 4: MERGE NEET AND NEET UG
    // ==========================================
    console.log('\n[Task 4] Merging NEET and NEET UG...');
    let neet: any = await NodeModel.findOne({ name: 'NEET', type: NodeType.Exam });
    const neetUg: any = await NodeModel.findOne({ name: 'NEET UG', type: NodeType.Exam });

    if (!neet && neetUg) {
      console.log('No NEET node found, but NEET UG exists. Renaming NEET UG to NEET.');
      neetUg.name = 'NEET';
      await neetUg.save();
      neet = neetUg;
    } else if (neet && neetUg) {
      console.log(`Merging NEET UG (${neetUg._id}) into NEET (${neet._id}).`);

      // Redirect NEET UG relationships to NEET
      const neetUgRels = await RelationshipModel.find({
        $or: [
          { fromNode: neetUg._id },
          { toNode: neetUg._id }
        ]
      });

      console.log(`Found ${neetUgRels.length} relationships connected to NEET UG.`);
      for (const rel of neetUgRels) {
        const fromId = rel.fromNode.toString() === neetUg._id.toString() ? neet._id : rel.fromNode;
        const toId = rel.toNode.toString() === neetUg._id.toString() ? neet._id : rel.toNode;

        const existRel = await RelationshipModel.findOne({
          fromNode: fromId,
          toNode: toId,
          type: rel.type
        });

        if (existRel) {
          console.log(`Relationship of type ${rel.type} already exists for NEET. Deleting NEET UG duplicate.`);
          await RelationshipModel.findByIdAndDelete(rel._id);
        } else {
          rel.fromNode = fromId as any;
          rel.toNode = toId as any;
          await rel.save();
        }
      }

      // Redirect EligibilityRules
      const rulesWithNeetUg = await EligibilityRuleModel.find({
        entranceExamRequirements: neetUg._id
      });
      console.log(`Found ${rulesWithNeetUg.length} rules referencing NEET UG.`);
      for (const rule of rulesWithNeetUg) {
        rule.entranceExamRequirements = rule.entranceExamRequirements.map(id => 
          id.toString() === neetUg._id.toString() ? neet!._id : id
        );
        await rule.save();
      }

      await NodeModel.findByIdAndDelete(neetUg._id);
      console.log('Deleted duplicate NEET UG node.');
    } else {
      console.log('No duplicate NEET UG node found.');
    }

    if (!neet) {
      neet = await ensureNode('NEET', NodeType.Exam, {
        conductingBody: 'National Testing Agency (NTA)',
        website: 'https://neet.nta.nic.in',
        frequency: 'ANNUAL',
        description: 'National Eligibility cum Entrance Test for undergraduate medical programs.'
      });
    }

    // ==========================================
    // TASK 2: REPAIR ORPHAN INSTITUTES
    // ==========================================
    console.log('\n[Task 2] Repairing orphan institutes...');

    const iitBombay: any = await NodeModel.findOne({ name: 'Indian Institute of Technology Bombay', type: NodeType.Institute });
    const aiimsDelhi: any = await NodeModel.findOne({ name: 'All India Institute of Medical Sciences Delhi', type: NodeType.Institute });
    const niftDelhi: any = await NodeModel.findOne({ name: 'National Institute of Fashion Technology Delhi', type: NodeType.Institute });
    const gbpuat: any = await NodeModel.findOne({ name: 'Govind Ballabh Pant University of Agriculture and Technology', type: NodeType.Institute });

    const btechCse: any = await NodeModel.findOne({ name: 'B.Tech CSE', type: NodeType.Degree });
    const mbbs: any = await NodeModel.findOne({ name: 'MBBS', type: NodeType.Degree });
    const bdesFashion: any = await NodeModel.findOne({ name: 'B.Des Fashion Design', type: NodeType.Degree });
    const bscAgri: any = await NodeModel.findOne({ name: 'B.Sc (Hons) in Agriculture', type: NodeType.Degree });

    const ensureOffers = async (inst: any, deg: any) => {
      if (!inst || !deg) return;
      await RelationshipModel.findOneAndUpdate(
        { fromNode: inst._id, toNode: deg._id, type: RelationshipType.Offers },
        {},
        { upsert: true }
      );
      console.log(`Connected: ${inst.name} --[OFFERS]--> ${deg.name}`);
    };

    const ensureRequires = async (inst: any, exam: any) => {
      if (!inst || !exam) return;
      await RelationshipModel.findOneAndUpdate(
        { fromNode: inst._id, toNode: exam._id, type: RelationshipType.Requires },
        {},
        { upsert: true }
      );
      console.log(`Connected: ${inst.name} --[REQUIRES]--> ${exam.name}`);
    };

    // 1. IIT Bombay
    await ensureOffers(iitBombay, btechCse);
    const jeeAdv: any = await NodeModel.findOne({ name: 'JEE Advanced', type: NodeType.Exam });
    await ensureRequires(iitBombay, jeeAdv);

    // 2. AIIMS Delhi
    await ensureOffers(aiimsDelhi, mbbs);
    await ensureOffers(aiimsDelhi, bscNursing);
    await ensureRequires(aiimsDelhi, neet);

    // 3. NIFT Delhi
    const niftEntrance: any = await NodeModel.findOne({ name: 'NIFT Entrance Exam', type: NodeType.Exam });
    await ensureOffers(niftDelhi, bdesFashion);
    await ensureRequires(niftDelhi, niftEntrance);

    // 4. Govind Ballabh Pant University
    await ensureOffers(gbpuat, bscAgri);
    const icarAieea: any = await NodeModel.findOne({ name: 'ICAR AIEEA UG', type: NodeType.Exam });
    await ensureRequires(gbpuat, icarAieea);

    // ==========================================
    // TASK 3: REPAIR ORPHAN EXAMS
    // ==========================================
    console.log('\n[Task 3] Repairing orphan exams...');

    const ensureLeadsTo = async (exam: any, deg: any) => {
      if (!exam || !deg) return;
      await RelationshipModel.findOneAndUpdate(
        { fromNode: exam._id, toNode: deg._id, type: RelationshipType.LeadsTo },
        {},
        { upsert: true }
      );
      console.log(`Connected: ${exam.name} --[LEADS_TO]--> ${deg.name}`);
    };

    const ensureEligibleFor = async (source: any, exam: any) => {
      if (!source || !exam) return;
      await RelationshipModel.findOneAndUpdate(
        { fromNode: source._id, toNode: exam._id, type: RelationshipType.EligibleFor },
        {},
        { upsert: true }
      );
      console.log(`Connected: ${source.name} --[ELIGIBLE_FOR]--> ${exam.name}`);
    };

    // 1. NATA -> B.Arch
    await ensureLeadsTo(nata, barch);
    await ensureEligibleFor(pcm, nata);
    await ensureEligibleFor(pcmb, nata);
    await ensureEligibleFor(class12, nata);

    // 2. ICAR AIEEA UG -> B.Sc (Hons) in Agriculture
    await ensureLeadsTo(icarAieea, bscAgri);
    await ensureEligibleFor(pcb, icarAieea);
    await ensureEligibleFor(pcmb, icarAieea);
    await ensureEligibleFor(class12, icarAieea);

    // 3. NEET -> MBBS, BDS, B.Pharm, B.Sc Nursing, BAMS, BHMS
    const bds: any = await NodeModel.findOne({ name: 'BDS', type: NodeType.Degree });
    const bams: any = await NodeModel.findOne({ name: 'BAMS', type: NodeType.Degree });
    const bhms: any = await NodeModel.findOne({ name: 'BHMS', type: NodeType.Degree });

    await ensureLeadsTo(neet, mbbs);
    await ensureLeadsTo(neet, bds);
    await ensureLeadsTo(neet, bams);
    await ensureLeadsTo(neet, bhms);
    await ensureLeadsTo(neet, bpharm);
    await ensureLeadsTo(neet, bscNursing);
    
    await ensureEligibleFor(pcb, neet);
    await ensureEligibleFor(pcmb, neet);
    await ensureEligibleFor(class12, neet);

    // 4. NDA -> B.Sc in Military Studies
    const nda: any = await NodeModel.findOne({ name: 'NDA Exam', type: NodeType.Exam }) || 
                     await NodeModel.findOne({ name: 'NDA', type: NodeType.Exam });
    const milStudies: any = await NodeModel.findOne({ name: 'B.Sc in Military Studies', type: NodeType.Degree });
    
    await ensureLeadsTo(nda, milStudies);
    await ensureEligibleFor(class12, nda);

    // Make sure PCMB has all appropriate connections (NEET, JEE Main, BITSAT, VITEEE, ICAR AIEEA UG, etc.)
    const jeeMain: any = await NodeModel.findOne({ name: 'JEE Main', type: NodeType.Exam });
    const bitsat: any = await NodeModel.findOne({ name: 'BITSAT', type: NodeType.Exam });
    const viteee: any = await NodeModel.findOne({ name: 'VITEEE', type: NodeType.Exam });
    
    await ensureEligibleFor(pcmb, jeeMain);
    await ensureEligibleFor(pcmb, bitsat);
    await ensureEligibleFor(pcmb, viteee);

    // Connect Science Stream --[OFFERS]--> PCMB
    await ensureOffers(scienceStream, pcmb);

    // Connect B.A History and B.A Political Science to Arts & Humanities Stream
    await ensureOffers(artsStream, baHistory);
    await ensureOffers(artsStream, baPolSci);

    // Connect CUET UG to B.A History & B.A Political Science
    const cuetArts: any = await NodeModel.findOne({ name: 'CUET UG (Arts & Humanities)', type: NodeType.Exam });
    await ensureLeadsTo(cuetArts, baHistory);
    await ensureLeadsTo(cuetArts, baPolSci);

    // Connect SRCC Delhi --[OFFERS]--> B.Com (Hons) & B.A. Economics (Hons)
    const bcomHons: any = await NodeModel.findOne({ name: 'B.Com (Hons)', type: NodeType.Degree });
    const baEco: any = await NodeModel.findOne({ name: 'B.A. Economics (Hons)', type: NodeType.Degree });
    await ensureOffers(srcc, bcomHons);
    await ensureOffers(srcc, baEco);
    await ensureRequires(srcc, cuetArts);

    console.log('\n--- GRAPH REPAIR MIGRATION COMPLETED SUCCESSFULLY ---');
    await mongoose.connection.close();
  } catch (err) {
    console.error('Migration failed:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
}

runMigration();
