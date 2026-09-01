import mongoose from 'mongoose';
import IntegrityLog from './src/models/IntegrityLog';
import ParticipantIntegrity from './src/models/ParticipantIntegrity';

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/codeofiesta');
  
  const summaries = await ParticipantIntegrity.find()
      .populate({
        path: 'userId',
        select: 'username name email role teamId',
      })
      .lean();
      
  if (summaries.length === 0) {
    console.log('No summaries');
    process.exit(0);
  }
  
  const selectedParticipant = summaries[0];
  const targetId = selectedParticipant.userId?._id || selectedParticipant.userId;
  
  console.log('Selected targetId:', targetId);
  console.log('Type of targetId:', typeof targetId);
  
  const logs = await IntegrityLog.find({ userId: targetId })
      .sort({ timestamp: -1 })
      .lean();
      
  console.log('Found logs for targetId:', logs.length);
  process.exit(0);
}
main();
