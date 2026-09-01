import mongoose from 'mongoose';
import IntegrityLog from './src/models/IntegrityLog';
import ParticipantIntegrity from './src/models/ParticipantIntegrity';
import User from './src/models/User';

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/codeofiesta');
  const targetId = '6a95d9388529d0d42425109b';
  
  const user = await User.findById(targetId).lean();
  console.log('Is User?', !!user);
  
  const summary = await ParticipantIntegrity.findById(targetId).lean();
  console.log('Is ParticipantIntegrity?', !!summary);

  const logs = await IntegrityLog.find({ userId: targetId }).lean();
  console.log('Logs for targetId:', logs.length);
  
  process.exit(0);
}
main();
