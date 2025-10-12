/**
 * Maintenance Mode Testing Script
 * Tests various scenarios of the maintenance mode middleware
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:3500';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logTest(testName) {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(`TEST: ${testName}`, colors.cyan);
  log('='.repeat(60), colors.cyan);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ ${message}`, colors.blue);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

async function testHealthCheck() {
  logTest('Health Check During Maintenance');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    if (response.status === 200) {
      logSuccess('Health check endpoint accessible during maintenance');
      logInfo(`Response: ${JSON.stringify(response.data)}`);
      return true;
    }
  } catch (error) {
    logError(`Health check failed: ${error.message}`);
    return false;
  }
}

async function testAuthRoutes() {
  logTest('Authentication Routes During Maintenance');
  try {
    // Test that auth routes are accessible
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'test',
      password: 'test'
    }, {
      validateStatus: () => true // Accept any status
    });
    
    // We expect either 401 (wrong credentials) or 200 (success)
    // But NOT 503 (maintenance mode)
    if (response.status !== 503) {
      logSuccess('Auth routes accessible during maintenance');
      logInfo(`Response status: ${response.status}`);
      return true;
    } else {
      logError('Auth routes blocked by maintenance mode');
      return false;
    }
  } catch (error) {
    logError(`Auth route test failed: ${error.message}`);
    return false;
  }
}

async function testPasswordResetRoutes() {
  logTest('Password Reset Routes During Maintenance');
  try {
    const response = await axios.post(`${BASE_URL}/api/password-reset/request`, {
      email: 'test@example.com'
    }, {
      validateStatus: () => true
    });
    
    if (response.status !== 503) {
      logSuccess('Password reset routes accessible during maintenance');
      logInfo(`Response status: ${response.status}`);
      return true;
    } else {
      logError('Password reset routes blocked by maintenance mode');
      return false;
    }
  } catch (error) {
    logError(`Password reset test failed: ${error.message}`);
    return false;
  }
}

async function testMaintenanceModeWithoutAuth() {
  logTest('Protected Routes Without Authentication');
  try {
    const response = await axios.get(`${BASE_URL}/posts`, {
      validateStatus: () => true
    });
    
    if (response.status === 503 && response.data.maintenanceMode === true) {
      logSuccess('Non-authenticated users blocked correctly');
      logInfo(`Response: ${JSON.stringify(response.data)}`);
      return true;
    } else {
      logError(`Expected 503 maintenance response, got ${response.status}`);
      logInfo(`Response: ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (error) {
    logError(`Protected route test failed: ${error.message}`);
    return false;
  }
}

async function getAdminToken() {
  try {
    logInfo('Attempting to login as admin...');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD
    });
    
    if (response.data.token) {
      logSuccess('Admin login successful');
      return response.data.token;
    }
    return null;
  } catch (error) {
    logError(`Admin login failed: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

async function testMaintenanceModeWithAdminAuth() {
  logTest('Protected Routes With Admin Authentication');
  
  const adminToken = await getAdminToken();
  
  if (!adminToken) {
    logWarning('Skipping admin bypass test - could not obtain admin token');
    logInfo('Make sure you have set ADMIN_USERNAME and ADMIN_PASSWORD environment variables');
    return null;
  }
  
  try {
    const response = await axios.get(`${BASE_URL}/posts`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      validateStatus: () => true
    });
    
    if (response.status !== 503) {
      logSuccess('Admin successfully bypassed maintenance mode');
      logInfo(`Response status: ${response.status}`);
      return true;
    } else {
      logError('Admin user blocked by maintenance mode');
      logInfo(`Response: ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (error) {
    logError(`Admin bypass test failed: ${error.message}`);
    return false;
  }
}

async function checkMaintenanceModeStatus() {
  logTest('Checking Maintenance Mode Status');
  
  try {
    // Try a simple endpoint
    const response = await axios.get(`${BASE_URL}/posts`, {
      validateStatus: () => true
    });
    
    if (response.status === 503 && response.data.maintenanceMode) {
      logWarning('MAINTENANCE MODE IS CURRENTLY ACTIVE');
      logInfo('Set MAINTENANCE_MODE=false in your environment to disable');
      return true;
    } else if (response.status === 401 || response.status === 403) {
      logInfo('Maintenance mode appears to be INACTIVE (auth required)');
      return false;
    } else {
      logInfo('Maintenance mode appears to be INACTIVE');
      return false;
    }
  } catch (error) {
    logError(`Status check failed: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  log('\n' + '═'.repeat(60), colors.blue);
  log('  MAINTENANCE MODE TESTING SUITE', colors.blue);
  log('═'.repeat(60) + '\n', colors.blue);
  
  logInfo(`Testing against: ${BASE_URL}`);
  logInfo(`Admin username: ${ADMIN_USERNAME}\n`);
  
  // Check current status
  const isMaintenanceActive = await checkMaintenanceModeStatus();
  
  if (!isMaintenanceActive) {
    logWarning('\nWARNING: Maintenance mode appears to be INACTIVE');
    logInfo('To properly test, set MAINTENANCE_MODE=true in your .env file');
    logInfo('Some tests may not behave as expected\n');
  }
  
  // Run all tests
  const results = {
    healthCheck: await testHealthCheck(),
    authRoutes: await testAuthRoutes(),
    passwordReset: await testPasswordResetRoutes(),
    maintenanceBlocking: await testMaintenanceModeWithoutAuth(),
    adminBypass: await testMaintenanceModeWithAdminAuth()
  };
  
  // Summary
  log('\n' + '═'.repeat(60), colors.blue);
  log('  TEST SUMMARY', colors.blue);
  log('═'.repeat(60) + '\n', colors.blue);
  
  const passed = Object.values(results).filter(r => r === true).length;
  const failed = Object.values(results).filter(r => r === false).length;
  const skipped = Object.values(results).filter(r => r === null).length;
  const total = Object.values(results).length;
  
  Object.entries(results).forEach(([name, result]) => {
    const status = result === true ? '✓' : result === false ? '✗' : '⊘';
    const color = result === true ? colors.green : result === false ? colors.red : colors.yellow;
    log(`${status} ${name}`, color);
  });
  
  log('');
  log(`Total: ${total} | Passed: ${passed} | Failed: ${failed} | Skipped: ${skipped}`, 
      failed === 0 ? colors.green : colors.yellow);
  
  if (failed === 0 && skipped === 0) {
    log('\n🎉 All tests passed!', colors.green);
  } else if (failed > 0) {
    log('\n⚠ Some tests failed. Please review the output above.', colors.yellow);
  }
  
  log('\n' + '═'.repeat(60) + '\n', colors.blue);
  
  return failed === 0;
}

// Run tests
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      logError(`\nUnexpected error: ${error.message}`);
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  testHealthCheck,
  testAuthRoutes,
  testPasswordResetRoutes,
  testMaintenanceModeWithoutAuth,
  testMaintenanceModeWithAdminAuth,
  checkMaintenanceModeStatus,
  runAllTests
};

