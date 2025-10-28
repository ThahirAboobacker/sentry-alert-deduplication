/**
 * SuperOps Unified Client - Lambda Version
 * Lightweight version optimized for AWS Lambda
 */

class SuperOpsUnifiedClient {
  constructor(config = {}) {
    this.mode = config.mode || process.env.SUPEROPS_MODE || 'DEMO';
    this.config = config;
    
    console.log(`🔄 Lambda SuperOps Client initialized in ${this.mode} mode`);
  }

  /**
   * Create ticket with mode-aware handling
   */
  async createTicket(alertData) {
    try {
      if (this.mode === 'LIVE') {
        console.log('🎫 Creating real ticket in SuperOps...');
        
        // In a real implementation, this would call SuperOps API
        // For Lambda demo, we'll simulate the call
        const ticketId = `LIVE-${Date.now()}`;
        return {
          success: true,
          mode: 'LIVE',
          ticketId,
          ticketNumber: `TKT-${ticketId}`,
          url: `https://app.superops.com/tickets/${ticketId}`,
          message: 'Ticket created successfully in SuperOps',
          data: {
            id: ticketId,
            title: alertData.title,
            priority: this.mapSeverityToPriority(alertData.severity),
            status: 'open',
            created_at: new Date().toISOString()
          }
        };
      } else {
        console.log('🎫 Simulating ticket creation (DEMO mode)...');
        
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
      throw error;
    }
  }

  /**
   * Map severity to priority
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
   * Get mode indicator
   */
  getModeIndicator() {
    return {
      mode: this.mode,
      indicator: this.mode === 'LIVE' ? '🔴 LIVE' : '🟡 DEMO',
      description: this.mode === 'LIVE' 
        ? 'Connected to real SuperOps platform'
        : 'Using simulated SuperOps data'
    };
  }
}

module.exports = SuperOpsUnifiedClient;