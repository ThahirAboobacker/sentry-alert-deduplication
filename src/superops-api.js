/**
 * SuperOps API Integration & Simulation
 * Based on typical MSP platform alert structures
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

class SuperOpsAPI {
  constructor(config = {}) {
    this.baseURL = config.baseURL || 'https://api.superops.com/v1';
    this.apiKey = config.apiKey || 'demo-key';
    this.simulationMode = config.simulationMode || true;
  }

  /**
   * Get alerts from SuperOps API
   * In simulation mode, generates realistic alert data
   */
  async getAlerts(filters = {}) {
    if (this.simulationMode) {
      return this.generateSimulatedAlerts(filters.count || 100);
    }
    
    // Real API call (when not in simulation)
    try {
      const response = await axios.get(`${this.baseURL}/alerts`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        params: filters
      });
      return response.data;
    } catch (error) {
      console.error('SuperOps API Error:', error.message);
      throw error;
    }
  }

  /**
   * Generate realistic alert data for demo
   * Includes many duplicates and similar alerts
   */
  generateSimulatedAlerts(count = 100) {
    const alertTypes = [
      'CPU_HIGH', 'MEMORY_HIGH', 'DISK_FULL', 'SERVICE_DOWN', 
      'NETWORK_TIMEOUT', 'SSL_EXPIRY', 'BACKUP_FAILED', 'LOGIN_FAILED'
    ];
    
    const severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    const clients = ['Client_A', 'Client_B', 'Client_C', 'Client_D', 'Client_E'];
    const servers = ['srv-web-01', 'srv-db-01', 'srv-app-01', 'srv-backup-01'];
    
    const alerts = [];
    const now = moment();
    
    for (let i = 0; i < count; i++) {
      const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
      const client = clients[Math.floor(Math.random() * clients.length)];
      const server = servers[Math.floor(Math.random() * servers.length)];
      
      // Create clusters of similar alerts (simulating real-world duplicates)
      const baseTime = now.clone().subtract(Math.floor(Math.random() * 24), 'hours');
      
      alerts.push({
        id: uuidv4(),
        timestamp: baseTime.toISOString(),
        type: alertType,
        severity: severities[Math.floor(Math.random() * severities.length)],
        client: client,
        server: server,
        message: this.generateAlertMessage(alertType, server, client),
        source: 'monitoring_system',
        acknowledged: Math.random() < 0.1, // 10% acknowledged
        resolved: Math.random() < 0.05,    // 5% resolved
        metadata: {
          threshold: this.getThresholdForType(alertType),
          currentValue: this.getCurrentValueForType(alertType),
          duration: Math.floor(Math.random() * 3600), // seconds
          tags: [`env:${client.toLowerCase()}`, `server:${server}`]
        }
      });
    }
    
    // Add intentional duplicates for demo
    this.addIntentionalDuplicates(alerts);
    
    return {
      alerts: alerts,
      total: alerts.length,
      timestamp: now.toISOString()
    };
  }

  generateAlertMessage(type, server, client) {
    const messages = {
      'CPU_HIGH': `High CPU usage detected on ${server} (${client})`,
      'MEMORY_HIGH': `Memory usage critical on ${server} (${client})`,
      'DISK_FULL': `Disk space low on ${server} (${client})`,
      'SERVICE_DOWN': `Service unavailable on ${server} (${client})`,
      'NETWORK_TIMEOUT': `Network timeout detected for ${server} (${client})`,
      'SSL_EXPIRY': `SSL certificate expiring soon on ${server} (${client})`,
      'BACKUP_FAILED': `Backup job failed on ${server} (${client})`,
      'LOGIN_FAILED': `Multiple failed login attempts on ${server} (${client})`
    };
    
    return messages[type] || `Alert on ${server} (${client})`;
  }

  getThresholdForType(type) {
    const thresholds = {
      'CPU_HIGH': '85%',
      'MEMORY_HIGH': '90%',
      'DISK_FULL': '95%',
      'SERVICE_DOWN': 'N/A',
      'NETWORK_TIMEOUT': '5000ms',
      'SSL_EXPIRY': '30 days',
      'BACKUP_FAILED': 'N/A',
      'LOGIN_FAILED': '5 attempts'
    };
    return thresholds[type] || 'N/A';
  }

  getCurrentValueForType(type) {
    const values = {
      'CPU_HIGH': `${85 + Math.floor(Math.random() * 15)}%`,
      'MEMORY_HIGH': `${90 + Math.floor(Math.random() * 10)}%`,
      'DISK_FULL': `${95 + Math.floor(Math.random() * 5)}%`,
      'SERVICE_DOWN': 'DOWN',
      'NETWORK_TIMEOUT': `${5000 + Math.floor(Math.random() * 5000)}ms`,
      'SSL_EXPIRY': `${Math.floor(Math.random() * 30)} days`,
      'BACKUP_FAILED': 'FAILED',
      'LOGIN_FAILED': `${5 + Math.floor(Math.random() * 10)} attempts`
    };
    return values[type] || 'Unknown';
  }

  /**
   * Add intentional duplicates and noise to simulate real-world alert storms
   */
  addIntentionalDuplicates(alerts) {
    const duplicateCount = Math.floor(alerts.length * 0.6); // 60% duplicates for better demo
    
    for (let i = 0; i < duplicateCount; i++) {
      const originalAlert = alerts[Math.floor(Math.random() * alerts.length)];
      const duplicate = { ...originalAlert };
      
      // Slight variations to make deduplication challenging
      duplicate.id = uuidv4();
      duplicate.timestamp = moment(originalAlert.timestamp)
        .add(Math.floor(Math.random() * 300), 'seconds')
        .toISOString();
      
      // Sometimes vary the message slightly
      if (Math.random() < 0.3) {
        duplicate.message += ' - Additional occurrence';
      }
      
      // Make some duplicates lower severity (noise)
      if (Math.random() < 0.4) {
        duplicate.severity = 'LOW';
      }
      
      // Some are already acknowledged (noise)
      if (Math.random() < 0.2) {
        duplicate.acknowledged = true;
      }
      
      // Some are auto-resolved (noise)
      if (Math.random() < 0.15) {
        duplicate.resolved = true;
      }
      
      alerts.push(duplicate);
    }
    
    // Add some pure noise alerts
    this.addNoiseAlerts(alerts);
  }

  /**
   * Add pure noise alerts that should be suppressed
   */
  addNoiseAlerts(alerts) {
    const noiseCount = Math.floor(alerts.length * 0.3); // 30% pure noise
    const now = moment();
    
    for (let i = 0; i < noiseCount; i++) {
      const noiseTypes = [
        {
          type: 'BACKUP_COMPLETED',
          severity: 'LOW',
          message: 'Informational: Backup completed successfully on srv-backup-01',
          acknowledged: false,
          resolved: false
        },
        {
          type: 'CPU_HIGH',
          severity: 'LOW',
          message: 'High CPU usage detected on srv-app-01 (Client_Test)',
          acknowledged: true, // Already acknowledged
          resolved: false
        },
        {
          type: 'SSL_EXPIRY',
          severity: 'LOW',
          message: 'SSL certificate expiring soon on srv-web-01 (Client_Test)',
          acknowledged: false,
          resolved: false
        },
        {
          type: 'LOGIN_FAILED',
          severity: 'LOW',
          message: 'Multiple failed login attempts on srv-db-01 (Client_Test)',
          acknowledged: false,
          resolved: true // Auto-resolved
        }
      ];
      
      const noiseTemplate = noiseTypes[Math.floor(Math.random() * noiseTypes.length)];
      
      alerts.push({
        id: uuidv4(),
        timestamp: now.clone().subtract(Math.floor(Math.random() * 12), 'hours').toISOString(),
        client: 'Client_Noise',
        server: `srv-noise-${Math.floor(Math.random() * 3) + 1}`,
        source: 'monitoring_system',
        metadata: {
          threshold: 'N/A',
          currentValue: '50%',
          duration: Math.floor(Math.random() * 1800),
          tags: ['env:test', 'noise:true']
        },
        ...noiseTemplate
      });
    }
  }
}

module.exports = SuperOpsAPI;