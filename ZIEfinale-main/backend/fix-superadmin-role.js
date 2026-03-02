#!/usr/bin/env node
/**
 * Quick fix script to update super admin account role in MongoDB
 * Run: node fix-superadmin-role.js
 */

const mongoose = require('mongoose');
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

const fixSuperAdminRole = async () => {
  try {
    await connectDB();

    // Define User schema inline
    const userSchema = new mongoose.Schema({
      email: String,
      password_hash: String,
      role: String,
      country: String,
      applicationType: String,
      userClassification: String,
    });

    const User = mongoose.model('User', userSchema, 'users');

    // Find all super admin accounts
    const superAdminAccounts = await User.find({ email: { $regex: '@superadmin' } });

    if (superAdminAccounts.length === 0) {
      console.log('⚠️ No accounts found with @superadmin email');
      console.log('\nTo create a super admin account, register with:');
      console.log('  Email: superadmin@superadmin.com (or any email with @superadmin)');
      console.log('  Password: your_password');
      console.log('  Role: SuperAdmin');
      process.exit(0);
    }

    console.log(`\n📝 Found ${superAdminAccounts.length} super admin account(s):\n`);

    for (const account of superAdminAccounts) {
      console.log(`Email: ${account.email}`);
      console.log(`  Current Role: ${account.role}`);
      console.log(`  User Classification: ${account.userClassification}`);

      if (account.role !== 'SuperAdmin') {
        console.log(`  ⚠️ Fixing role from '${account.role}' to 'SuperAdmin'...`);
        
        await User.updateOne(
          { _id: account._id },
          { 
            $set: { 
              role: 'SuperAdmin',
              userClassification: 'superadmin'
            } 
          }
        );

        console.log(`  ✅ Role updated to 'SuperAdmin'`);
      } else {
        console.log(`  ✅ Role is already correct (SuperAdmin)`);
      }
      console.log();
    }

    console.log('✓ Super admin role check/fix completed');
    console.log('\n🔄 Restart the backend server and try logging in again');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixSuperAdminRole();
