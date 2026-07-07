/**
 * Test script for Training Elements Review endpoints
 * Run: node test-training-elements-review.js
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api/cpd';
const ADMIN_TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Replace with valid JWT

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${ADMIN_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function runTests() {
  try {
    console.log('🧪 Starting Training Elements Review Endpoint Tests\n');

    // Test 1: List all training elements reviews
    console.log('1️⃣ Testing GET /admin/training-elements-reviews');
    try {
      const listResponse = await api.get('/admin/training-elements-reviews');
      console.log('✅ Success:', listResponse.status);
      console.log('📊 Found', listResponse.data.data?.length || 0, 'reviews');
      console.log('---\n');
    } catch (error) {
      console.error('❌ Error:', error.response?.data || error.message);
      console.log('---\n');
    }

    // Test 2: Get single training elements review (requires valid ID)
    console.log('2️⃣ Testing GET /admin/training-elements-reviews/:id');
    try {
      // Note: Replace with actual review ID from your database
      const singleResponse = await api.get('/admin/training-elements-reviews/REVIEW_ID_HERE');
      console.log('✅ Success:', singleResponse.status);
      console.log('📋 Review:', singleResponse.data.data?.applicantName);
      console.log('---\n');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('⚠️ Note: Review not found (expected if no reviews exist)');
      } else {
        console.error('❌ Error:', error.response?.data || error.message);
      }
      console.log('---\n');
    }

    // Test 3: Approve training elements review
    console.log('3️⃣ Testing POST /admin/training-elements-reviews/:id/approve');
    try {
      const approveResponse = await api.post('/admin/training-elements-reviews/REVIEW_ID_HERE/approve');
      console.log('✅ Success:', approveResponse.status);
      console.log('✔️ Review approved');
      console.log('---\n');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('⚠️ Note: Review not found (expected if no reviews exist)');
      } else {
        console.error('❌ Error:', error.response?.data?.message || error.message);
      }
      console.log('---\n');
    }

    // Test 4: Reject training elements review
    console.log('4️⃣ Testing POST /admin/training-elements-reviews/:id/reject');
    try {
      const rejectResponse = await api.post('/admin/training-elements-reviews/REVIEW_ID_HERE/reject', {
        reviewNotes: 'Training elements incomplete. Please resubmit.'
      });
      console.log('✅ Success:', rejectResponse.status);
      console.log('❌ Review rejected');
      console.log('---\n');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('⚠️ Note: Review not found (expected if no reviews exist)');
      } else {
        console.error('❌ Error:', error.response?.data?.message || error.message);
      }
      console.log('---\n');
    }

    // Test 5: Request clarification
    console.log('5️⃣ Testing POST /admin/training-elements-reviews/:id/request-clarification');
    try {
      const clarifyResponse = await api.post('/admin/training-elements-reviews/REVIEW_ID_HERE/request-clarification', {
        reviewNotes: 'Please clarify the professional development activities.'
      });
      console.log('✅ Success:', clarifyResponse.status);
      console.log('❓ Clarification requested');
      console.log('---\n');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('⚠️ Note: Review not found (expected if no reviews exist)');
      } else {
        console.error('❌ Error:', error.response?.data?.message || error.message);
      }
      console.log('---\n');
    }

    console.log('🎉 Test suite completed!\n');
    console.log('📝 Notes:');
    console.log('- Replace ADMIN_TOKEN with a valid JWT from your authentication system');
    console.log('- Replace REVIEW_ID_HERE with actual review IDs from your database');
    console.log('- Ensure the backend server is running on port 5000');
    console.log('- Make sure you\'re authenticated as an admin user\n');

  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

runTests();
