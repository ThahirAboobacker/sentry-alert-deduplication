/**
 * SuperOps Production API Client
 * Real integration with SuperOps platform for SuperHack 2025
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

class SuperOpsProductionClient {
  constructor(config = {}) {
    this.config = {
      baseURL: config.baseURL || process.env.SUPEROPS_API_URL || 'https://api.superops.com/v1',
      apiKey: config.apiKey || process.env.SUPEROPS_API_KEY,
      orgId: config.orgId || process.env.SUPEROPS_ORG_ID,
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      ...config
    };

    // Initialize axios instance with default config
    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Sentry-Alert-Deduplication/1.0.0 (SuperHack-2025)',
        'X-Organization-ID': this.config.orgId
      }
    });

    // Add request/response interceptors for logging and error handling
    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`🔗 SuperOps API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('🚨 SuperOps API Request Error:', error.message);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ SuperOps API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      async (error) => {
        console.error(`❌ SuperOps API Error: ${error.response?.status} ${error.config?.url}`);
        
        // Handle rate limiting
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'] || 60;
          console.log(`⏳ Rate limited, retrying after ${retryAfter}s`);
          await this.sleep(retryAfter * 1000);
          return this.client.request(error.config);
        }

        // Handle authentication errors
        if (error.response?.status === 401) {
          console.error('🔐 Authentication failed - check API key');
          throw new Error('SuperOps authentication failed. Please check your API key.');
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Test API connection and authentication
   */
  async testConnection() {
    try {
      console.log('🔍 Testing SuperOps API connection...');
      
      const response = await this.client.get('/health');
      
      console.log('✅ SuperOps API connection successful');
      return {
        success: true,
        status: response.status,
        data: response.data
      };
    } catch (error) {
      console.error('❌ SuperOps API connection failed:', error.message);
      return {
        success: false,
        error: error.message,
        status: error.response?.status
      };
    }
  }

  /**
   * Get alerts from SuperOps
   * Supports filtering, pagination, and real-time data
   */
  async getAlerts(filters = {}) {
    try {
      const params = {
        limit: filters.limit || 100,
        offset: filters.offset || 0,
        status: filters.status || 'open',
        severity: filters.severity,
        created_after: filters.createdAfter,
        created_before: filters.createdBefore,
        client_id: filters.clientId,
        ...filters
      };

      console.log('📥 Fetching alerts from SuperOps...');
      const response = await this.client.get('/alerts', { params });

      const alerts = this.normalizeAlerts(response.data.alerts || response.data.data || []);
      
      console.log(`📊 Retrieved ${alerts.length} alerts from SuperOps`);
      
      return {
        alerts,
        total: response.data.total || alerts.length,
        hasMore: response.data.has_more || false,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Failed to fetch alerts:', error.message);
      throw new Error(`SuperOps alert fetch failed: ${error.message}`);
    }
  }

  /**
   * Create a ticket in SuperOps from processed alerts
   */
  async createTicket(alertData) {
    try {
      const ticketPayload = {
        title: alertData.title || `Alert: ${alertData.type} - ${alertData.server}`,
        description: this.formatTicketDescription(alertData),
        priority: this.mapSeverityToPriority(alertData.severity),
        category: 'Infrastructure',
        subcategory: alertData.type || 'Monitoring',
        client_id: alertData.clientId,
        assigned_to: alertData.assignedTo,
        tags: alertData.tags || [`sentry-processed`, `alert-type:${alertData.type}`],
        custom_fields: {
          alert_source: 'Sentry Deduplication Engine',
          original_alert_count: alertData.originalCount,
          deduplication_ratio: alertData.reductionPercentage,
          processed_at: new Date().toISOString()
        }
      };

      console.log('🎫 Creating ticket in SuperOps...');
      const response = await this.client.post('/tickets', ticketPayload);

      console.log(`✅ Ticket created: ${response.data.id}`);
      
      return {
        success: true,
        ticketId: response.data.id,
        ticketNumber: response.data.ticket_number,
        url: response.data.url,
        data: response.data
      };
    } catch (error) {
      console.error('❌ Failed to create ticket:', error.message);
      throw new Error(`SuperOps ticket creation failed: ${error.message}`);
    }
  }

  /**
   * Update alert status in SuperOps
   */
  async updateAlertStatus(alertId, status, notes = '') {
    try {
      const updatePayload = {
        status,
        notes,
        updated_by: 'Sentry Deduplication Engine',
        updated_at: new Date().toISOString()
      };

      console.log(`🔄 Updating alert ${alertId} status to ${status}...`);
      const response = await this.client.patch(`/alerts/${alertId}`, updatePayload);

      console.log(`✅ Alert ${alertId} updated successfully`);
      
      return {
        success: true,
        alertId,
        status,
        data: response.data
      };
    } catch (error) {
      console.error(`❌ Failed to update alert ${alertId}:`, error.message);
      throw new Error(`SuperOps alert update failed: ${error.message}`);
    }
  }

  /**
   * Set up webhook for real-time alert processing
   */
  async setupWebhook(webhookUrl, events = ['alert.created', 'alert.updated']) {
    try {
      const webhookPayload = {
        url: webhookUrl,
        events,
        active: true,
        description: 'Sentry Alert Deduplication Engine - SuperHack 2025',
        secret: this.generateWebhookSecret()
      };

      console.log('🔗 Setting up SuperOps webhook...');
      const response = await this.client.post('/webhooks', webhookPayload);

      console.log(`✅ Webhook configured: ${response.data.id}`);
      
      return {
        success: true,
        webhookId: response.data.id,
        secret: webhookPayload.secret,
        data: response.data
      };
    } catch (error) {
      console.error('❌ Failed to setup webhook:', error.message);
      throw new Error(`SuperOps webhook setup failed: ${error.message}`);
    }
  }

  /**
   * Get organization information
   */
  async getOrganizationInfo() {
    try {
      console.log('🏢 Fetching organization information...');
      const response = await this.client.get('/organization');

      return {
        success: true,
        organization: response.data
      };
    } catch (error) {
      console.error('❌ Failed to fetch organization info:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Normalize SuperOps alerts to our standard format
   */
  normalizeAlerts(superOpsAlerts) {
    return superOpsAlerts.map(alert => ({
      id: alert.id || alert.alert_id || uuidv4(),
      timestamp: alert.created_at || alert.timestamp || new Date().toISOString(),
      type: this.normalizeAlertType(alert.type || alert.alert_type || 'UNKNOWN'),
      severity: this.normalizeSeverity(alert.severity || alert.priority || 'MEDIUM'),
      client: alert.client?.name || alert.client_name || alert.organization || 'Unknown Client',
      server: alert.resource?.name || alert.server_name || alert.hostname || 'Unknown Server',
      message: alert.message || alert.description || alert.summary || 'No message provided',
      source: alert.source || 'SuperOps',
      acknowledged: alert.acknowledged || alert.status === 'acknowledged',
      resolved: alert.resolved || alert.status === 'resolved' || alert.status === 'closed',
      metadata: {
        threshold: alert.threshold,
        currentValue: alert.current_value || alert.value,
        duration: alert.duration,
        tags: alert.tags || [],
        originalData: alert // Keep original for reference
      }
    }));
  }

  /**
   * Normalize alert types to our standard format
   */
  normalizeAlertType(superOpsType) {
    const typeMapping = {
      'cpu': 'CPU_HIGH',
      'memory': 'MEMORY_HIGH',
      'disk': 'DISK_FULL',
      'service': 'SERVICE_DOWN',
      'network': 'NETWORK_TIMEOUT',
      'ssl': 'SSL_EXPIRY',
      'backup': 'BACKUP_FAILED',
      'login': 'LOGIN_FAILED',
      'system': 'SYSTEM_INFO'
    };

    const normalizedType = Object.keys(typeMapping).find(key => 
      superOpsType.toLowerCase().includes(key)
    );

    return normalizedType ? typeMapping[normalizedType] : superOpsType.toUpperCase();
  }

  /**
   * Normalize severity levels
   */
  normalizeSeverity(superOpsSeverity) {
    const severityMapping = {
      'critical': 'CRITICAL',
      'high': 'HIGH',
      'medium': 'MEDIUM',
      'low': 'LOW',
      'info': 'LOW',
      'warning': 'MEDIUM',
      'error': 'HIGH',
      'fatal': 'CRITICAL'
    };

    return severityMapping[superOpsSeverity.toLowerCase()] || 'MEDIUM';
  }

  /**
   * Map our severity to SuperOps priority
   */
  mapSeverityToPriority(severity) {
    const priorityMapping = {
      'CRITICAL': 'urgent',
      'HIGH': 'high',
      'MEDIUM': 'medium',
      'LOW': 'low'
    };

    return priorityMapping[severity] || 'medium';
  }

  /**
   * Format ticket description from alert data
   */
  formatTicketDescription(alertData) {
    return `
**Alert processed by Sentry Deduplication Engine**

**Original Alert Storm:** ${alertData.originalCount} alerts
**Processed Result:** ${alertData.processedAlerts?.length || 1} critical alerts
**Noise Reduction:** ${alertData.reductionPercentage}%

**Alert Details:**
- **Type:** ${alertData.type}
- **Severity:** ${alertData.severity}
- **Server:** ${alertData.server}
- **Client:** ${alertData.client}
- **Message:** ${alertData.message}

**Processing Summary:**
- Duplicates eliminated: ${alertData.duplicatesRemoved || 0}
- Noise suppressed: ${alertData.noiseSuppressed || 0}
- Processing time: ${alertData.processingTime || '<1'}ms

**Processed at:** ${new Date().toISOString()}
**Engine:** Sentry v1.0.0 (SuperHack 2025)
    `.trim();
  }

  /**
   * Generate secure webhook secret
   */
  generateWebhookSecret() {
    return `sentry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Verify webhook signature (for security)
   */
  verifyWebhookSignature(payload, signature, secret) {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return `sha256=${expectedSignature}` === signature;
  }

  /**
   * Retry mechanism for failed requests
   */
  async retryRequest(requestFn, attempts = this.config.retryAttempts) {
    for (let i = 0; i < attempts; i++) {
      try {
        return await requestFn();
      } catch (error) {
        if (i === attempts - 1) throw error;
        
        console.log(`⏳ Retry attempt ${i + 1}/${attempts} after ${this.config.retryDelay}ms`);
        await this.sleep(this.config.retryDelay * (i + 1)); // Exponential backoff
      }
    }
  }

  /**
   * Utility sleep function
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get API usage statistics
   */
  async getApiUsage() {
    try {
      const response = await this.client.get('/usage');
      return {
        success: true,
        usage: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = SuperOpsProductionClient;