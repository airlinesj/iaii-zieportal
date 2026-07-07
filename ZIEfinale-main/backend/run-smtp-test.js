// Run the compiled emailService testSMTPConnection
require('dotenv').config();
const emailService = require('./dist/services/emailService');

(async () => {
  try {
    const result = await emailService.testSMTPConnection();
    console.log('RESULT:', result);
    process.exit(result.success ? 0 : 1);
  } catch (err) {
    console.error('Fatal error running SMTP test:', err);
    process.exit(1);
  }
})();
