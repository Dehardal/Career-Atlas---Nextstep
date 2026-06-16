import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDatabase = async (): Promise<void> => {
  let uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/career_atlas';

  // Automatically enforce connecting to the correct database (career_atlas) 
  // instead of defaulting to 'test' if the database name is omitted or set to 'test'
  if (uri.startsWith('mongodb+srv://') || uri.startsWith('mongodb://')) {
    const urlParts = uri.split('?');
    const baseUrl = urlParts[0];
    const queryParams = urlParts[1] ? `?${urlParts[1]}` : '';
    
    const lastSlashIndex = baseUrl.lastIndexOf('/');
    const pathPart = baseUrl.substring(lastSlashIndex + 1);
    
    if (!pathPart || pathPart === 'test') {
      uri = baseUrl.replace(/\/+$/, '') + '/career_atlas' + queryParams;
    }
  }

  try {
    // Redact password from log printout for security
    const maskedUri = uri.replace(/:([^@]+)@/, ':****@');
    await mongoose.connect(uri);
    console.log('MongoDB Connected Successfully to:', maskedUri);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

