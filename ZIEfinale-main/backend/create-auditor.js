#!/usr/bin/env node
/**
 * Script to create/regenerate auditor test account
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

const createAuditorAccount = async () => {
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
      canAccessAuditTrail: { type: Boolean, default: false },
      failedLoginAttempts: { type: Number, default: 0 },
      locked: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    });

    const User = mongoose.model('User', userSchema, 'users');

    const auditorEmail = 'auditor@admin.audit';
    const auditorPassword = 'AuditorPass123@#$';

    console.log('🔧 Creating/Regenerating Auditor Account...\n');

    // Delete existing auditor if present
    const existing = await User.findOne({ email: auditorEmail });
    if (existing) {
      await User.deleteOne({ email: auditorEmail });
      console.log(`🗑️  Deleted old auditor account\n`);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(auditorPassword, salt);

    console.log('✓ Password hashed');
    console.log(`✓ Hash: ${hashedPassword}\n`);

    // Verify hash works
    const isValid = await bcrypt.compare(auditorPassword, hashedPassword);
    console.log(`✓ Password verification: ${isValid ? 'PASS' : 'FAIL'}\n`);

    // Create auditor account
    const auditorUser = new User({
      email: auditorEmail,
      password_hash: hashedPassword,
      role: 'Admin',
      accountType: 'audit',
      country: null,
      applicationType: null,
      userClassification: 'audit',
      canAccessAuditTrail: true,
      failedLoginAttempts: 0,
      locked: false
    });

    const savedAuditor = await auditorUser.save();

    console.log('✅ Auditor Account Created Successfully!\n');
    console.log('📋 Account Details:');
    console.log(`   Email: ${auditorEmail}`);
    console.log(`   Password: ${auditorPassword}`);
    console.log(`   Role: Admin (Auditor)`);
    console.log(`   Account Type: audit`);
    console.log(`   Audit Trail Access: YES`);
    console.log(`   User ID: ${savedAuditor._id}\n`);

    // Verify by logging in
    const verifyUser = await User.findOne({ email: auditorEmail });
    if (verifyUser) {
      const passwordMatch = await bcrypt.compare(auditorPassword, verifyUser.password_hash);
      console.log(`✓ Login verification: ${passwordMatch ? 'PASS ✓' : 'FAIL ❌'}\n`);
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating auditor account:', error.message);
    process.exit(1);
  }
};

createAuditorAccount();
