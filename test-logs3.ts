import mongoose from 'mongoose';
import connectDB from './src/lib/db';
import IntegrityLog from './src/models/IntegrityLog';
import ParticipantIntegrity from './src/models/ParticipantIntegrity';
import './src/models/User';
import './src/models/Team';

async function main() {
  await connectDB();
  
  const summaries = await ParticipantIntegrity.find().limit(5).lean();
  console.log('Summaries userIds:', summaries.map(s => s.userId.toString()));
  
  const logs = await IntegrityLog.find({}).limit(5).lean();
  console.log('Logs userIds:', logs.map(l => l.userId.toString()));
  
  // Find a specific match
  if (summaries.length > 0) {
    const targetId = summaries[0].userId.toString();
    const specificLogs = await IntegrityLog.find({ userId: targetId }).lean();
    console.log(`Logs for ${targetId}:`, specificLogs.length);
  }
  
  process.exit(0);
}
main();
