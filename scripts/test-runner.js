#!/usr/bin/env node

/**
 * Phase 4 Testing & Validation Runner
 * Comprehensive test suite for hotel management system
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Phase 4: Testing & Validation');
console.log('================================\n');

const runCommand = (command, description) => {
  console.log(`📋 ${description}...`);
  try {
    const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
    console.log(`✅ ${description} - PASSED`);
    return { success: true, output };
  } catch (error) {
    console.log(`❌ ${description} - FAILED`);
    console.log(error.stdout || error.message);
    return { success: false, error: error.stdout || error.message };
  }
};

async function runPhase4Tests() {
  const results = {
    unitTests: null,
    integrationTests: null,
    securityTests: null,
    linting: null,
    typeCheck: null
  };

  // 4.1 Backend Validation - Type Checking
  results.typeCheck = runCommand('npx tsc --noEmit', 'TypeScript compilation check');

  // 4.2 Unit & Integration Testing
  console.log('\n🔬 Running Unit Tests...');
  results.unitTests = runCommand('npx vitest run src/test/unit/ --reporter=verbose', 'Unit test execution');
  
  console.log('\n🔗 Running Integration Tests...');
  results.integrationTests = runCommand('npx vitest run src/test/integration/ --reporter=verbose', 'Integration test execution');

  // 4.3 Security Testing
  console.log('\n🔒 Running Security Tests...');
  results.securityTests = runCommand('npx vitest run src/test/security/ --reporter=verbose', 'Security validation tests');

  // 4.4 Code Quality & Linting
  console.log('\n📏 Code Quality Checks...');
  results.linting = runCommand('npx eslint src/ --ext .ts,.tsx --fix', 'ESLint code quality');

  // Generate test report
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  Object.entries(results).forEach(([test, result]) => {
    const status = result?.success ? '✅ PASSED' : '❌ FAILED';
    console.log(`${test.padEnd(20)}: ${status}`);
  });

  const allTestsPassed = Object.values(results).every(r => r?.success);
  
  if (allTestsPassed) {
    console.log('\n🎉 All Phase 4 tests completed successfully!');
    console.log('🚀 System is production-ready for multi-tenant hotel management.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review and fix before production deployment.');
  }

  return allTestsPassed;
}

// Export for CI/CD integration
if (require.main === module) {
  runPhase4Tests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = { runPhase4Tests };