import mongoose from 'mongoose';
import { loadEnvConfig } from '@next/env';
import connectDB from '../src/lib/db';
import Round from '../src/models/Round';
import TeamRound from '../src/models/TeamRound';
import { RoundStatus } from '../src/constants/event';

loadEnvConfig(process.cwd());

async function promoteAll() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // 1. Mark Round 1 and Round 2 as COMPLETED
    await Round.updateOne(
      { roundNumber: 1 },
      { $set: { status: RoundStatus.COMPLETED } }
    );
    await Round.updateOne(
      { roundNumber: 2 },
      { $set: { status: RoundStatus.COMPLETED } }
    );
    console.log('Round 1 & 2 set to COMPLETED');

    // 2. Mark Round 3 as ACTIVE
    const round3 = await Round.findOne({ roundNumber: 3 });
    if (round3) {
      round3.status = RoundStatus.ACTIVE;
      round3.startedAt = new Date();
      round3.endsAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      await round3.save();
      console.log('Round 3 set to ACTIVE');

      // 3. Clear TeamRound for Round 3 so anyone can enter fresh
      await TeamRound.deleteMany({ roundId: round3._id });
      console.log('Cleared Round 3 progress for all teams');
    } else {
      console.log('Round 3 not found! You may need to run npm run seed:round3 first to create it.');
    }

    console.log('Successfully promoted to Round 3 for testing.');
  } catch (err) {
    console.error('Error promoting to Round 3:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

promoteAll();
