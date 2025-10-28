#!/bin/bash

# Sentry AWS Deployment Script
# SuperHack 2025 - Deploy to AWS Lambda + API Gateway + DynamoDB

echo "🚀 Deploying Sentry to AWS - SuperHack 2025"
echo "============================================"

# Check if serverless is installed
if ! command -v serverless &> /dev/null; then
    echo "❌ Serverless Framework not found. Installing..."
    npm install -g serverless
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure'"
    exit 1
fi

echo "✅ AWS credentials configured"

# Set deployment stage
STAGE=${1:-dev}
REGION=${2:-us-east-1}

echo "📊 Deployment Configuration:"
echo "   Stage: $STAGE"
echo "   Region: $REGION"
echo "   Service: sentry-alert-deduplication"

# Install dependencies
echo "📦 Installing Lambda dependencies..."
cd ../lambda
npm install --production
cd ../aws

# Deploy to AWS
echo "🚀 Deploying to AWS..."
serverless deploy --stage $STAGE --region $REGION --verbose

# Get deployment outputs
echo "📋 Deployment Complete!"
echo "======================="

# Extract URLs from deployment output
WEBHOOK_URL=$(serverless info --stage $STAGE --region $REGION | grep "webhook:" | awk '{print $2}')
DEMO_URL=$(serverless info --stage $STAGE --region $REGION | grep "demo:" | awk '{print $2}')
METRICS_URL=$(serverless info --stage $STAGE --region $REGION | grep "metrics:" | awk '{print $2}')

echo "🔗 Sentry AWS Endpoints:"
echo "   Webhook URL: $WEBHOOK_URL"
echo "   Demo URL: $DEMO_URL"
echo "   Metrics URL: $METRICS_URL"

echo ""
echo "🎯 SuperHack 2025 Demo Commands:"
echo "   curl $DEMO_URL"
echo "   curl $METRICS_URL"
echo "   curl -X POST $WEBHOOK_URL -d '{\"alerts\":[{\"type\":\"CPU_HIGH\",\"severity\":\"CRITICAL\"}]}'"

echo ""
echo "📊 CloudWatch Dashboard:"
echo "   https://console.aws.amazon.com/cloudwatch/home?region=$REGION#dashboards:name=Sentry-AlertProcessing-$STAGE"

echo ""
echo "🏆 AWS Deployment Complete - Ready for SuperHack 2025!"