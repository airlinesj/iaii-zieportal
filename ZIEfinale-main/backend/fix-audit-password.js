const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zie');
    console.log('✓ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const fixAuditPassword = async () => {
  try {
    await connectDB();
    
    const password = 'TestPassword123@#$';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Update all audit accounts
    const result = await mongoose.connection.collection('users').updateMany(
      { accountType: 'audit' },
      { 
        $set: { 
          password_hash: hashedPassword,
          failedLoginAttempts: 0,
          locked: false
        }
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} audit account(s)`);
    console.log(`✓ Password set to: ${password}`);
    console.log('✓ Account lock status cleared');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixAuditPassword();
