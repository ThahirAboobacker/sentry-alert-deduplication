/**
 * Test Sentry Lambda Functions Locally
 * Validates functionality before AWS deployment
 */

const webhookHandler = require('./sentry-webhook-handler');
const demoHandler = require('./sentry-demo-handler');
const metricsHandler = require('./sentry-metrics-handler');

// Mock AWS SDK for local testing
const AWS = require('aws-sdk');

// Use local DynamoDB if available, otherwise mock
if (process.env.NODE_ENV !== 'production') {
  AWS.config.update({
    region: 'us-east-1',
    endpoint: 'http://localhost:8000', // Local DynamoDB
    accessKeyId: 'fake',
    secretAccessKey: 'fake'
  });
}

async function testWebhookHandler() {
  console.log('\n🧪 Testing Webhook Handler...');
  
  const event = {
    body: JSON.stringify({
      alerts: [
        {
          id: 'test-1',
          timestamp: new Date().toISOString(),
          type: 'CPU_HIGH',
          severity: 'CRITICAL',
          client: 'Test_Client',
          server: 'srv-test-01',
          message: 'High CPU usage detected on srv-test-01',
          acknowledged: false,
          resolved: false
        },
        {
          id: 'test-2',
          timestamp: new Date().toISOString(),
          type: 'CPU_HIGH',
          severity: 'CRITICAL',
          client: 'Test_Client',
          server: 'srv-test-01',
          message: 'High CPU usage detected on srv-test-01', // Duplicate
          acknowledged: false,
          resolved: false
        }
      ]
    })
  };
  
  const context = {
    functionName: 'test-webhook-handler',
    awsRequestId: 'test-request-123',
    getRemainingTimeInMillis: () => 30000
  };
  
  try {
    const result = await webhookHandler.handler(event, context);
    console.log('✅ Webhook Handler Test Result:');
    console.log(`   Status: ${result.statusCode}`);
    
    const body = JSON.parse(result.body);
    console.log(`   Input: ${body.input?.alertCount} alerts`);
    console.log(`   Output: ${body.output?.escalatedAlerts} alerts`);
    console.log(`   Reduction: ${body.processing?.reductionPercentage}%`);
    
    return result.statusCode === 200;
  } catch (error) {
    console.error('❌ Webhook Handler Test Failed:', error.message);
    return false;
  }
}

async function testDemoHandler() {
  console.log('\n🧪 Testing Demo Handler...');
  
  const event = {
    httpMethod: 'GET',
    path: '/demo'
  };
  
  const context = {
    functionName: 'test-demo-handler',
    awsRequestId: 'test-demo-123',
    getRemainingTimeInMillis: () => 30000
  };
  
  try {
    const result = await demoHandler.handler(event, context);
    console.log('✅ Demo Handler Test Result:');
    console.log(`   Status: ${result.statusCode}`);
    
    const body = JSON.parse(result.body);
    console.log(`   Demo: ${body.demo}`);
    console.log(`   Input: ${body.results?.originalCount} alerts`);
    console.log(`   Output: ${body.results?.escalatedAlerts} alerts`);
    console.log(`   Reduction: ${body.results?.reductionPercentage}%`);
    
    return result.statusCode === 200;
  } catch (error) {
    console.error('❌ Demo Handler Test Failed:', error.message);
    return false;
  }
}

async function testMetricsHandler() {
  console.log('\n🧪 Testing Metrics Handler...');
  
  const event = {
    httpMethod: 'GET',
    path: '/metrics'
  };
  
  const context = {
    functionName: 'test-metrics-handler',
    awsRequestId: 'test-metrics-123',
    getRemainingTimeInMillis: () => 30000,
    memoryLimitInMB: 512
  };
  
  try {
    const result = await metricsHandler.handler(event, context);
    console.log('✅ Metrics Handler Test Result:');
    console.log(`   Status: ${result.statusCode}`);
    
    const body = JSON.parse(result.body);
    console.log(`   Service: ${body.service || 'Sentry'}`);
    console.log(`   Total Runs: ${body.summary?.totalProcessingRuns || 0}`);
    
    return result.statusCode === 200;
  } catch (error) {
    console.error('❌ Metrics Handler Test Failed:', error.message);
    return false;
  }
}

async function testStatusHandler() {
  console.log('\n🧪 Testing Status Handler...');
  
  const event = {
    httpMethod: 'GET',
    path: '/status'
  };
  
  const context = {
    functionName: 'test-status-handler',
    awsRequestId: 'test-status-123',
    getRemainingTimeInMillis: () => 30000,
    memoryLimitInMB: 512
  };
  
  try {
    const result = await metricsHandler.handler(event, context);
    console.log('✅ Status Handler Test Result:');
    console.log(`   Status: ${result.statusCode}`);
    
    const body = JSON.parse(result.body);
    console.log(`   Service: ${body.service}`);
    console.log(`   Version: ${body.version}`);
    console.log(`   Hackathon: ${body.hackathon}`);
    
    return result.statusCode === 200;
  } catch (error) {
    console.error('❌ Status Handler Test Failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🛡️ SENTRY LAMBDA FUNCTION TESTS');
  console.log('🎯 SuperHack 2025 - AWS Deployment Validation');
  console.log('=' .repeat(50));
  
  const tests = [
    { name: 'Webhook Handler', test: testWebhookHandler },
    { name: 'Demo Handler', test: testDemoHandler },
    { name: 'Metrics Handler', test: testMetricsHandler },
    { name: 'Status Handler', test: testStatusHandler }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const { name, test } of tests) {
    try {
      const result = await test();
      if (result) {
        passed++;
        console.log(`✅ ${name}: PASSED`);
      } else {
        failed++;
        console.log(`❌ ${name}: FAILED`);
      }
    } catch (error) {
      failed++;
      console.log(`❌ ${name}: ERROR - ${error.message}`);
    }
  }
  
  console.log('\n📊 TEST RESULTS');
  console.log('=' .repeat(50));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🏆 ALL TESTS PASSED - Ready for AWS deployment!');
    console.log('🚀 Run: npm run deploy');
  } else {
    console.log('\n⚠️ Some tests failed - please fix before deployment');
  }
  
  return failed === 0;
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testWebhookHandler,
  testDemoHandler,
  testMetricsHandler,
  testStatusHandler,
  runAllTests
};