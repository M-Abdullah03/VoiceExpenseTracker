/**
 * End-to-End API Test Script
 * Tests the complete happy flow of a user through the VoiceExpense API
 *
 * Run this script with: node test-e2e.js
 * Make sure the server is running first: npm run dev
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000';
const TEST_EMAIL = `test-${Date.now()}@example.com`;
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
let testOTP = null;
let createdExpenseIds = [];

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

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test functions
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

async function testRegister() {
  logStep(2, 'Register New User');

  try {
    log(`Email: ${TEST_EMAIL}`, colors.yellow);
    log(`Password: ${TEST_PASSWORD}`, colors.yellow);

    const response = await axios.post(`${BASE_URL}/api/auth/register`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    logSuccess('User registered successfully');
    logData(response.data);

    // Wait a moment for OTP to be generated
    await sleep(1000);

    log('\nPlease check the server console for the OTP', colors.yellow);
    log('Enter the 6-digit OTP when prompted...', colors.yellow);

    return true;
  } catch (error) {
    logError('Registration failed');
    logData(error.response?.data || error.message);
    return false;
  }
}

async function testVerifyOTP(otp) {
  logStep(3, 'Verify OTP');

  try {
    log(`Verifying OTP: ${otp}`, colors.yellow);

    const response = await axios.post(`${BASE_URL}/api/auth/verify-otp`, {
      email: TEST_EMAIL,
      otp: otp,
    });

    authToken = response.data.data.token;
    userId = response.data.data.user.id;

    logSuccess('OTP verified successfully');
    logSuccess(`Auth token received: ${authToken.substring(0, 20)}...`);
    logData(response.data);

    return true;
  } catch (error) {
    logError('OTP verification failed');
    logData(error.response?.data || error.message);
    return false;
  }
}

async function testLogin() {
  logStep(4, 'Login with Email/Password');

  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    authToken = response.data.data.token;

    logSuccess('Login successful');
    logSuccess(`New auth token: ${authToken.substring(0, 20)}...`);
    logData(response.data);

    return true;
  } catch (error) {
    logError('Login failed');
    logData(error.response?.data || error.message);
    return false;
  }
}

async function testGetMe() {
  logStep(5, 'Get Current User Profile');

  try {
    const response = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
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
  logStep(6, 'Parse Voice Transcription with AI');

  try {
    const transcription = "I spent $45.50 at Starbucks for coffee with the team, and $120 on groceries at Whole Foods yesterday";

    log(`Transcription: "${transcription}"`, colors.yellow);

    const response = await axios.post(
      `${BASE_URL}/api/expenses/parse`,
      { transcription },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    logSuccess('Transcription parsed successfully');
    logSuccess(`Found ${response.data.data.expenses.length} expenses`);
    logSuccess(`Confidence: ${response.data.data.confidence}`);
    logSuccess(`AI Usage - Used: ${response.data.data.usage.used}, Remaining: ${response.data.data.usage.remaining}`);
    logData(response.data);

    return response.data.data.expenses;
  } catch (error) {
    logError('Parse transcription failed');
    logData(error.response?.data || error.message);
    return null;
  }
}

async function testCreateExpenses(expenses) {
  logStep(7, 'Create Expenses');

  try {
    log(`Creating ${expenses.length} expenses...`, colors.yellow);

    const response = await axios.post(
      `${BASE_URL}/api/expenses`,
      { expenses },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
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
  logStep(8, 'List All Expenses');

  try {
    const response = await axios.get(`${BASE_URL}/api/expenses`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    logSuccess(`Retrieved ${response.data.data.expenses.length} expenses`);
    logSuccess(`Total: ${response.data.data.pagination.total}`);
    logData(response.data);

    return true;
  } catch (error) {
    logError('List expenses failed');
    logData(error.response?.data || error.message);
    return false;
  }
}

async function testListExpensesWithFilters() {
  logStep(9, 'List Expenses with Filters');

  try {
    log('Filtering by category: Food & Drink', colors.yellow);

    const response = await axios.get(`${BASE_URL}/api/expenses`, {
      params: {
        category: 'Food & Drink',
        limit: 10,
      },
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    logSuccess(`Retrieved ${response.data.data.expenses.length} Food & Drink expenses`);
    logData(response.data);

    return true;
  } catch (error) {
    logError('List expenses with filters failed');
    logData(error.response?.data || error.message);
    return false;
  }
}

async function testGetStatistics() {
  logStep(10, 'Get Expense Statistics');

  try {
    const response = await axios.get(`${BASE_URL}/api/expenses/statistics`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
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

async function testGetSingleExpense() {
  logStep(11, 'Get Single Expense');

  try {
    if (createdExpenseIds.length === 0) {
      log('No expenses to retrieve', colors.yellow);
      return true;
    }

    const expenseId = createdExpenseIds[0];
    log(`Getting expense: ${expenseId}`, colors.yellow);

    const response = await axios.get(`${BASE_URL}/api/expenses/${expenseId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    logSuccess('Expense retrieved');
    logData(response.data);

    return true;
  } catch (error) {
    logError('Get expense failed');
    logData(error.response?.data || error.message);
    return false;
  }
}

async function testUpdateExpense() {
  logStep(12, 'Update Expense');

  try {
    if (createdExpenseIds.length === 0) {
      log('No expenses to update', colors.yellow);
      return true;
    }

    const expenseId = createdExpenseIds[0];
    log(`Updating expense: ${expenseId}`, colors.yellow);

    const updates = {
      notes: 'Updated: This was a team meeting expense',
      amount: 50.00,
    };

    log('Updates:', colors.yellow);
    logData(updates);

    const response = await axios.put(
      `${BASE_URL}/api/expenses/${expenseId}`,
      updates,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
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

async function testCreateManualExpense() {
  logStep(13, 'Create Manual Expense (without AI)');

  try {
    const manualExpenses = [
      {
        amount: 25.99,
        category: 'Transport',
        merchant: 'Uber',
        notes: 'Ride to airport',
        date: new Date().toISOString(),
      },
    ];

    log('Creating manual expense:', colors.yellow);
    logData(manualExpenses);

    const response = await axios.post(
      `${BASE_URL}/api/expenses`,
      { expenses: manualExpenses },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    createdExpenseIds.push(response.data.data.expenses[0]._id);

    logSuccess('Manual expense created');
    logData(response.data);

    return true;
  } catch (error) {
    logError('Create manual expense failed');
    logData(error.response?.data || error.message);
    return false;
  }
}

async function testDeleteExpense() {
  logStep(14, 'Delete Expense');

  try {
    if (createdExpenseIds.length === 0) {
      log('No expenses to delete', colors.yellow);
      return true;
    }

    const expenseId = createdExpenseIds[createdExpenseIds.length - 1];
    log(`Deleting expense: ${expenseId}`, colors.yellow);

    const response = await axios.delete(`${BASE_URL}/api/expenses/${expenseId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
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

async function testGetPaymentPlans() {
  logStep(15, 'Get Payment Plans');

  try {
    const response = await axios.get(`${BASE_URL}/api/payments/plans`);

    logSuccess('Payment plans retrieved');
    logData(response.data);

    return true;
  } catch (error) {
    logError('Get payment plans failed');
    logData(error.response?.data || error.message);
    return false;
  }
}

async function testUpgradeToPro() {
  logStep(16, 'Upgrade to Pro (Manual for Testing)');

  try {
    const response = await axios.post(
      `${BASE_URL}/api/payments/upgrade-pro`,
      {},
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
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

async function testParseMultipleExpenses() {
  logStep(17, 'Parse Complex Transcription (Multiple Expenses)');

  try {
    const transcription = "Yesterday I paid $15 for lunch at McDonald's, then spent $80 on groceries at Trader Joe's, and finally paid $35 for an Uber ride home";

    log(`Transcription: "${transcription}"`, colors.yellow);

    const response = await axios.post(
      `${BASE_URL}/api/expenses/parse`,
      { transcription },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    logSuccess('Complex transcription parsed successfully');
    logSuccess(`Found ${response.data.data.expenses.length} expenses`);
    logData(response.data);

    // Create these expenses too
    if (response.data.data.expenses.length > 0) {
      await testCreateExpenses(response.data.data.expenses);
    }

    return true;
  } catch (error) {
    logError('Parse complex transcription failed');
    logData(error.response?.data || error.message);
    return false;
  }
}

async function testFinalStatistics() {
  logStep(18, 'Final Statistics Summary');

  try {
    const response = await axios.get(`${BASE_URL}/api/expenses/statistics`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
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
  log('  VoiceExpense Backend - End-to-End API Test Suite  ', colors.cyan);
  log('█'.repeat(70) + '\n', colors.cyan);

  const startTime = Date.now();
  let passedTests = 0;
  let totalTests = 0;

  try {
    // Test 1: Health Check
    totalTests++;
    if (await testHealthCheck()) passedTests++;

    // Test 2: Register
    totalTests++;
    if (await testRegister()) {
      passedTests++;

      // Interactive OTP input
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      await new Promise((resolve) => {
        readline.question('\nEnter the 6-digit OTP from server console: ', async (otp) => {
          readline.close();

          // Test 3: Verify OTP
          totalTests++;
          if (await testVerifyOTP(otp.trim())) {
            passedTests++;

            // Test 4: Login
            totalTests++;
            if (await testLogin()) passedTests++;

            // Test 5: Get Me
            totalTests++;
            if (await testGetMe()) passedTests++;

            // Test 6: Parse Transcription
            totalTests++;
            const parsedExpenses = await testParseTranscription();
            if (parsedExpenses) {
              passedTests++;

              // Test 7: Create Expenses
              if (parsedExpenses.length > 0) {
                totalTests++;
                if (await testCreateExpenses(parsedExpenses)) passedTests++;
              }
            }

            // Test 8: List Expenses
            totalTests++;
            if (await testListExpenses()) passedTests++;

            // Test 9: List with Filters
            totalTests++;
            if (await testListExpensesWithFilters()) passedTests++;

            // Test 10: Get Statistics
            totalTests++;
            if (await testGetStatistics()) passedTests++;

            // Test 11: Get Single Expense
            totalTests++;
            if (await testGetSingleExpense()) passedTests++;

            // Test 12: Update Expense
            totalTests++;
            if (await testUpdateExpense()) passedTests++;

            // Test 13: Create Manual Expense
            totalTests++;
            if (await testCreateManualExpense()) passedTests++;

            // Test 14: Delete Expense
            totalTests++;
            if (await testDeleteExpense()) passedTests++;

            // Test 15: Get Payment Plans
            totalTests++;
            if (await testGetPaymentPlans()) passedTests++;

            // Test 16: Upgrade to Pro
            totalTests++;
            if (await testUpgradeToPro()) passedTests++;

            // Test 17: Parse Multiple Expenses
            totalTests++;
            if (await testParseMultipleExpenses()) passedTests++;

            // Test 18: Final Statistics
            totalTests++;
            if (await testFinalStatistics()) passedTests++;
          }

          resolve();
        });
      });
    }

  } catch (error) {
    logError(`Unexpected error: ${error.message}`);
    console.error(error);
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
  } else {
    log('⚠️  Some tests failed. Please review the errors above.', colors.yellow);
  }
}

// Run the tests
runTests().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
