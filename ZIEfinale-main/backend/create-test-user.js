m#!/usr/bin/env node
/**
 * Script to create test user accounts for development/testing
 * Run: node create-test-user.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zie-db');
    console.log('✓ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const createTestUsers = async () => {
  try {
    await connectDB();

    // Define User schema inline
    const userSchema = new mongoose.Schema({
      email: { type: String, unique: true, lowercase: true },
      password_hash: String,
      role: String,
      accountType: String,
      country: String,
      applicationType: String,
      userClassification: String,
      failedLoginAttempts: { type: Number, default: 0 },
      locked: { type: Boolean, default: false },
      canAccessAuditTrail: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    });

    const User = mongoose.model('User', userSchema, 'users');

    // Test credentials
    const testUsers = [
      {
        email: 'applicant@test.com',
        password: 'TestPassword123@#$',
        role: 'Applicant',
        accountType: 'applicant',
        country: 'Zimbabwe',
        applicationType: 'local',
        userClassification: 'local_applicant'
      },
      {
        email: 'member@test.com',
        password: 'MemberPass123@#$',
        role: 'Applicant',
        accountType: 'applicant',
        country: 'Zimbabwe',
        applicationType: 'local',
        userClassification: 'local_applicant'
      },
      {
        email: 'admin@admin.com',
        password: 'AdminPass123@#$',
        role: 'Admin',
        accountType: 'admin',
        country: null,
        applicationType: null,
        userClassification: 'admin'
      },
      {
        email: 'auditor@admin.audit',
        password: 'AuditorPass123@#$',
        role: 'Admin',
        accountType: 'audit',
        country: null,
        applicationType: null,
        userClassification: 'audit',
        canAccessAuditTrail: true
      },
      {
        email: 'superadmin@superadmin.com',
        password: 'SuperPass123@#$',
        role: 'SuperAdmin',
        accountType: 'superadmin',
        country: null,
        applicationType: null,
        userClassification: 'superadmin'
      }
    ];

    console.log('\n📝 Creating test users...\n');

    for (const userData of testUsers) {
      // Check if user exists
      const existing = await User.findOne({ email: userData.email });
      if (existing) {
        console.log(`⏭️  User already exists: ${userData.email}`);
        continue;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Create user
      const user = new User({
        ...userData,
        password_hash: hashedPassword
      });

      await user.save();
      console.log(`✅ Created: ${userData.email}`);
      console.log(`   Password: ${userData.password}`);
      console.log(`   Role: ${userData.role}`);
      console.log(`   Type: ${userData.accountType}\n`);
    }

    console.log('✅ Test users created successfully!\n');
    console.log('📋 TEST CREDENTIALS:\n');
    console.log('Applicant Account:');
    console.log('  Email: applicant@test.com');
    console.log('  Password: TestPassword123@#$\n');
    
    console.log('Admin Account:');
    console.log('  Email: admin@admin.com');
    console.log('  Password: AdminPass123@#$\n');
    
    console.log('Auditor Account:');
    console.log('  Email: auditor@admin.audit');
    console.log('  Password: AuditorPass123@#$\n');
    
    console.log('SuperAdmin Account:');
    console.log('  Email: superadmin@superadmin.com');
    console.log('  Password: SuperPass123@#$\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createTestUsers();
