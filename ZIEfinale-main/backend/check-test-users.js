#!/usr/bin/env node
/**
 * Script to verify test user credentials in the database
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zie-db');
    console.log('✓ MongoDB connected\n');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const checkTestUsers = async () => {
  try {
    await connectDB();

    const userSchema = new mongoose.Schema({
      email: { type: String, unique: true, lowercase: true },
      password_hash: String,
      role: String,
      accountType: String,
      country: String,
      applicationType: String,
      userClassification: String,
      createdAt: { type: Date, default: Date.now }
    });

    const User = mongoose.model('User', userSchema, 'users');

    // Test credentials
    const testCredentials = [
      { email: 'applicant@test.com', password: 'TestPassword123@#$', role: 'Applicant' },
      { email: 'member@test.com', password: 'MemberPass123@#$', role: 'Applicant' },
      { email: 'admin@admin.com', password: 'AdminPass123@#$', role: 'Admin' },
      { email: 'auditor@admin.audit', password: 'AuditorPass123@#$', role: 'Admin' },
      { email: 'superadmin@superadmin.com', password: 'SuperPass123@#$', role: 'SuperAdmin' }
    ];

    console.log('🔍 Checking Test Users in Database...\n');

    for (const testCred of testCredentials) {
      const user = await User.findOne({ email: testCred.email });

      if (!user) {
        console.log(`❌ ${testCred.email} - NOT FOUND`);
        continue;
      }

      console.log(`✓ ${testCred.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Account Type: ${user.accountType}`);
      console.log(`   Hash exists: ${!!user.password_hash}`);

      // Test if password is valid
      if (user.password_hash) {
        try {
          const isValid = await bcrypt.compare(testCred.password, user.password_hash);
          console.log(`   Password valid: ${isValid ? '✓ YES' : '❌ NO'}`);
        } catch (err) {
          console.log(`   Password check: ❌ ERROR - ${err.message}`);
        }
      }
      console.log();
    }

    // Show all users in database
    const allUsers = await User.find({}, 'email role accountType');
    console.log('\n📋 All Users in Database:');
    if (allUsers.length === 0) {
      console.log('   (No users found)');
    } else {
      allUsers.forEach(u => {
        console.log(`   - ${u.email} (${u.role}, ${u.accountType})`);
      });
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error checking users:', error);
    process.exit(1);
  }
};

checkTestUsers();
