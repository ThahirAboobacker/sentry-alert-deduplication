/**
 * Bulletproof Demo Data - Lambda Version
 * Provides consistent demo data for AWS Lambda
 */

class BulletproofDemo {
  createBulletproofAlertSet() {
    const baseTime = new Date();
    
    // EXACTLY 25 alerts designed to produce consistent results
    const alerts = [
      // GROUP 1: Database outage (1 critical alert after deduplication)
      {
        id: 'db-primary',
        timestamp: baseTime.toISOString(),
        type: 'SERVICE_DOWN',
        severity: 'CRITICAL',
        client: 'Enterprise_Corp',
        server: 'srv-db-primary',
        message: 'CRITICAL: Database service down on srv-db-primary (Enterprise_Corp)',
        source: 'monitoring_system',
        acknowledged: false,
        resolved: false,
        metadata: { threshold: 'N/A', currentValue: 'DOWN', duration: 0 }
      },
      // 6 duplicates of database outage
      ...Array.from({length: 6}, (_, i) => ({
        id: `db-dup-${i}`,
        timestamp: new Date(baseTime.getTime() + ((i + 1) * 30000)).toISOString(),
        type: 'SERVICE_DOWN',
        severity: 'CRITICAL',
        client: 'Enterprise_Corp',
        server: 'srv-db-primary',
        message: 'CRITICAL: Database service down on srv-db-primary (Enterprise_Corp)',
        source: 'monitoring_system',
        acknowledged: false,
        resolved: false,
        metadata: { threshold: 'N/A', currentValue: 'DOWN', duration: (i + 1) * 30 }
      })),

      // GROUP 2: Web service cascade failure
      {
        id: 'web-primary',
        timestamp: new Date(baseTime.getTime() + 120000).toISOString(),
        type: 'SERVICE_DOWN',
        severity: 'CRITICAL',
        client: 'Enterprise_Corp',
        server: 'srv-web-01',
        message: 'CRITICAL: Web service outage on srv-web-01 (Enterprise_Corp)',
        source: 'monitoring_system',
        acknowledged: false,
        resolved: false,
        metadata: { threshold: 'N/A', currentValue: 'DOWN', duration: 120 }
      },
      // 6 duplicates of web service outage
      ...Array.from({length: 6}, (_, i) => ({
        id: `web-dup-${i}`,
        timestamp: new Date(baseTime.getTime() + 120000 + ((i + 1) * 45000)).toISOString(),
        type: 'SERVICE_DOWN',
        severity: 'CRITICAL',
        client: 'Enterprise_Corp',
        server: 'srv-web-01',
        message: 'CRITICAL: Web service outage on srv-web-01 (Enterprise_Corp)',
        source: 'monitoring_system',
        acknowledged: false,
        resolved: false,
        metadata: { threshold: 'N/A', currentValue: 'DOWN', duration: 120 + ((i + 1) * 45) }
      })),

      // GROUP 3: Memory exhaustion
      {
        id: 'memory-critical',
        timestamp: new Date(baseTime.getTime() + 180000).toISOString(),
        type: 'MEMORY_HIGH',
        severity: 'CRITICAL',
        client: 'Enterprise_Corp',
        server: 'srv-app-01',
        message: 'CRITICAL: Memory exhaustion on srv-app-01 (Enterprise_Corp)',
        source: 'monitoring_system',
        acknowledged: false,
        resolved: false,
        metadata: { threshold: '95%', currentValue: '98%', duration: 180 }
      },
      // 4 duplicates of memory alert
      ...Array.from({length: 4}, (_, i) => ({
        id: `mem-dup-${i}`,
        timestamp: new Date(baseTime.getTime() + 180000 + ((i + 1) * 20000)).toISOString(),
        type: 'MEMORY_HIGH',
        severity: 'CRITICAL',
        client: 'Enterprise_Corp',
        server: 'srv-app-01',
        message: 'CRITICAL: Memory exhaustion on srv-app-01 (Enterprise_Corp)',
        source: 'monitoring_system',
        acknowledged: false,
        resolved: false,
        metadata: { threshold: '95%', currentValue: '98%', duration: 180 + ((i + 1) * 20) }
      })),

      // NOISE ALERTS (will be suppressed)
      {
        id: 'noise-cpu-low',
        timestamp: new Date(baseTime.getTime() - 3600000).toISOString(),
        type: 'CPU_HIGH',
        severity: 'LOW',
        client: 'Enterprise_Corp',
        server: 'srv-worker-01',
        message: 'High CPU usage detected on srv-worker-01 (Enterprise_Corp)',
        source: 'monitoring_system',
        acknowledged: false,
        resolved: false,
        metadata: { threshold: '85%', currentValue: '72%', duration: 3600 }
      },
      {
        id: 'noise-ssl-expiry',
        timestamp: new Date(baseTime.getTime() - 7200000).toISOString(),
        type: 'SSL_EXPIRY',
        severity: 'LOW',
        client: 'Enterprise_Corp',
        server: 'srv-web-02',
        message: 'SSL certificate expiring soon on srv-web-02 (Enterprise_Corp)',
        source: 'ssl_monitor',
        acknowledged: false,
        resolved: false,
        metadata: { threshold: '30 days', currentValue: '20days', duration: 0 }
      },
      {
        id: 'noise-info',
        timestamp: new Date(baseTime.getTime() - 1800000).toISOString(),
        type: 'SYSTEM_INFO',
        severity: 'LOW',
        client: 'Enterprise_Corp',
        server: 'srv-monitor-01',
        message: 'Informational: System health check completed on srv-monitor-01',
        source: 'health_check',
        acknowledged: false,
        resolved: false,
        metadata: { threshold: 'N/A', currentValue: 'OK', duration: 0 }
      }
    ];

    return alerts;
  }
}

module.exports = BulletproofDemo;