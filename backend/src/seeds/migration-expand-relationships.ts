import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDatabase } from '../config/db';
import { NodeModel, NodeType } from '../models/Node';
import { RelationshipModel, RelationshipType } from '../models/Relationship';

dotenv.config();

async function runExpansion() {
  try {
    await connectDatabase();
    console.log('--- STARTING KNOWLEDGE GRAPH RELATIONSHIP EXPANSION ---');

    // 1. Fetch SubjectCombinations and Streams
    const pcm = await NodeModel.findOne({ name: 'PCM', type: NodeType.SubjectCombination });
    const pcb = await NodeModel.findOne({ name: 'PCB', type: NodeType.SubjectCombination });
    const pcmb = await NodeModel.findOne({ name: 'PCMB', type: NodeType.SubjectCombination });
    const commerceStream = await NodeModel.findOne({ name: 'Commerce Stream', type: NodeType.Stream });
    const commerceMath = await NodeModel.findOne({ name: 'Commerce with Mathematics', type: NodeType.SubjectCombination });
    const artsStream = await NodeModel.findOne({ name: 'Arts & Humanities Stream', type: NodeType.Stream });
    const artsCore = await NodeModel.findOne({ name: 'History, Political Science, and English', type: NodeType.SubjectCombination });
    const artsLegal = await NodeModel.findOne({ name: 'Humanities with Legal Studies', type: NodeType.SubjectCombination });

    // 2. Fetch Exams
    const exams = {
      jeeMain: await NodeModel.findOne({ name: 'JEE Main', type: NodeType.Exam }),
      bitsat: await NodeModel.findOne({ name: 'BITSAT', type: NodeType.Exam }),
      viteee: await NodeModel.findOne({ name: 'VITEEE', type: NodeType.Exam }),
      nata: await NodeModel.findOne({ name: 'NATA', type: NodeType.Exam }),
      neet: await NodeModel.findOne({ name: 'NEET', type: NodeType.Exam }),
      icarAieea: await NodeModel.findOne({ name: 'ICAR AIEEA UG', type: NodeType.Exam }),
      clat: await NodeModel.findOne({ name: 'CLAT UG', type: NodeType.Exam }),
      cuetArts: await NodeModel.findOne({ name: 'CUET UG (Arts & Humanities)', type: NodeType.Exam }),
      caFound: await NodeModel.findOne({ name: 'CA Foundation', type: NodeType.Exam }),
      cseet: await NodeModel.findOne({ name: 'CSEET', type: NodeType.Exam }),
      cmaFound: await NodeModel.findOne({ name: 'CMA Foundation', type: NodeType.Exam }),
      nda: await NodeModel.findOne({ name: 'NDA Exam', type: NodeType.Exam }) || await NodeModel.findOne({ name: 'NDA', type: NodeType.Exam }),
      uceed: await NodeModel.findOne({ name: 'UCEED', type: NodeType.Exam }),
      nidDat: await NodeModel.findOne({ name: 'NID DAT', type: NodeType.Exam }),
      niftEntrance: await NodeModel.findOne({ name: 'NIFT Entrance Exam', type: NodeType.Exam }),
      nchmctJee: await NodeModel.findOne({ name: 'NCHMCT JEE', type: NodeType.Exam })
    };

    const ensureEligible = async (source: any, target: any, description: string = '') => {
      if (!source) {
        console.warn(`Source node not found.`);
        return;
      }
      if (!target) {
        console.warn(`Target exam node not found.`);
        return;
      }
      await RelationshipModel.findOneAndUpdate(
        { fromNode: source._id, toNode: target._id, type: RelationshipType.EligibleFor },
        { metadata: { description } },
        { upsert: true }
      );
      console.log(`Connected: ${source.name} --[ELIGIBLE_FOR]--> ${target.name}`);
    };

    // ==========================================
    // PCM PATHWAYS
    // ==========================================
    console.log('\n--- EXPANDING PCM PATHWAYS ---');
    // Tech / Engineering / Arch (already mostly connected, ensure others)
    await ensureEligible(pcm, exams.jeeMain, 'Eligible for engineering admissions via JEE Main');
    await ensureEligible(pcm, exams.bitsat, 'Eligible for BITS admission');
    await ensureEligible(pcm, exams.viteee, 'Eligible for VIT admission');
    await ensureEligible(pcm, exams.nata, 'Eligible for architecture admissions via NATA');
    // Generic / Creative / Defense
    await ensureEligible(pcm, exams.nda, 'Eligible for Army, Navy, and Air Force wings of NDA');
    await ensureEligible(pcm, exams.uceed, 'Eligible for design programs via UCEED');
    await ensureEligible(pcm, exams.nidDat, 'Eligible for design programs via NID DAT');
    await ensureEligible(pcm, exams.niftEntrance, 'Eligible for fashion design programs via NIFT');
    await ensureEligible(pcm, exams.nchmctJee, 'Eligible for hotel administration programs via NCHMCT JEE');

    // ==========================================
    // PCB PATHWAYS
    // ==========================================
    console.log('\n--- EXPANDING PCB PATHWAYS ---');
    // Medical / Biotech / Agri (already mostly connected, ensure others)
    await ensureEligible(pcb, exams.neet, 'Eligible for medical and dental admissions via NEET');
    await ensureEligible(pcb, exams.icarAieea, 'Eligible for agricultural programs via ICAR AIEEA');
    // Generic / Creative / Defense
    await ensureEligible(pcb, exams.nda, 'Eligible for Army wing of NDA');
    await ensureEligible(pcb, exams.uceed, 'Eligible for design programs via UCEED');
    await ensureEligible(pcb, exams.nidDat, 'Eligible for design programs via NID DAT');
    await ensureEligible(pcb, exams.niftEntrance, 'Eligible for fashion design programs via NIFT');
    await ensureEligible(pcb, exams.nchmctJee, 'Eligible for hotel administration programs via NCHMCT JEE');

    // ==========================================
    // PCMB PATHWAYS
    // ==========================================
    console.log('\n--- EXPANDING PCMB PATHWAYS ---');
    // Engineering & Architecture
    await ensureEligible(pcmb, exams.jeeMain, 'Eligible for engineering admissions via JEE Main');
    await ensureEligible(pcmb, exams.bitsat, 'Eligible for BITS admission');
    await ensureEligible(pcmb, exams.viteee, 'Eligible for VIT admission');
    await ensureEligible(pcmb, exams.nata, 'Eligible for architecture admissions via NATA');
    // Medical & Agriculture
    await ensureEligible(pcmb, exams.neet, 'Eligible for medical and dental admissions via NEET');
    await ensureEligible(pcmb, exams.icarAieea, 'Eligible for agricultural programs via ICAR AIEEA');
    // Generic / Creative / Defense
    await ensureEligible(pcmb, exams.nda, 'Eligible for Army, Navy, and Air Force wings of NDA');
    await ensureEligible(pcmb, exams.uceed, 'Eligible for design programs via UCEED');
    await ensureEligible(pcmb, exams.nidDat, 'Eligible for design programs via NID DAT');
    await ensureEligible(pcmb, exams.niftEntrance, 'Eligible for fashion design programs via NIFT');
    await ensureEligible(pcmb, exams.nchmctJee, 'Eligible for hotel administration programs via NCHMCT JEE');

    // ==========================================
    // COMMERCE PATHWAYS
    // ==========================================
    console.log('\n--- EXPANDING COMMERCE PATHWAYS ---');
    const commerceNodes = [commerceStream, commerceMath];
    for (const node of commerceNodes) {
      if (!node) continue;
      // Finance / Business / Corporate
      await ensureEligible(node, exams.caFound, 'Eligible for Chartered Accountancy studies');
      await ensureEligible(node, exams.cseet, 'Eligible for Company Secretary studies');
      await ensureEligible(node, exams.cmaFound, 'Eligible for Cost and Management Accountancy studies');
      // Generic / Creative / Defense
      await ensureEligible(node, exams.nda, 'Eligible for Army wing of NDA');
      await ensureEligible(node, exams.uceed, 'Eligible for design programs via UCEED');
      await ensureEligible(node, exams.nidDat, 'Eligible for design programs via NID DAT');
      await ensureEligible(node, exams.niftEntrance, 'Eligible for fashion design programs via NIFT');
      await ensureEligible(node, exams.nchmctJee, 'Eligible for hotel administration programs via NCHMCT JEE');
      // CUET Arts for degrees like B.Com (Hons) and B.A. Economics (Hons)
      await ensureEligible(node, exams.cuetArts, 'Eligible for central university programs via CUET UG');
    }

    // ==========================================
    // HUMANITIES PATHWAYS
    // ==========================================
    console.log('\n--- EXPANDING HUMANITIES PATHWAYS ---');
    const humanitiesNodes = [artsStream, artsCore, artsLegal];
    for (const node of humanitiesNodes) {
      if (!node) continue;
      // Arts / Legal / Humanities
      await ensureEligible(node, exams.cuetArts, 'Eligible for central university programs via CUET UG');
      await ensureEligible(node, exams.clat, 'Eligible for National Law Universities via CLAT');
      // Generic / Creative / Defense
      await ensureEligible(node, exams.nda, 'Eligible for Army wing of NDA');
      await ensureEligible(node, exams.uceed, 'Eligible for design programs via UCEED');
      await ensureEligible(node, exams.nidDat, 'Eligible for design programs via NID DAT');
      await ensureEligible(node, exams.niftEntrance, 'Eligible for fashion design programs via NIFT');
      await ensureEligible(node, exams.nchmctJee, 'Eligible for hotel administration programs via NCHMCT JEE');
      // CA/CS/CMA are also technically open to arts students
      await ensureEligible(node, exams.caFound, 'Eligible for Chartered Accountancy studies');
      await ensureEligible(node, exams.cseet, 'Eligible for Company Secretary studies');
      await ensureEligible(node, exams.cmaFound, 'Eligible for Cost and Management Accountancy studies');
    }

    console.log('\n--- RELATIONSHIP EXPANSION COMPLETED SUCCESSFULLY ---');
    await mongoose.connection.close();
  } catch (err) {
    console.error('Relationship expansion failed:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
}

runExpansion();
