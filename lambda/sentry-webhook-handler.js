/**
 * Sentry AWS Lambda Webhook Handler
 * Processes SuperOps alerts in serverless environment
 */

const DeduplicationEngine = require('./deduplication-engine');
const SuperOpsUnifiedClient = require('./superops-unified-client');
const AWS = require('aws-sdk');

// Initialize AWS services
const dynamodb = new AWS.DynamoDB.DocumentClient();
const cloudwatch = new AWS.CloudWatch();

// Initialize Sentry components
const deduplicationEngine = new DeduplicationEngine();
const superOpsClient = new SuperOpsUnifiedClient({
  mode: process.env.SUPEROPS_MODE || 'DEMO'
});

/**
 * Lambda handler for SuperOps webhook alerts
 */
exports.handler = async (event, context) => {
  console.log('🛡️ Sentry Lambda Handler - Processing SuperOps alerts');
  
  const startTime = Date.now();
  
  try {
    // Parse incoming webhook data
    const alerts = parseWebhookEvent(event);
    console.log(`📥 Received ${alerts.length} alerts from SuperOps`);
    
    // Process through Sentry deduplication engine
    const result = await deduplicationEngine.processAlerts(alerts);
    
    // Store metrics in DynamoDB
    await storeProcessingMetrics(result, context);
    
    // Send CloudWatch metrics
    await sendCloudWatchMetrics(result);
    
    // Create tickets for escalated alerts
    const tickets = await createTicketsForAlerts(result.processedAlerts);
    
    const processingTime = Date.now() - startTime;
    
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      processingTime,
      input: {
        alertCount: alerts.length,
        source: 'SuperOps Webhook'
      },
      processing: {
        duplicatesRemoved: result.metrics.duplicates,
        noiseSupressed: result.metrics.suppressed,
        reductionPercentage: result.reductionPercentage
      },
      output: {
        escalatedAlerts: result.processedAlerts.length,
        ticketsCreated: tickets.length
      },
      aws: {
        region: process.env.AWS_REGION,
        functionName: context.functionName,
        requestId: context.awsRequestId
      }
    };
    
    console.log(`✅ Processing complete: ${alerts.length} → ${result.processedAlerts.length} alerts (${result.reductionPercentage}% reduction)`);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Sentry-Version': '1.0.0',
        'X-Processing-Time': processingTime.toString()
      },
      body: JSON.stringify(response)
    };
    
  } catch (error) {
    console.error('❌ Lambda processing error:', error);
    
    // Store error metrics
    await storeErrorMetrics(error, context);
    
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
 * Parse webhook event from API Gateway
 */
function parseWebhookEvent(event) {
  try {
    // Handle API Gateway event format
    if (event.body) {
      const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      
      // SuperOps webhook format
      if (body.alerts) {
        return Array.isArray(body.alerts) ? body.alerts : [body.alerts];
      }
      
      // Single alert format
      if (body.alert) {
        return [body.alert];
      }
      
      // Direct alert array
      if (Array.isArray(body)) {
        return body;
      }
      
      // Single alert object
      return [body];
    }
    
    // Direct invocation format
    if (event.alerts) {
      return Array.isArray(event.alerts) ? event.alerts : [event.alerts];
    }
    
    // Fallback to demo data for testing
    console.log('⚠️ No alerts in event, using demo data');
    const BulletproofDemo = require('./bulletproof-demo');
    const demo = new BulletproofDemo();
    return demo.createBulletproofAlertSet();
    
  } catch (error) {
    console.error('❌ Error parsing webhook event:', error);
    throw new Error(`Invalid webhook format: ${error.message}`);
  }
}

/**
 * Store processing metrics in DynamoDB
 */
async function storeProcessingMetrics(result, context) {
  try {
    const item = {
      id: context.awsRequestId,
      timestamp: new Date().toISOString(),
      functionName: context.functionName,
      inputAlerts: result.originalCount,
      outputAlerts: result.processedAlerts.length,
      duplicatesRemoved: result.metrics.duplicates,
      noiseSupressed: result.metrics.suppressed,
      reductionPercentage: result.reductionPercentage,
      processingTimeMs: Date.now() - context.getRemainingTimeInMillis(),
      ttl: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days TTL
    };
    
    await dynamodb.put({
      TableName: process.env.METRICS_TABLE || 'sentry-metrics',
      Item: item
    }).promise();
    
    console.log('📊 Metrics stored in DynamoDB');
  } catch (error) {
    console.error('❌ Failed to store metrics:', error);
    // Don't throw - metrics storage shouldn't break main flow
  }
}

/**
 * Send metrics to CloudWatch
 */
async function sendCloudWatchMetrics(result) {
  try {
    const params = {
      Namespace: 'Sentry/AlertProcessing',
      MetricData: [
        {
          MetricName: 'AlertsProcessed',
          Value: result.originalCount,
          Unit: 'Count',
          Timestamp: new Date()
        },
        {
          MetricName: 'AlertsEscalated',
          Value: result.processedAlerts.length,
          Unit: 'Count',
          Timestamp: new Date()
        },
        {
          MetricName: 'NoiseReduction',
          Value: result.reductionPercentage,
          Unit: 'Percent',
          Timestamp: new Date()
        },
        {
          MetricName: 'DuplicatesRemoved',
          Value: result.metrics.duplicates,
          Unit: 'Count',
          Timestamp: new Date()
        }
      ]
    };
    
    await cloudwatch.putMetricData(params).promise();
    console.log('📈 Metrics sent to CloudWatch');
  } catch (error) {
    console.error('❌ Failed to send CloudWatch metrics:', error);
    // Don't throw - metrics shouldn't break main flow
  }
}

/**
 * Create tickets for escalated alerts
 */
async function createTicketsForAlerts(alerts) {
  const tickets = [];
  
  try {
    // Create tickets for top 3 critical alerts to avoid overwhelming
    const topAlerts = alerts.slice(0, 3);
    
    for (const alert of topAlerts) {
      try {
        const ticketData = {
          title: `Alert: ${alert.type} - ${alert.server}`,
          severity: alert.severity,
          message: alert.message,
          client: alert.client,
          server: alert.server,
          processedBy: 'Sentry AWS Lambda'
        };
        
        const ticket = await superOpsClient.createTicket(ticketData);
        if (ticket.success) {
          tickets.push(ticket);
          console.log(`🎫 Ticket created: ${ticket.ticketNumber}`);
        }
      } catch (error) {
        console.error(`❌ Failed to create ticket for alert ${alert.id}:`, error);
      }
    }
  } catch (error) {
    console.error('❌ Error in ticket creation process:', error);
  }
  
  return tickets;
}

/**
 * Store error metrics in DynamoDB
 */
async function storeErrorMetrics(error, context) {
  try {
    const item = {
      id: `error-${context.awsRequestId}`,
      timestamp: new Date().toISOString(),
      functionName: context.functionName,
      errorMessage: error.message,
      errorStack: error.stack,
      ttl: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days TTL
    };
    
    await dynamodb.put({
      TableName: process.env.ERRORS_TABLE || 'sentry-errors',
      Item: item
    }).promise();
    
  } catch (dbError) {
    console.error('❌ Failed to store error metrics:', dbError);
  }
}