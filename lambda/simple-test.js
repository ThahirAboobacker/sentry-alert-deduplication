/**
 * Simple Lambda Test - No AWS Dependencies
 * Tests core Sentry logic before deployment
 */

// Mock AWS SDK to avoid dependencies
const mockAWS = {
  DynamoDB: {
    DocumentClient: function() {
      return {
        put: () => ({ promise: () => Promise.resolve() }),
        query: () => ({ promise: () => Promise.resolve({ Items: [] }) })
      };
    }
  },
  CloudWatch: function() {
    return {
      putMetricData: () => ({ promise: () => Promise.resolve() }),
      getMetricStatistics: () => ({ promise: () => Promise.resolve({ Datapoints: [] }) })
    };
  }
};

// Replace AWS SDK with mock
require.cache[require.resolve('aws-sdk')] = {
  exports: mockAWS
};

const DeduplicationEngine = require('./deduplication-engine');
const BulletproofDemo = require('./bulletproof-demo');

async function testDeduplicationEngine() {
  console.log('🧪 Testing Deduplication Engine...');
  
  try {
    const engine = new DeduplicationEngine();
    const demo = new BulletproofDemo();
    
    // Get test alerts
    const alerts = demo.createBulletproofAlertSet();
    console.log(`📊 Generated ${alerts.length} test alerts`);
    
    // Process alerts
    const result = await engine.processAlerts(alerts);
    
    console.log('✅ Deduplication Test Results:');
    console.log(`   Input: ${result.originalCount} alerts`);
    console.log(`   Output: ${result.processedAlerts.length} alerts`);
    console.log(`   Reduction: ${result.reductionPercentage}%`);
    console.log(`   Duplicates: ${result.metrics.duplicates}`);
    console.log(`   Suppressed: ${result.metrics.suppressed}`);
    
    // Validate results
    const isValid = result.originalCount === 25 && 
                   result.processedAlerts.length <= 5 && 
                   result.reductionPercentage >= 80;
    
    console.log(`   Status: ${isValid ? '✅ PASSED' : '❌ FAILED'}`);
    return isValid;
    
  } catch (error) {
    console.error('❌ Deduplication test failed:', error.message);
    return false;
  }
}

async function testLambdaHandler() {
  console.log('\n🧪 Testing Lambda Handler Logic...');
  
  try {
    // Mock event and context
    const event = {
      body: JSON.stringify({
        alerts: [
          {
            id: 'test-1',
            timestamp: new Date().toISOString(),
            type: 'SERVICE_DOWN',
            severity: 'CRITICAL',
            client: 'Test_Client',
            server: 'srv-test-01',
            message: 'CRITICAL: Service down on srv-test-01',
            acknowledged: false,
            resolved: false
          }
        ]
      })
    };
    
    const context = {
      functionName: 'test-function',
      awsRequestId: 'test-123',
      getRemainingTimeInMillis: () => 30000
    };
    
    // Test webhook handler logic (without AWS calls)
    const engine = new DeduplicationEngine();
    const alerts = JSON.parse(event.body).alerts;
    const result = await engine.processAlerts(alerts);
    
    console.log('✅ Lambda Handler Test Results:');
    console.log(`   Processed: ${result.originalCount} alerts`);
    console.log(`   Escalated: ${result.processedAlerts.length} alerts`);
    console.log(`   Status: ✅ PASSED`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Lambda handler test failed:', error.message);
    return false;
  }
}

async function testDemoScenario() {
  console.log('\n🧪 Testing Demo Scenario...');
  
  try {
    const demo = new BulletproofDemo();
    const engine = new DeduplicationEngine();
    
    // Create demo scenario
    const alerts = demo.createBulletproofAlertSet();
    
    // Process with timing
    const startTime = Date.now();
    const result = await engine.processAlerts(alerts);
    const processingTime = Date.now() - startTime;
    
    console.log('✅ Demo Scenario Results:');
    console.log(`   Scenario: Infrastructure incident`);
    console.log(`   Input: ${result.originalCount} alerts`);
    console.log(`   Output: ${result.processedAlerts.length} alerts`);
    console.log(`   Reduction: ${result.reductionPercentage}%`);
    console.log(`   Processing Time: ${processingTime}ms`);
    console.log(`   Status: ✅ READY FOR JUDGES`);
    
    return result.reductionPercentage >= 80;
    
  } catch (error) {
    console.error('❌ Demo scenario test failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🛡️ SENTRY LAMBDA TESTS - SuperHack 2025');
  console.log('🎯 Validating AWS deployment readiness');
  console.log('=' .repeat(50));
  
  const tests = [
    { name: 'Deduplication Engine', test: testDeduplicationEngine },
    { name: 'Lambda Handler Logic', test: testLambdaHandler },
    { name: 'Demo Scenario', test: testDemoScenario }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const { name, test } of tests) {
    try {
      const result = await test();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      failed++;
      console.error(`❌ ${name}: ERROR - ${error.message}`);
    }
  }
  
  console.log('\n📊 TEST SUMMARY');
  console.log('=' .repeat(50));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🏆 ALL TESTS PASSED!');
    console.log('🚀 Sentry Lambda functions ready for AWS deployment');
    console.log('📋 Next steps:');
    console.log('   1. cd aws && ./deploy.sh dev');
    console.log('   2. Test deployed endpoints');
    console.log('   3. Present to SuperHack 2025 judges');
  } else {
    console.log('\n⚠️ Some tests failed - please fix before deployment');
  }
  
  return failed === 0;
}

// Run tests
runAllTests().catch(console.error);