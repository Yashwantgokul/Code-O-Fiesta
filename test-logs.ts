import mongoose from 'mongoose';
import IntegrityLog from './src/models/IntegrityLog';
import ParticipantIntegrity from './src/models/ParticipantIntegrity';

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/codeofiesta');
  const logs = await IntegrityLog.find({}).lean();
  console.log('Total Logs:', logs.length);
  if (logs.length > 0) {
    console.log('Sample Log:', logs[0]);
  }
  
  const summaries = await ParticipantIntegrity.find({}).lean();
  console.log('Total Participants with away sessions:', summaries.length);
  if (summaries.length > 0) {
    console.log('Sample Summary userId:', summaries[0].userId);
  }

  process.exit(0);
}
main();
