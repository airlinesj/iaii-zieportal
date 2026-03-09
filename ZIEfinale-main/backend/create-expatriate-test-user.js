const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zie-db';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['Applicant', 'Admin', 'SuperAdmin', 'Member'], default: 'Applicant' },
  accountType: { type: String, default: 'applicant' },
  country: { type: String, sparse: true },
  applicationType: { type: String, enum: ['local', 'expatriate'], sparse: true },
  userClassification: { type: String, enum: ['local_applicant', 'expatriate_applicant', 'admin', 'superadmin', 'audit', 'member'], required: true },
  membershipStatus: { type: String, enum: ['applicant', 'member'], default: 'applicant' },
  currentMembershipGrade: { type: String, enum: ['Technician', 'Technologist', 'Member', 'Fellow'], sparse: true },
  currentMembershipDivision: { type: String, sparse: true },
  gradeProgressionHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'GradeProgression' }],
  canAccessAuditTrail: { type: Boolean, default: false },
  failedLoginAttempts: { type: Number, default: 0 },
  lastFailedLogin: { type: Date, sparse: true },
  locked: { type: Boolean, default: false },
  lockedUntil: { type: Date, sparse: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function createExpatriateTestUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const testExpat = {
      email: 'expatriate@test.com',
      password_hash: await bcrypt.hash('ExpatPassword123@#$', 10), // Strong password: 15 chars, uppercase, lowercase, number, special
      role: 'Applicant',
      accountType: 'applicant',
      country: 'United States', // Different from Zimbabwe = expatriate
      applicationType: 'expatriate',
      userClassification: 'expatriate_applicant',
      membershipStatus: 'applicant',
      canAccessAuditTrail: false,
      failedLoginAttempts: 0,
      locked: false
    };

    // Check if account already exists
    const existing = await User.findOne({ email: testExpat.email });
    if (existing) {
      console.log('⚠️  Expatriate test account already exists: expatriate@test.com');
      await mongoose.connection.close();
      process.exit(0);
    }

    const user = new User(testExpat);
    await user.save();

    console.log('\n✅ Expatriate Test Account Created Successfully!\n');
    console.log('📋 Account Details:');
    console.log('   Email: expatriate@test.com');
    console.log('   Password: ExpatPassword123@#$');
    console.log('   Country: United States');
    console.log('   Application Type: Expatriate');
    console.log('   Account Type: Applicant\n');
    console.log('📝 Note: This account needs a company recommendation letter during the application process.\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating expatriate test account:', error.message);
    process.exit(1);
  }
}

createExpatriateTestUser();
