const mongoose = require('mongoose');
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

const fixAuditAccount = async () => {
  try {
    await connectDB();
    
    // Update audit accounts - remove applicationType field entirely
    const result = await mongoose.connection.collection('users').updateMany(
      { email: { $regex: '@admin.audit' } },
      { $unset: { applicationType: '' } }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} audit account(s)`);
    console.log('✓ Removed null applicationType from audit accounts');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixAuditAccount();
