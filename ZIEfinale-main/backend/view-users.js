#!/usr/bin/env node

/**
 * Utility script to view user accounts and reset passwords if needed
 * Usage: node view-users.js [email]
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
    role: String,
    applicationType: String,
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

async function viewUsers(emailFilter = null) {
  try {
    console.log(`\n🔍 Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB\n');

    let query = {};
    if (emailFilter) {
      query = { email: { $regex: emailFilter, $options: 'i' } };
    }

    const users = await User.find(query);

    if (users.length === 0) {
      console.log('❌ No users found matching criteria');
      process.exit(1);
    }

    console.log(`📋 Found ${users.length} user(s):\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Name: ${user.firstName || 'N/A'} ${user.lastName || 'N/A'}`);
      console.log(`   Role: ${user.role || 'N/A'}`);
      console.log(`   Type: ${user.applicationType || 'N/A'}`);
      console.log(`   Locked: ${user.locked ? 'YES ⛔' : 'NO ✓'}`);
      console.log(`   Failed Attempts: ${user.failedLoginAttempts || 0}/5`);
      console.log(`   Has Password Hash: ${!!user.password_hash}`);
      if (user.lockedUntil) {
        console.log(`   Locked Until: ${new Date(user.lockedUntil).toLocaleString()}`);
      }
      console.log();
    });

    if (emailFilter && users.length === 1) {
      const user = users[0];
      console.log(`\n💡 To reset password for ${user.email}, use:`);
      console.log(`   node reset-password.js ${user.email} newpassword123\n`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

const emailFilter = process.argv[2];
viewUsers(emailFilter);
