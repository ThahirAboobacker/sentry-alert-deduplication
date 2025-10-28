/**
 * Sentry Demo Handler for AWS Lambda
 * Perfect for judge presentations - guaranteed results
 */

const DeduplicationEngine = require('./deduplication-engine');
const BulletproofDemo = require('./bulletproof-demo');
const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const cloudwatch = new AWS.CloudWatch();

/**
 * Lambda handler for demo scenarios
 */
exports.handler = async (event, context) => {
  console.log('🎬 Sentry Demo Handler - SuperHack 2025');
  
  const startTime = Date.now();
  
  try {
    // Initialize components
    const deduplicationEngine = new DeduplicationEngine();
    const bulletproofDemo = new BulletproofDemo();
    
    // Get bulletproof demo data
    const alerts = bulletproofDemo.createBulletproofAlertSet();
    console.log(`📊 Generated ${alerts.length} demo alerts`);
    
    // Process through Sentry engine
    const result = await deduplicationEngine.processAlerts(alerts);
    
    // Store demo metrics
    await storeDemoMetrics(result, context);
    
    // Send CloudWatch metrics
    await sendDemoCloudWatchMetrics(result);
    
    const processingTime = Date.now() - startTime;
    
    const response = {
      success: true,
      demo: 'SuperHack 2025 Judge Presentation',
      timestamp: new Date().toISOString(),
      processingTime,
      scenario: {
        description: 'Major infrastructure incident - Database cascade failure',
        inputAlerts: alerts.length,
        alertTypes: [...new Set(alerts.map(a => a.type))],
        severities: [...new Set(alerts.map(a => a.severity))]
      },
      results: {
        originalCount: result.originalCount,
        escalatedAlerts: result.processedAlerts.length,
        duplicatesRemoved: result.metrics.duplicates,
        noiseSupressed: result.metrics.suppressed,
        reductionPercentage: result.reductionPercentage
      },
      businessImpact: {
        timeSavedMinutes: (result.originalCount - result.processedAlerts.length) * 2,
        costSavedDollars: (result.originalCount - result.processedAlerts.length) * 4,
        responseImprovement: `${result.reductionPercentage}% faster`,
        alertFatigueReduction: `${result.reductionPercentage}% fewer notifications`
      },
      aws: {
        region: process.env.AWS_REGION,
        functionName: context.functionName,
        requestId: context.awsRequestId,
        architecture: 'AWS Lambda + API Gateway + DynamoDB'
      },
      topAlerts: result.processedAlerts.slice(0, 3).map(alert => ({
        severity: alert.severity,
        type: alert.type,
        message: alert.message.substring(0, 80) + '...',
        server: alert.server
      }))
    };
    
    console.log(`✅ Demo complete: ${result.originalCount} → ${result.processedAlerts.length} alerts (${result.reductionPercentage}% reduction)`);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Sentry-Demo': 'SuperHack-2025',
        'X-Processing-Time': processingTime.toString()
      },
      body: JSON.stringify(response, null, 2)
    };
    
  } catch (error) {
    console.error('❌ Demo handler error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: context.awsRequestId
      })
    };
  }
};

/**
 * Store demo metrics in DynamoDB
 */
async function storeDemoMetrics(result, context) {
  try {
    const item = {
      id: `demo-${context.awsRequestId}`,
      timestamp: new Date().toISOString(),
      type: 'demo',
      functionName: context.functionName,
      inputAlerts: result.originalCount,
      outputAlerts: result.processedAlerts.length,
      duplicatesRemoved: result.metrics.duplicates,
      noiseSupressed: result.metrics.suppressed,
      reductionPercentage: result.reductionPercentage,
      processingTimeMs: Date.now() - context.getRemainingTimeInMillis(),
      hackathon: 'SuperHack2025',
      ttl: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days TTL
    };
    
    await dynamodb.put({
      TableName: process.env.METRICS_TABLE || 'sentry-metrics',
      Item: item
    }).promise();
    
    console.log('📊 Demo metrics stored in DynamoDB');
  } catch (error) {
    console.error('❌ Failed to store demo metrics:', error);
  }
}

/**
 * Send demo metrics to CloudWatch
 */
async function sendDemoCloudWatchMetrics(result) {
  try {
    const params = {
      Namespace: 'Sentry/Demo',
      MetricData: [
        {
          MetricName: 'DemoExecutions',
          Value: 1,
          Unit: 'Count',
          Timestamp: new Date(),
          Dimensions: [
            {
              Name: 'Hackathon',
              Value: 'SuperHack2025'
            }
          ]
        },
        {
          MetricName: 'DemoReduction',
          Value: result.reductionPercentage,
          Unit: 'Percent',
          Timestamp: new Date(),
          Dimensions: [
            {
              Name: 'Hackathon',
              Value: 'SuperHack2025'
            }
          ]
        }
      ]
    };
    
    await cloudwatch.putMetricData(params).promise();
    console.log('📈 Demo metrics sent to CloudWatch');
  } catch (error) {
    console.error('❌ Failed to send demo CloudWatch metrics:', error);
  }
}