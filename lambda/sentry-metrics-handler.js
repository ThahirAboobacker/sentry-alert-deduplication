/**
 * Sentry Metrics Handler for AWS Lambda
 * Provides real-time metrics and status information
 */

const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const cloudwatch = new AWS.CloudWatch();

/**
 * Lambda handler for metrics and status
 */
exports.handler = async (event, context) => {
  console.log('📊 Sentry Metrics Handler');
  
  try {
    const path = event.path || event.pathParameters?.proxy || '/metrics';
    
    if (path.includes('/status')) {
      return await handleStatus(event, context);
    } else {
      return await handleMetrics(event, context);
    }
    
  } catch (error) {
    console.error('❌ Metrics handler error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};

/**
 * Handle metrics request
 */
async function handleMetrics(event, context) {
  try {
    // Get recent metrics from DynamoDB
    const recentMetrics = await getRecentMetrics();
    
    // Get CloudWatch metrics
    const cloudWatchMetrics = await getCloudWatchMetrics();
    
    // Calculate aggregated metrics
    const aggregated = calculateAggregatedMetrics(recentMetrics);
    
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      period: 'Last 24 hours',
      summary: aggregated,
      cloudWatch: cloudWatchMetrics,
      recent: recentMetrics.slice(0, 10), // Last 10 processing runs
      aws: {
        region: process.env.AWS_REGION,
        functionName: context.functionName,
        architecture: 'AWS Lambda + DynamoDB + CloudWatch'
      }
    };
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(response, null, 2)
    };
    
  } catch (error) {
    throw error;
  }
}

/**
 * Handle status request
 */
async function handleStatus(event, context) {
  try {
    const status = {
      success: true,
      timestamp: new Date().toISOString(),
      service: 'Sentry Alert Deduplication Engine',
      version: '1.0.0',
      hackathon: 'SuperHack 2025',
      aws: {
        region: process.env.AWS_REGION,
        functionName: context.functionName,
        memorySize: context.memoryLimitInMB,
        remainingTime: context.getRemainingTimeInMillis(),
        requestId: context.awsRequestId
      },
      environment: {
        superOpsMode: process.env.SUPEROPS_MODE || 'DEMO',
        metricsTable: process.env.METRICS_TABLE,
        errorsTable: process.env.ERRORS_TABLE
      },
      features: [
        'Real-time alert deduplication',
        'Intelligent noise suppression',
        'Critical alert protection',
        'AWS Lambda serverless processing',
        'DynamoDB metrics storage',
        'CloudWatch monitoring',
        'SuperOps integration ready'
      ],
      endpoints: {
        webhook: '/webhook',
        demo: '/demo',
        metrics: '/metrics',
        status: '/status'
      }
    };
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(status, null, 2)
    };
    
  } catch (error) {
    throw error;
  }
}

/**
 * Get recent metrics from DynamoDB
 */
async function getRecentMetrics() {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const params = {
      TableName: process.env.METRICS_TABLE || 'sentry-metrics',
      IndexName: 'timestamp-index',
      KeyConditionExpression: '#timestamp > :timestamp',
      ExpressionAttributeNames: {
        '#timestamp': 'timestamp'
      },
      ExpressionAttributeValues: {
        ':timestamp': twentyFourHoursAgo
      },
      ScanIndexForward: false, // Most recent first
      Limit: 50
    };
    
    const result = await dynamodb.query(params).promise();
    return result.Items || [];
    
  } catch (error) {
    console.error('❌ Failed to get recent metrics:', error);
    return [];
  }
}

/**
 * Get CloudWatch metrics
 */
async function getCloudWatchMetrics() {
  try {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    const params = {
      Namespace: 'Sentry/AlertProcessing',
      StartTime: startTime,
      EndTime: endTime,
      MetricName: 'AlertsProcessed',
      Statistic: 'Sum',
      Period: 3600 // 1 hour periods
    };
    
    const result = await cloudwatch.getMetricStatistics(params).promise();
    
    return {
      alertsProcessed: result.Datapoints.reduce((sum, dp) => sum + dp.Sum, 0),
      dataPoints: result.Datapoints.length,
      period: '24 hours'
    };
    
  } catch (error) {
    console.error('❌ Failed to get CloudWatch metrics:', error);
    return {
      alertsProcessed: 0,
      dataPoints: 0,
      period: '24 hours',
      error: 'Failed to retrieve CloudWatch data'
    };
  }
}

/**
 * Calculate aggregated metrics
 */
function calculateAggregatedMetrics(metrics) {
  if (metrics.length === 0) {
    return {
      totalProcessingRuns: 0,
      totalAlertsProcessed: 0,
      totalAlertsEscalated: 0,
      totalDuplicatesRemoved: 0,
      totalNoiseSupressed: 0,
      averageReductionPercentage: 0,
      averageProcessingTime: 0
    };
  }
  
  const totals = metrics.reduce((acc, metric) => {
    acc.alertsProcessed += metric.inputAlerts || 0;
    acc.alertsEscalated += metric.outputAlerts || 0;
    acc.duplicatesRemoved += metric.duplicatesRemoved || 0;
    acc.noiseSupressed += metric.noiseSupressed || 0;
    acc.reductionPercentage += metric.reductionPercentage || 0;
    acc.processingTime += metric.processingTimeMs || 0;
    return acc;
  }, {
    alertsProcessed: 0,
    alertsEscalated: 0,
    duplicatesRemoved: 0,
    noiseSupressed: 0,
    reductionPercentage: 0,
    processingTime: 0
  });
  
  return {
    totalProcessingRuns: metrics.length,
    totalAlertsProcessed: totals.alertsProcessed,
    totalAlertsEscalated: totals.alertsEscalated,
    totalDuplicatesRemoved: totals.duplicatesRemoved,
    totalNoiseSupressed: totals.noiseSupressed,
    averageReductionPercentage: Math.round(totals.reductionPercentage / metrics.length),
    averageProcessingTime: Math.round(totals.processingTime / metrics.length),
    efficiency: {
      totalNoiseReduced: totals.alertsProcessed - totals.alertsEscalated,
      timeSavedMinutes: (totals.alertsProcessed - totals.alertsEscalated) * 2,
      costSavedDollars: (totals.alertsProcessed - totals.alertsEscalated) * 4
    }
  };
}