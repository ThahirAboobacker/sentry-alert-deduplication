/**
 * SuperOps Configuration
 * Centralized configuration for SuperOps API integration
 */

const config = {
  // API Configuration
  api: {
    baseURL: process.env.SUPEROPS_API_URL || 'https://api.superops.com/v1',
    timeout: parseInt(process.env.SUPEROPS_TIMEOUT) || 30000,
    retryAttempts: parseInt(process.env.SUPEROPS_RETRY_ATTEMPTS) || 3,
    retryDelay: parseInt(process.env.SUPEROPS_RETRY_DELAY) || 1000
  },

  // Authentication
  auth: {
    apiKey: process.env.SUPEROPS_API_KEY,
    orgId: process.env.SUPEROPS_ORG_ID,
    clientId: process.env.SUPEROPS_CLIENT_ID,
    clientSecret: process.env.SUPEROPS_CLIENT_SECRET
  },

  // Mode Configuration
  mode: {
    default: process.env.SUPEROPS_MODE || 'DEMO', // LIVE or DEMO
    autoDetect: process.env.SUPEROPS_AUTO_DETECT === 'true',
    fallbackToDemoOnError: process.env.SUPEROPS_FALLBACK_DEMO !== 'false'
  },

  // Webhook Configuration
  webhook: {
    secret: process.env.SUPEROPS_WEBHOOK_SECRET,
    events: [
      'alert.created',
      'alert.updated',
      'alert.resolved',
      'ticket.created',
      'ticket.updated'
    ],
    retryAttempts: 3
  },

  // Alert Processing
  alerts: {
    batchSize: parseInt(process.env.SUPEROPS_BATCH_SIZE) || 100,
    maxAge: parseInt(process.env.SUPEROPS_MAX_ALERT_AGE) || 86400, // 24 hours in seconds
    defaultFilters: {
      status: 'open',
      limit: 100
    }
  },

  // Ticket Creation
  tickets: {
    defaultPriority: 'medium',
    defaultCategory: 'Infrastructure',
    autoAssign: process.env.SUPEROPS_AUTO_ASSIGN === 'true',
    defaultAssignee: process.env.SUPEROPS_DEFAULT_ASSIGNEE,
    tags: ['sentry-processed', 'alert-deduplication']
  },

  // Rate Limiting
  rateLimit: {
    requestsPerMinute: parseInt(process.env.SUPEROPS_RATE_LIMIT) || 60,
    burstLimit: parseInt(process.env.SUPEROPS_BURST_LIMIT) || 10
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableApiLogging: process.env.SUPEROPS_API_LOGGING !== 'false',
    enableMetrics: process.env.SUPEROPS_METRICS !== 'false'
  },

  // Demo Configuration
  demo: {
    alertCount: parseInt(process.env.DEMO_ALERT_COUNT) || 25,
    reductionTarget: parseInt(process.env.DEMO_REDUCTION_TARGET) || 85,
    processingDelay: parseInt(process.env.DEMO_PROCESSING_DELAY) || 500
  },

  // SuperHack 2025 Specific
  hackathon: {
    projectName: 'Sentry Alert Deduplication',
    version: '1.0.0',
    category: 'Service Efficiency Improvement',
    teamName: process.env.HACKATHON_TEAM_NAME || 'Team Sentry',
    submissionId: process.env.HACKATHON_SUBMISSION_ID
  }
};

/**
 * Validate configuration
 */
function validateConfig() {
  const errors = [];
  const warnings = [];

  // Check required fields for LIVE mode
  if (config.mode.default === 'LIVE') {
    if (!config.auth.apiKey) {
      errors.push('SUPEROPS_API_KEY is required for LIVE mode');
    }
    if (!config.auth.orgId) {
      errors.push('SUPEROPS_ORG_ID is required for LIVE mode');
    }
  }

  // Check API URL format
  if (config.api.baseURL && !config.api.baseURL.startsWith('http')) {
    errors.push('SUPEROPS_API_URL must be a valid HTTP/HTTPS URL');
  }

  // Check numeric values
  if (config.api.timeout < 1000) {
    warnings.push('SUPEROPS_TIMEOUT is very low, may cause timeouts');
  }

  if (config.alerts.batchSize > 1000) {
    warnings.push('SUPEROPS_BATCH_SIZE is very high, may cause performance issues');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get configuration for specific environment
 */
function getEnvironmentConfig(env = process.env.NODE_ENV || 'development') {
  const envConfigs = {
    development: {
      ...config,
      mode: { ...config.mode, default: 'DEMO' },
      logging: { ...config.logging, level: 'debug' }
    },
    production: {
      ...config,
      mode: { ...config.mode, default: 'LIVE' },
      logging: { ...config.logging, level: 'info' }
    },
    test: {
      ...config,
      mode: { ...config.mode, default: 'DEMO' },
      api: { ...config.api, timeout: 5000 },
      logging: { ...config.logging, level: 'error' }
    }
  };

  return envConfigs[env] || config;
}

/**
 * Get SuperOps API endpoints
 */
function getApiEndpoints(baseURL = config.api.baseURL) {
  return {
    health: `${baseURL}/health`,
    alerts: `${baseURL}/alerts`,
    tickets: `${baseURL}/tickets`,
    webhooks: `${baseURL}/webhooks`,
    organization: `${baseURL}/organization`,
    usage: `${baseURL}/usage`,
    clients: `${baseURL}/clients`,
    users: `${baseURL}/users`
  };
}

/**
 * Get demo configuration
 */
function getDemoConfig() {
  return {
    mode: 'DEMO',
    alerts: {
      count: config.demo.alertCount,
      types: ['CPU_HIGH', 'MEMORY_HIGH', 'DISK_FULL', 'SERVICE_DOWN', 'NETWORK_TIMEOUT'],
      severities: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
      clients: ['Enterprise_Corp', 'TechStart_Inc', 'Global_Systems'],
      servers: ['srv-web-01', 'srv-db-01', 'srv-app-01', 'srv-api-01']
    },
    processing: {
      reductionTarget: config.demo.reductionTarget,
      delay: config.demo.processingDelay
    }
  };
}

module.exports = {
  config,
  validateConfig,
  getEnvironmentConfig,
  getApiEndpoints,
  getDemoConfig
};