/**
 * SuperOps Unified API Client
 * Switches between LIVE (production) and DEMO (mock) modes
 * Perfect for SuperHack 2025 presentation flexibility
 */

const SuperOpsProductionClient = require('./superops-production-client');
const SuperOpsAPI = require('./superops-api'); // Our existing mock client

class SuperOpsUnifiedClient {
  constructor(config = {}) {
    this.mode = config.mode || process.env.SUPEROPS_MODE || 'DEMO'; // LIVE or DEMO
    this.config = config;
    
    // Initialize appropriate client based on mode
    if (this.mode === 'LIVE') {
      this.client = new SuperOpsProductionClient(config);
      console.log('🔴 LIVE MODE: Using real SuperOps API');
    } else {
      this.client = new SuperOpsAPI({ simulationMode: true, ...config });
      console.log('🟡 DEMO MODE: Using simulated SuperOps data');
    }
    
    this.connectionStatus = 'unknown';
    this.lastConnectionTest = null;
  }

  /**
   * Switch between LIVE and DEMO modes
   */
  async switchMode(newMode) {
    if (newMode === this.mode) {
      console.log(`Already in ${newMode} mode`);
      return;
    }

    console.log(`🔄 Switching from ${this.mode} to ${newMode} mode...`);
    
    this.mode = newMode;
    
    if (newMode === 'LIVE') {
      this.client = new SuperOpsProductionClient(this.config);
      console.log('🔴 LIVE MODE: Switched to real SuperOps API');
      
      // Test connection immediately
      const connectionTest = await this.testConnection();
      if (!connectionTest.success) {
        console.log('⚠️ LIVE mode connection failed, falling back to DEMO mode');
        return this.switchMode('DEMO');
      }
    } else {
      this.client = new SuperOpsAPI({ simulationMode: true, ...this.config });
      console.log('🟡 DEMO MODE: Switched to simulated SuperOps data');
    }
  }

  /**
   * Test API connection with fallback logic
   */
  async testConnection() {
    try {
      console.log(`🔍 Testing ${this.mode} mode connection...`);
      
      if (this.mode === 'LIVE') {
        const result = await this.client.testConnection();
        this.connectionStatus = result.success ? 'connected' : 'failed';
        this.lastConnectionTest = new Date().toISOString();
        
        if (!result.success) {
          console.log('❌ LIVE mode connection failed, consider switching to DEMO mode');
        }
        
        return result;
      } else {
        // Demo mode always "succeeds"
        this.connectionStatus = 'demo';
        this.lastConnectionTest = new Date().toISOString();
        
        return {
          success: true,
          mode: 'DEMO',
          message: 'Demo mode - using simulated data'
        };
      }
    } catch (error) {
      console.error('🚨 Connection test failed:', error.message);
      this.connectionStatus = 'error';
      
      return {
        success: false,
        error: error.message,
        mode: this.mode
      };
    }
  }

  /**
   * Get alerts with mode-aware processing
   */
  async getAlerts(filters = {}) {
    try {
      console.log(`📥 Fetching alerts in ${this.mode} mode...`);
      
      const startTime = Date.now();
      const result = await this.client.getAlerts(filters);
      const processingTime = Date.now() - startTime;
      
      // Add mode metadata to results
      return {
        ...result,
        mode: this.mode,
        processingTime,
        connectionStatus: this.connectionStatus,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ Failed to fetch alerts in ${this.mode} mode:`, error.message);
      
      // Auto-fallback to DEMO mode if LIVE fails
      if (this.mode === 'LIVE') {
        console.log('🔄 Auto-switching to DEMO mode due to error...');
        await this.switchMode('DEMO');
        return this.getAlerts(filters);
      }
      
      throw error;
    }
  }

  /**
   * Create ticket with mode-aware handling
   */
  async createTicket(alertData) {
    try {
      if (this.mode === 'LIVE') {
        console.log('🎫 Creating real ticket in SuperOps...');
        return await this.client.createTicket(alertData);
      } else {
        console.log('🎫 Simulating ticket creation (DEMO mode)...');
        
        // Simulate ticket creation for demo
        const ticketId = `DEMO-${Date.now()}`;
        return {
          success: true,
          mode: 'DEMO',
          ticketId,
          ticketNumber: `TKT-${ticketId}`,
          url: `https://demo.superops.com/tickets/${ticketId}`,
          message: 'Ticket created successfully (simulated)',
          data: {
            id: ticketId,
            title: alertData.title,
            priority: this.mapSeverityToPriority(alertData.severity),
            status: 'open',
            created_at: new Date().toISOString()
          }
        };
      }
    } catch (error) {
      console.error('❌ Ticket creation failed:', error.message);
      
      if (this.mode === 'LIVE') {
        console.log('🔄 Falling back to simulated ticket creation...');
        const originalMode = this.mode;
        await this.switchMode('DEMO');
        const result = await this.createTicket(alertData);
        await this.switchMode(originalMode);
        return { ...result, fallback: true };
      }
      
      throw error;
    }
  }

  /**
   * Setup webhook with mode awareness
   */
  async setupWebhook(webhookUrl, events = ['alert.created', 'alert.updated']) {
    try {
      if (this.mode === 'LIVE') {
        console.log('🔗 Setting up real SuperOps webhook...');
        return await this.client.setupWebhook(webhookUrl, events);
      } else {
        console.log('🔗 Simulating webhook setup (DEMO mode)...');
        
        return {
          success: true,
          mode: 'DEMO',
          webhookId: `demo-webhook-${Date.now()}`,
          secret: 'demo-secret-key',
          message: 'Webhook configured successfully (simulated)',
          url: webhookUrl,
          events
        };
      }
    } catch (error) {
      console.error('❌ Webhook setup failed:', error.message);
      throw error;
    }
  }

  /**
   * Get comprehensive status information
   */
  async getStatus() {
    const status = {
      mode: this.mode,
      connectionStatus: this.connectionStatus,
      lastConnectionTest: this.lastConnectionTest,
      timestamp: new Date().toISOString()
    };

    if (this.mode === 'LIVE') {
      try {
        const orgInfo = await this.client.getOrganizationInfo();
        status.organization = orgInfo.success ? orgInfo.organization : null;
        
        const apiUsage = await this.client.getApiUsage();
        status.apiUsage = apiUsage.success ? apiUsage.usage : null;
      } catch (error) {
        status.error = error.message;
      }
    } else {
      status.demoInfo = {
        message: 'Running in demonstration mode with simulated data',
        features: ['Alert simulation', 'Ticket simulation', 'Webhook simulation'],
        dataSource: 'Mock SuperOps API'
      };
    }

    return status;
  }

  /**
   * Auto-detect best mode based on configuration
   */
  async autoDetectMode() {
    console.log('🔍 Auto-detecting best SuperOps mode...');
    
    // Check if we have LIVE mode credentials
    const hasApiKey = !!(this.config.apiKey || process.env.SUPEROPS_API_KEY);
    const hasOrgId = !!(this.config.orgId || process.env.SUPEROPS_ORG_ID);
    
    if (!hasApiKey || !hasOrgId) {
      console.log('🟡 Missing credentials, using DEMO mode');
      await this.switchMode('DEMO');
      return 'DEMO';
    }
    
    // Try LIVE mode
    await this.switchMode('LIVE');
    const connectionTest = await this.testConnection();
    
    if (connectionTest.success) {
      console.log('🔴 LIVE mode connection successful');
      return 'LIVE';
    } else {
      console.log('🟡 LIVE mode failed, falling back to DEMO mode');
      await this.switchMode('DEMO');
      return 'DEMO';
    }
  }

  /**
   * Get mode-specific demo data for presentations
   */
  async getDemoData() {
    if (this.mode === 'LIVE') {
      // Get real data but limit to safe amounts for demo
      return await this.getAlerts({ limit: 25 });
    } else {
      // Use our bulletproof demo data
      const BulletproofDemo = require('./bulletproof-demo');
      const demo = new BulletproofDemo();
      const alerts = demo.createBulletproofAlertSet();
      
      return {
        alerts,
        total: alerts.length,
        mode: 'DEMO',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Utility method to map severity to priority
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
   * Get current mode indicator for UI
   */
  getModeIndicator() {
    return {
      mode: this.mode,
      indicator: this.mode === 'LIVE' ? '🔴 LIVE' : '🟡 DEMO',
      description: this.mode === 'LIVE' 
        ? 'Connected to real SuperOps platform'
        : 'Using simulated SuperOps data',
      connectionStatus: this.connectionStatus
    };
  }

  /**
   * Validate configuration for LIVE mode
   */
  validateLiveConfig() {
    const required = ['apiKey', 'orgId'];
    const missing = required.filter(key => 
      !this.config[key] && !process.env[`SUPEROPS_${key.toUpperCase()}`]
    );
    
    if (missing.length > 0) {
      return {
        valid: false,
        missing,
        message: `Missing required configuration: ${missing.join(', ')}`
      };
    }
    
    return {
      valid: true,
      message: 'Configuration valid for LIVE mode'
    };
  }
}

module.exports = SuperOpsUnifiedClient;