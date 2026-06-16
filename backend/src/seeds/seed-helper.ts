import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDatabase } from '../config/db';
import { 
  QualificationNodeModel, 
  StreamNodeModel, 
  BoardNodeModel, 
  NodeType,
  INode
} from '../models/Node';
import { RelationshipModel, RelationshipType } from '../models/Relationship';

dotenv.config();

export interface ISharedNodes {
  class8: INode;
  class10: INode;
  class12: INode;
  cbse: INode;
  icse: INode;
  stateBoard: INode;
  scienceStream: INode;
  commerceStream: INode;
  artsStream: INode;
}

export const ensureConnection = async () => {
  if (mongoose.connection.readyState === 0) {
    await connectDatabase();
  }
};

export const getOrCreateSharedNodes = async (): Promise<ISharedNodes> => {
  await ensureConnection();

  // Qualifications
  let class8 = await QualificationNodeModel.findOne({ name: 'Class 8', type: NodeType.Qualification });
  if (!class8) {
    class8 = await QualificationNodeModel.create({
      name: 'Class 8',
      type: NodeType.Qualification,
      description: 'Middle School education benchmark',
      level: 8
    });
  }

  let class10 = await QualificationNodeModel.findOne({ name: 'Class 10', type: NodeType.Qualification });
  if (!class10) {
    class10 = await QualificationNodeModel.create({
      name: 'Class 10',
      type: NodeType.Qualification,
      description: 'Secondary School Certificate (SSC)',
      level: 10
    });
  }

  let class12 = await QualificationNodeModel.findOne({ name: 'Class 12', type: NodeType.Qualification });
  if (!class12) {
    class12 = await QualificationNodeModel.create({
      name: 'Class 12',
      type: NodeType.Qualification,
      description: 'Higher Secondary Certificate (HSC)',
      level: 12
    });
  }

  // Boards
  let cbse = await BoardNodeModel.findOne({ acronym: 'CBSE', type: NodeType.Board });
  if (!cbse) {
    cbse = await BoardNodeModel.create({
      name: 'Central Board of Secondary Education',
      type: NodeType.Board,
      description: 'National education board of India',
      acronym: 'CBSE',
      region: 'NATIONAL'
    });
  }

  let icse = await BoardNodeModel.findOne({ acronym: 'ICSE', type: NodeType.Board });
  if (!icse) {
    icse = await BoardNodeModel.create({
      name: 'Indian Certificate of Secondary Education',
      type: NodeType.Board,
      description: 'National board for secondary exams in India',
      acronym: 'ICSE',
      region: 'NATIONAL'
    });
  }

  let stateBoard = await BoardNodeModel.findOne({ acronym: 'STATE BOARD', type: NodeType.Board });
  if (!stateBoard) {
    stateBoard = await BoardNodeModel.create({
      name: 'State Board of Education',
      type: NodeType.Board,
      description: 'State level local board of education',
      acronym: 'STATE BOARD',
      region: 'STATE'
    });
  }

  // Streams
  let scienceStream = await StreamNodeModel.findOne({ name: 'Science Stream', type: NodeType.Stream });
  if (!scienceStream) {
    scienceStream = await StreamNodeModel.create({
      name: 'Science Stream',
      type: NodeType.Stream,
      description: 'Stream focused on mathematical and natural sciences'
    });
  }

  let commerceStream = await StreamNodeModel.findOne({ name: 'Commerce Stream', type: NodeType.Stream });
  if (!commerceStream) {
    commerceStream = await StreamNodeModel.create({
      name: 'Commerce Stream',
      type: NodeType.Stream,
      description: 'Stream focused on financial modeling, trade, and business administration'
    });
  }

  let artsStream = await StreamNodeModel.findOne({ name: 'Arts & Humanities Stream', type: NodeType.Stream });
  if (!artsStream) {
    artsStream = await StreamNodeModel.create({
      name: 'Arts & Humanities Stream',
      type: NodeType.Stream,
      description: 'Stream focused on human culture, history, social sciences, and language literature'
    });
  }

  // Link Class 8 to Class 10
  await RelationshipModel.findOneAndUpdate(
    { fromNode: class8._id, toNode: class10._id, type: RelationshipType.LeadsTo },
    {},
    { upsert: true }
  );

  return {
    class8,
    class10,
    class12,
    cbse,
    icse,
    stateBoard,
    scienceStream,
    commerceStream,
    artsStream
  };
};
