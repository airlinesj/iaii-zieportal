#!/usr/bin/env node

/**
 * Utility script to reset a user's password
 * Usage: node reset-password.js <email> <newpassword>
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/zie-db';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    firstName: String,
    lastName: String,
    password_hash: String,
    locked: Boolean,
    lockedUntil: Date,
    failedLoginAttempts: Number,
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

async function resetPassword(email, newPassword) {
  try {
    console.log(`\n🔐 Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB\n');

    console.log(`🔍 Looking up user: ${email}`);
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log('✓ User found\n');

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user
    user.password_hash = hashedPassword;
    user.locked = false;
    user.lockedUntil = undefined;
    user.failedLoginAttempts = 0;
    
    await user.save();

    console.log('✅ Password reset successfully!');
    console.log(`  - Email: ${user.email}`);
    console.log(`  - New Password: ${newPassword}`);
    console.log(`  - Account Unlocked: YES`);
    console.log(`  - Failed Attempts Reset: 0/5\n`);
    console.log('💡 User can now login with the new password\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.log('Usage: node reset-password.js <email> <newpassword>');
  console.log('Example: node reset-password.js user@example.com MyNewPassword123');
  process.exit(1);
}

if (newPassword.length < 6) {
  console.log('❌ Password must be at least 6 characters long');
  process.exit(1);
}

resetPassword(email, newPassword);
