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

const checkAccounts = async () => {
  try {
    await connectDB();
    
    const auditors = await mongoose.connection.collection('users').find({
      $or: [
        { email: { $regex: 'audit' } },
        { accountType: 'audit' }
      ]
    }).toArray();
    
    console.log(`Found ${auditors.length} audit-related accounts:`);
    auditors.forEach(u => {
      console.log(`  Email: ${u.email}, applicationType: ${u.applicationType}, accountType: ${u.accountType}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkAccounts();
