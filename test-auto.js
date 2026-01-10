/**
 * Automated End-to-End API Test Script
 * Tests the API without requiring manual OTP input
 *
 * This version creates a user, manually verifies them in the database,
 * then runs the full test suite.
 *
 * Run this script with: npm run test:auto
 * Make sure the server is running first: npm run dev
 */

const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// Configuration
const BASE_URL = 'http://localhost:5000';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/voiceexpense';
const TEST_EMAIL = `test-auto-${Date.now()}@example.com`;
const TEST_PASSWORD = 'password123';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

// Shared state
let authToken = null;
let userId = null;
let createdExpenseIds = [];
let User = null;

// Helper functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, description) {
  console.log('\n' + '='.repeat(70));
  log(`STEP ${step}: ${description}`, colors.cyan);
  console.log('='.repeat(70));
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logData(data) {
  console.log(JSON.stringify(data, null, 2));
}

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    log('Connected to MongoDB for test setup', colors.green);

    // Import User model
    const userSchema = new mongoose.Schema({
      email: String,
      password_hash: String,
      oauth_provider: String,
      oauth_provider_id: String,
      profile_image_url: String,
      plan_status: String,
      trial_started_at: Date,
      email_verified: Boolean,
      created_at: Date,
    });

    User = mongoose.models.User || mongoose.model('User', userSchema);

    return true;
  } catch (error) {
    logError(`MongoDB connection failed: ${error.message}`);
    return false;
  }
}

async function setupTestUser() {
  logStep(0, 'Setting Up Test User (Auto-Verified)');

  try {
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(TEST_PASSWORD, salt);

    // Create user directly in database
    const user = await User.create({
      email: TEST_EMAIL,
      password_hash: hashedPassword,
      plan_status: 'trial',
      email_verified: true, // Auto-verify for automated testing
      trial_started_at: new Date(),
      created_at: new Date(),
    });

    userId = user._id.toString();

    logSuccess(`Test user created: ${TEST_EMAIL}`);
    logSuccess(`User ID: ${userId}`);

    return true;
  } catch (error) {
    logError(`Failed to create test user: ${error.message}`);
    return false;
  }
}

async function cleanupTestUser() {
  try {
    if (User && TEST_EMAIL) {
      await User.deleteMany({ email: TEST_EMAIL });
      log('Test user cleaned up', colors.yellow);
    }
  } catch (error) {
    logError(`Cleanup failed: ${error.message}`);
  }
}

async function disconnectDB() {
  try {
    await mongoose.disconnect();
    log('Disconnected from MongoDB', colors.yellow);
  } catch (error) {
    logError(`Disconnect failed: ${error.message}`);
  }
}

// Test functions (same as test-e2e.js but without OTP steps)
async function testHealthCheck() {
  logStep(1, 'Health Check');

  try {
    const response = await axios.get(`${BASE_URL}/health`);
    logSuccess('Server is healthy');
    logData(response.data);
    return true;
  } catch (error) {
    logError('Health check failed');
    logData(error.response?.data || error.message);
    return false;
  }
}

async function testLogin() {
  logStep(2, 'Login with Email/Password');

  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    authToken = response.data.data.token;
    userId = response.data.data.user.id;

    logSuccess('Login successful');
    logSuccess(`Auth token: ${authToken.substring(0, 20)}...`);
    logData(response.data);

    return true;
  } catch (error) {
    logError('Login failed');
    logData(error.response?.data || error.message);
    return false;
  }
}

async function testGetMe() {
  logStep(3, 'Get Current User Profile');

  try {
    const response = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    logSuccess('User profile retrieved');
    logData(response.data);
    return true;
  } catch (error) {
    logError('Get profile failed');
    logData(error.response?.data || error.message);
    return false;
  }
}

async function testParseTranscription() {
  logStep(4, 'Parse Voice Transcription with AI');

  try {
    const transcription = "I spent $45.50 at Starbucks for coffee with the team, and $120 on groceries at Whole Foods";

    log(`Transcription: "${transcription}"`, colors.yellow);

    const response = await axios.post(
      `${BASE_URL}/api/expenses/parse`,
      { transcription },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    logSuccess('Transcription parsed successfully');
    logSuccess(`Found ${response.data.data.expenses.length} expenses`);
    logSuccess(`Confidence: ${response.data.data.confidence}`);
    logData(response.data);

    return response.data.data.expenses;
  } catch (error) {
    logError('Parse transcription failed');
    logData(error.response?.data || error.message);
    return null;
  }
}

async function testCreateExpenses(expenses) {
  logStep(5, 'Create Expenses');

  try {
    const response = await axios.post(
      `${BASE_URL}/api/expenses`,
      { expenses },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    createdExpenseIds = response.data.data.expenses.map(e => e._id);

    logSuccess(`Created ${response.data.data.count} expenses`);
    logData(response.data);
    return true;
  } catch (error) {
    logError('Create expenses failed');
    logData(error.response?.data || error.message);
    return false;
  }
}

async function testListExpenses() {
  logStep(6, 'List All Expenses');

  try {
    const response = await axios.get(`${BASE_URL}/api/expenses`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    logSuccess(`Retrieved ${response.data.data.expenses.length} expenses`);
    logData(response.data);
    return true;
  } catch (error) {
    logError('List expenses failed');
    logData(error.response?.data || error.message);
    return false;
  }
}

async function testGetStatistics() {
  logStep(7, 'Get Expense Statistics');

  try {
    const response = await axios.get(`${BASE_URL}/api/expenses/statistics`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    logSuccess('Statistics retrieved');
    logSuccess(`Overall Total: $${response.data.data.overallTotal.toFixed(2)}`);
    logData(response.data);
    return true;
  } catch (error) {
    logError('Get statistics failed');
    logData(error.response?.data || error.message);
    return false;
  }
}

async function testUpdateExpense() {
  logStep(8, 'Update Expense');

  try {
    if (createdExpenseIds.length === 0) {
      log('No expenses to update', colors.yellow);
      return true;
    }

    const expenseId = createdExpenseIds[0];
    const updates = {
      notes: 'Updated via automated test',
      amount: 50.00,
    };

    const response = await axios.put(
      `${BASE_URL}/api/expenses/${expenseId}`,
      updates,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    logSuccess('Expense updated successfully');
    logData(response.data);
    return true;
  } catch (error) {
    logError('Update expense failed');
    logData(error.response?.data || error.message);
    return false;
  }
}

async function testDeleteExpense() {
  logStep(9, 'Delete Expense');

  try {
    if (createdExpenseIds.length === 0) {
      log('No expenses to delete', colors.yellow);
      return true;
    }

    const expenseId = createdExpenseIds[createdExpenseIds.length - 1];

    const response = await axios.delete(`${BASE_URL}/api/expenses/${expenseId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    logSuccess('Expense deleted successfully');
    logData(response.data);
    return true;
  } catch (error) {
    logError('Delete expense failed');
    logData(error.response?.data || error.message);
    return false;
  }
}

async function testUpgradeToPro() {
  logStep(10, 'Upgrade to Pro');

  try {
    const response = await axios.post(
      `${BASE_URL}/api/payments/upgrade-pro`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    logSuccess('Upgraded to Pro successfully');
    logData(response.data);
    return true;
  } catch (error) {
    logError('Upgrade to Pro failed');
    logData(error.response?.data || error.message);
    return false;
  }
}

async function testMultipleExpenses() {
  logStep(11, 'Parse and Create Multiple Expenses');

  try {
    const transcription = "I spent $15 on lunch, $80 on groceries, and $35 on a taxi";

    const parseResponse = await axios.post(
      `${BASE_URL}/api/expenses/parse`,
      { transcription },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    logSuccess(`Parsed ${parseResponse.data.data.expenses.length} expenses`);

    if (parseResponse.data.data.expenses.length > 0) {
      await testCreateExpenses(parseResponse.data.data.expenses);
    }

    return true;
  } catch (error) {
    logError('Multiple expenses test failed');
    logData(error.response?.data || error.message);
    return false;
  }
}

async function testFinalStatistics() {
  logStep(12, 'Final Statistics Summary');

  try {
    const response = await axios.get(`${BASE_URL}/api/expenses/statistics`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    logSuccess('Final statistics retrieved');
    logSuccess(`Total Spent: $${response.data.data.overallTotal.toFixed(2)}`);

    log('\nBreakdown by Category:', colors.blue);
    response.data.data.byCategory.forEach(cat => {
      log(`  ${cat.category}: $${cat.total.toFixed(2)} (${cat.count} expenses)`, colors.blue);
    });

    return true;
  } catch (error) {
    logError('Get final statistics failed');
    logData(error.response?.data || error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  log('\n' + '█'.repeat(70), colors.cyan);
  log('  VoiceExpense Backend - Automated E2E Test Suite  ', colors.cyan);
  log('█'.repeat(70) + '\n', colors.cyan);

  const startTime = Date.now();
  let passedTests = 0;
  let totalTests = 0;

  try {
    // Connect to database
    if (!await connectDB()) {
      logError('Failed to connect to database. Exiting.');
      return;
    }

    // Setup test user
    await cleanupTestUser(); // Clean up any previous test data
    if (!await setupTestUser()) {
      logError('Failed to setup test user. Exiting.');
      await disconnectDB();
      return;
    }

    // Run tests
    totalTests++; if (await testHealthCheck()) passedTests++;
    totalTests++; if (await testLogin()) passedTests++;
    totalTests++; if (await testGetMe()) passedTests++;

    const parsedExpenses = await testParseTranscription();
    totalTests++;
    if (parsedExpenses) {
      passedTests++;

      if (parsedExpenses.length > 0) {
        totalTests++; if (await testCreateExpenses(parsedExpenses)) passedTests++;
      }
    }

    totalTests++; if (await testListExpenses()) passedTests++;
    totalTests++; if (await testGetStatistics()) passedTests++;
    totalTests++; if (await testUpdateExpense()) passedTests++;
    totalTests++; if (await testDeleteExpense()) passedTests++;
    totalTests++; if (await testUpgradeToPro()) passedTests++;
    totalTests++; if (await testMultipleExpenses()) passedTests++;
    totalTests++; if (await testFinalStatistics()) passedTests++;

  } catch (error) {
    logError(`Unexpected error: ${error.message}`);
    console.error(error);
  } finally {
    // Cleanup
    await cleanupTestUser();
    await disconnectDB();
  }

  // Final summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n' + '█'.repeat(70));
  log('  TEST SUMMARY  ', colors.cyan);
  console.log('█'.repeat(70));

  log(`\nTotal Tests: ${totalTests}`, colors.blue);
  log(`Passed: ${passedTests}`, colors.green);
  log(`Failed: ${totalTests - passedTests}`, colors.red);
  log(`Duration: ${duration}s`, colors.yellow);

  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  log(`Success Rate: ${successRate}%`, successRate === '100.0' ? colors.green : colors.yellow);

  console.log('\n' + '█'.repeat(70) + '\n');

  if (passedTests === totalTests) {
    log('🎉 All tests passed! The API is working correctly.', colors.green);
    process.exit(0);
  } else {
    log('⚠️  Some tests failed. Please review the errors above.', colors.yellow);
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
