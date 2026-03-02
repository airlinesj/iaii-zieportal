#!/usr/bin/env node
/**
 * Setup script to create or update audit user with audit trail access
 * Run: node setup-audit-user.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zie', {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✓ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const setupAuditUser = async () => {
  try {
    await connectDB();

    // Define User schema inline
    const userSchema = new mongoose.Schema({
      email: String,
      password_hash: String,
      role: String,
      accountType: String,
      country: String,
      applicationType: String,
      userClassification: String,
      canAccessAuditTrail: Boolean,
      failedLoginAttempts: Number,
      locked: Boolean,
    });

    const User = mongoose.model('User', userSchema, 'users');

    const email = 'jeff@admin.audit';
    const password = 'jeff@audit';

    console.log(`\n📝 Setting up audit user: ${email}\n`);

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      console.log(`✓ User found. Updating permissions...\n`);
      
      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      await User.updateOne(
        { email },
        { 
          $set: { 
            password_hash: hashedPassword,
            role: 'Admin',
            accountType: 'audit',
            userClassification: 'audit',
            canAccessAuditTrail: true,
            failedLoginAttempts: 0,
            locked: false,
          } 
        }
      );

      console.log(`✅ User updated successfully!`);
    } else {
      console.log(`✓ User not found. Creating new user...\n`);
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = new User({
        email,
        password_hash: hashedPassword,
        role: 'Admin',
        accountType: 'audit',
        country: 'Zimbabwe',
        userClassification: 'audit',
        canAccessAuditTrail: true,
        failedLoginAttempts: 0,
        locked: false,
      });

      await newUser.save();
      console.log(`✅ User created successfully!`);
    }

    console.log(`\n📋 User Details:`);
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${password}`);
    console.log(`  Role: Admin`);
    console.log(`  Audit Trail Access: ✅ Enabled`);
    console.log(`  Account Type: audit`);

    console.log(`\n✓ Setup completed successfully!`);
    console.log(`🔄 Restart the backend and frontend servers, then log in with the credentials above.`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

setupAuditUser();
