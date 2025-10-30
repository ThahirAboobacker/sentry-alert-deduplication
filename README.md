# Sentry - Alert Deduplication Engine

[![SuperHack 2025](https://img.shields.io/badge/SuperHack-2025-blue?style=flat-square)](https://superhack.superops.com)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](https://opensource.org/licenses/MIT)

**SuperHack 2025 Submission - Alert deduplication middleware for monitoring systems**

## Quick Start

```bash
# Install dependencies
npm install

# Run demonstration
npm run judge-demo

# Start local server
npm start  # Web dashboard on localhost:3000
```

## Problem Statement

MSPs and IT teams experience alert fatigue from duplicate and low-priority notifications that obscure critical issues. Infrastructure incidents can generate numerous similar alerts, overwhelming technicians and delaying response times.

## Solution: Sentry

Sentry is an alert deduplication middleware designed to process monitoring alerts through intelligent filtering and grouping. The system reduces alert volume while maintaining visibility of critical issues.

### SuperOps Compatibility
- **API Integration**: Compatible with SuperOps webhook format
- **Demo Mode**: Simulated SuperOps data for demonstration purposes
- **Webhook Endpoint**: Processes alerts via POST /webhook
- **Response Format**: Returns filtered alerts in structured format

### Key Features
- **Deduplication Algorithm**: Groups similar alerts within configurable time windows
- **Noise Suppression**: Filters low-priority and informational alerts using rule-based logic
- **Critical Alert Protection**: Preserves alerts containing severity keywords
- **AWS Serverless Deployment**: Lambda + API Gateway + DynamoDB architecture available
- **Performance**: Sub-10ms processing demonstrated in testing
- **Monitoring**: CloudWatch integration for metrics and logging

## Demonstration Results

**Test Scenario**: 25 simulated infrastructure alerts → 3 processed alerts (88% reduction)

- 18 duplicate alerts identified and grouped
- 4 low-priority alerts suppressed based on rules
- 3 critical alerts preserved and escalated
- Processing time: <10ms average

## Architecture

```
Monitoring System → Sentry Engine → Filtered Alerts → IT Team
                       ↓
                [Deduplication] → [Noise Suppression] → [Output]
```

### Core Components
- **`src/deduplication-engine.js`** - Core deduplication and filtering logic
- **`src/index.js`** - Express server with dashboard and webhook endpoints
- **`src/superops-integration-demo.js`** - SuperOps-compatible demonstration
- **`lambda/`** - AWS Lambda deployment functions

## Technical Implementation

### Deduplication Algorithm
1. Generate alert fingerprint using content hash
2. Check for duplicates within configurable time window (default: 5 minutes)
3. Group similar alerts and preserve most recent instance

### Noise Suppression Rules
- Filter alerts below configurable severity thresholds
- Suppress informational and maintenance notifications
- Remove alerts with resolved/acknowledged status
- Apply resource-specific thresholds (CPU, disk, memory)

### Critical Alert Protection
Preserves alerts containing severity keywords: `critical`, `outage`, `down`, `failed`

## API Endpoints

- **GET /** - Web dashboard with processing metrics
- **POST /webhook** - Alert processing endpoint (SuperOps compatible)
- **GET /demo** - Demonstration scenario endpoint
- **GET /api/metrics** - Processing statistics
- **GET /api/alerts** - Recent processed alerts

## Demonstration Scenarios

### Infrastructure Incident Simulation
- **Input**: 25 alerts from simulated database outage
- **Processing**: Deduplication and noise suppression applied
- **Output**: 3 critical alerts requiring attention
- **Reduction**: 88% volume decrease demonstrated

## Performance Metrics

| Metric | Demonstrated Result |
|--------|-------------------|
| Alert Volume Reduction | 88% (25→3 alerts) |
| Processing Time | <10ms average |
| Critical Alert Preservation | 100% (0 missed) |
| Duplicate Detection | 18/18 identified |

## Business Value

- **Efficiency**: Reduced alert volume improves response focus
- **Accuracy**: Critical alerts preserved through fail-safe logic
- **Scalability**: Serverless architecture supports variable loads
- **Integration**: Compatible with existing monitoring workflows

## Future Development

- **Machine Learning**: Pattern recognition for adaptive filtering
- **Custom Rules**: Client-specific suppression configuration
- **Enhanced Integration**: Extended monitoring platform support
- **Analytics**: Historical trend analysis and reporting

## SuperHack 2025 Submission

This project addresses **Service Efficiency Improvement** through:
1. Demonstrated alert volume reduction (88%)
2. Preservation of critical alert visibility
3. Compatible integration approach with SuperOps
4. Measurable performance improvements

**Technology demonstration ready for evaluation and potential production integration.**

---

*SuperHack 2025 Submission - Alert Management Efficiency Solution*