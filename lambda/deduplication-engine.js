/**
 * Sentry Alert Deduplication Engine - Lambda Version
 * Optimized for AWS Lambda serverless environment
 */

const crypto = require('crypto');

class DeduplicationEngine {
  constructor(config = {}) {
    this.config = {
      deduplicationWindow: config.deduplicationWindow || 300, // 5 minutes in seconds
      noiseSuppressionRules: config.noiseSuppressionRules || this.getDefaultSuppressionRules(),
      criticalKeywords: config.criticalKeywords || ['critical', 'outage', 'down', 'failed'],
      ...config
    };
    
    this.metrics = {
      received: 0,
      duplicates: 0,
      suppressed: 0,
      escalated: 0,
      processed: 0
    };
    
    // Use in-memory storage for Lambda (stateless)
    this.alertHistory = new Map();
    this.processedAlerts = [];
  }

  /**
   * Main processing pipeline - optimized for Lambda
   */
  async processAlerts(alerts) {
    console.log(`🔄 Processing ${alerts.length} alerts through Sentry Lambda engine...`);
    
    this.metrics.received += alerts.length;
    
    // Step 1: Deduplicate alerts
    const deduplicated = this.deduplicateAlerts(alerts);
    console.log(`📋 After deduplication: ${deduplicated.length} alerts (${alerts.length - deduplicated.length} duplicates removed)`);
    
    // Step 2: Apply noise suppression
    const filtered = this.applyNoiseSuppressionRules(deduplicated);
    console.log(`🔇 After noise suppression: ${filtered.length} alerts (${deduplicated.length - filtered.length} suppressed)`);
    
    // Step 3: Prioritize remaining alerts
    const prioritized = this.prioritizeAlerts(filtered);
    console.log(`⚡ Final escalated alerts: ${prioritized.length}`);
    
    this.metrics.escalated += prioritized.length;
    this.metrics.processed += alerts.length;
    
    this.processedAlerts.push(...prioritized);
    
    return {
      originalCount: alerts.length,
      processedAlerts: prioritized,
      metrics: this.getMetrics(),
      reductionPercentage: this.calculateReductionPercentage(alerts.length, prioritized.length)
    };
  }

  /**
   * Generate fingerprint for alert deduplication
   */
  generateAlertFingerprint(alert) {
    // Input validation and sanitization
    const type = alert.type || 'UNKNOWN';
    const server = alert.server || 'unknown-server';
    const client = alert.client || 'unknown-client';
    const message = (alert.message || '').substring(0, 50);
    
    const key = `${type}_${server}_${client}_${message}`;
    return crypto.createHash('md5').update(key).digest('hex');
  }

  /**
   * Deduplicate alerts within time window
   */
  deduplicateAlerts(alerts) {
    const deduplicated = [];
    const now = new Date();
    
    for (const alert of alerts) {
      // Input validation
      if (!alert || typeof alert !== 'object') {
        console.log('⚠️ Skipping malformed alert in deduplication:', alert);
        continue;
      }
      
      const fingerprint = this.generateAlertFingerprint(alert);
      let alertTime;
      
      try {
        alertTime = new Date(alert.timestamp);
        // Validate timestamp
        if (isNaN(alertTime.getTime())) {
          console.log('⚠️ Invalid timestamp, using current time:', alert.timestamp);
          alertTime = new Date();
        }
      } catch (error) {
        console.log('⚠️ Timestamp parsing error, using current time:', error.message);
        alertTime = new Date();
      }
      
      // Check if we've seen this alert recently
      if (this.alertHistory.has(fingerprint)) {
        const lastSeen = this.alertHistory.get(fingerprint);
        const timeDiff = Math.abs(alertTime.getTime() - lastSeen.getTime()) / 1000;
        
        if (timeDiff < this.config.deduplicationWindow) {
          // This is a duplicate within the time window
          this.metrics.duplicates++;
          console.log(`🔄 Duplicate detected: ${alert.message || 'Unknown alert'} (${Math.round(timeDiff)}s ago)`);
          continue;
        }
      }
      
      // Not a duplicate, add to results
      this.alertHistory.set(fingerprint, alertTime);
      deduplicated.push({
        ...alert,
        fingerprint,
        processedAt: now.toISOString()
      });
    }
    
    return deduplicated;
  }

  /**
   * Apply noise suppression rules
   */
  applyNoiseSuppressionRules(alerts) {
    const filtered = [];
    
    for (const alert of alerts) {
      // Input validation
      if (!alert || typeof alert !== 'object') {
        console.log('⚠️ Skipping malformed alert:', alert);
        continue;
      }
      
      let shouldSuppress = false;
      let suppressionReason = '';
      
      // Check each suppression rule
      for (const rule of this.config.noiseSuppressionRules) {
        try {
          if (rule.condition(alert)) {
            shouldSuppress = true;
            suppressionReason = rule.reason;
            break;
          }
        } catch (error) {
          console.log(`⚠️ Error in suppression rule ${rule.name}:`, error.message);
        }
      }
      
      // Never suppress critical alerts
      if (this.isCriticalAlert(alert)) {
        shouldSuppress = false;
        suppressionReason = '';
      }
      
      if (shouldSuppress) {
        this.metrics.suppressed++;
        console.log(`🔇 Suppressed: ${alert.message || 'Unknown alert'} (${suppressionReason})`);
      } else {
        filtered.push({
          ...alert,
          suppressionReason: suppressionReason || 'Not suppressed'
        });
      }
    }
    
    return filtered;
  }

  /**
   * Check if alert contains critical keywords
   */
  isCriticalAlert(alert) {
    if (!alert) return false;
    
    const message = alert.message || '';
    const type = alert.type || '';
    const text = `${message} ${type}`.toLowerCase();
    
    return this.config.criticalKeywords.some(keyword => 
      text.includes(keyword.toLowerCase())
    );
  }

  /**
   * Prioritize alerts by severity and type
   */
  prioritizeAlerts(alerts) {
    const severityOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
    
    return alerts.sort((a, b) => {
      // First by severity
      const severityDiff = (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
      if (severityDiff !== 0) return severityDiff;
      
      // Then by timestamp (newest first)
      const aTime = new Date(a.timestamp).getTime();
      const bTime = new Date(b.timestamp).getTime();
      return bTime - aTime;
    });
  }

  /**
   * Default noise suppression rules - Lambda optimized
   */
  getDefaultSuppressionRules() {
    return [
      {
        name: 'Low CPU Alerts',
        condition: (alert) => {
          if (alert.type === 'CPU_HIGH' && (alert.severity === 'LOW' || alert.severity === 'MEDIUM')) {
            const value = parseInt(alert.metadata?.currentValue);
            return value < 95;
          }
          return false;
        },
        reason: 'CPU usage below critical threshold'
      },
      {
        name: 'Low Memory Alerts',
        condition: (alert) => {
          if (alert.type === 'MEMORY_HIGH' && alert.severity === 'LOW') {
            const value = parseInt(alert.metadata?.currentValue);
            return value < 95;
          }
          return false;
        },
        reason: 'Memory usage not critical'
      },
      {
        name: 'Informational Alerts',
        condition: (alert) => {
          const msg = (alert.message || '').toLowerCase();
          const type = (alert.type || '').toLowerCase();
          return msg.includes('informational') || 
                 msg.includes('info:') || 
                 msg.includes('notice:') ||
                 msg.includes('completed successfully') ||
                 type.includes('system_info') ||
                 type.includes('health_check');
        },
        reason: 'Informational alert'
      },
      {
        name: 'Auto-resolved Alerts',
        condition: (alert) => alert.resolved === true,
        reason: 'Alert already resolved'
      },
      {
        name: 'Low Severity Disk Alerts',
        condition: (alert) => {
          return alert.type === 'DISK_FULL' && 
                 alert.severity === 'LOW' && 
                 parseInt(alert.metadata?.currentValue) < 98;
        },
        reason: 'Disk usage not critical'
      },
      {
        name: 'Acknowledged Alerts',
        condition: (alert) => alert.acknowledged === true,
        reason: 'Alert already acknowledged'
      },
      {
        name: 'SSL Expiry Low Priority',
        condition: (alert) => {
          if (alert.type === 'SSL_EXPIRY' && alert.severity === 'LOW') {
            const days = parseInt(alert.metadata?.currentValue);
            return days > 7;
          }
          return false;
        },
        reason: 'SSL certificate has sufficient time before expiry'
      },
      {
        name: 'Backup Alerts Low Priority',
        condition: (alert) => {
          return (alert.type === 'BACKUP_FAILED' || alert.type === 'BACKUP_COMPLETED') && 
                 (alert.severity === 'LOW' || alert.severity === 'MEDIUM');
        },
        reason: 'Low priority backup issue'
      },
      {
        name: 'Login Failed Low Count',
        condition: (alert) => {
          if (alert.type === 'LOGIN_FAILED' && alert.severity === 'LOW') {
            const attempts = parseInt(alert.metadata?.currentValue);
            return attempts < 10;
          }
          return false;
        },
        reason: 'Login attempts below security threshold'
      },
      {
        name: 'Medium Severity Non-Critical',
        condition: (alert) => {
          return alert.severity === 'MEDIUM' && 
                 !alert.type.includes('SERVICE_DOWN') &&
                 !alert.message.toLowerCase().includes('critical') &&
                 !alert.message.toLowerCase().includes('outage');
        },
        reason: 'Medium priority non-service-affecting alert'
      },
      {
        name: 'High Volume Alert Types',
        condition: (alert) => {
          return (alert.type === 'NETWORK_TIMEOUT' && alert.severity !== 'CRITICAL') ||
                 (alert.type === 'BACKUP_FAILED' && alert.severity === 'LOW');
        },
        reason: 'Secondary effect of primary incident'
      }
    ];
  }

  /**
   * Calculate noise reduction percentage
   */
  calculateReductionPercentage(original, final) {
    if (original === 0) return 0;
    return Math.round(((original - final) / original) * 100);
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      reductionPercentage: this.calculateReductionPercentage(this.metrics.received, this.metrics.escalated),
      duplicateRate: this.metrics.received > 0 ? Math.round((this.metrics.duplicates / this.metrics.received) * 100) : 0,
      suppressionRate: this.metrics.received > 0 ? Math.round((this.metrics.suppressed / this.metrics.received) * 100) : 0
    };
  }

  /**
   * Reset metrics for new processing run
   */
  resetMetrics() {
    this.metrics = {
      received: 0,
      duplicates: 0,
      suppressed: 0,
      escalated: 0,
      processed: 0
    };
    this.alertHistory.clear();
    this.processedAlerts = [];
  }
}

module.exports = DeduplicationEngine;