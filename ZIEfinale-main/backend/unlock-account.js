#!/usr/bin/env node

/**
 * Utility script to unlock a locked user account
 * Usage: node unlock-account.js <email>
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/zie-db';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    locked: { type: Boolean, default: false },
    lockedUntil: { type: Date },
    failedLoginAttempts: { type: Number, default: 0 },
    lastFailedLogin: { type: Date },
    password_hash: { type: String },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

async function unlockAccount(email) {
  try {
    console.log(`\n🔓 Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB\n');

    console.log(`🔍 Looking up user: ${email}`);
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log('✓ User found');
    console.log(`  - Email: ${user.email}`);
    console.log(`  - Locked: ${user.locked}`);
    console.log(`  - LockedUntil: ${user.lockedUntil}`);
    console.log(`  - Failed Attempts: ${user.failedLoginAttempts}`);
    console.log(`  - Has Password: ${!!user.password_hash}\n`);

    // Unlock the account
    user.locked = false;
    user.lockedUntil = undefined;
    user.failedLoginAttempts = 0;
    user.lastFailedLogin = undefined;

    await user.save();

    console.log('✅ Account unlocked successfully!');
    console.log(`  - Email: ${user.email}`);
    console.log(`  - Status: Account is now unlocked\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

const email = process.argv[2];
if (!email) {
  console.log('Usage: node unlock-account.js <email>');
  process.exit(1);
}

unlockAccount(email);
