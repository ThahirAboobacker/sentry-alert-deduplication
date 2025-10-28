/**
 * Debug suppression accuracy issue
 */

const DeduplicationEngine = require('./deduplication-engine');

async function debugSuppression() {
  const engine = new DeduplicationEngine();
  
  const testAlerts = [
    // Should be suppressed
    {
      id: 'suppress-1',
      timestamp: new Date().toISOString(),
      type: 'CPU_HIGH',
      severity: 'LOW',
      message: 'High CPU usage detected on srv-test-01',
      metadata: { currentValue: '70%' }, // Below threshold
      acknowledged: false,
      resolved: false
    },
    {
      id: 'suppress-2',
      timestamp: new Date().toISOString(),
      type: 'BACKUP_FAILED',
      severity: 'LOW',
      message: 'Backup job failed on srv-backup-01',
      acknowledged: false,
      resolved: false
    },
    {
      id: 'suppress-3',
      timestamp: new Date().toISOString(),
      type: 'SYSTEM_INFO',
      severity: 'LOW',
      message: 'Informational: System health check completed',
      acknowledged: false,
      resolved: false
    },
    {
      id: 'suppress-4',
      timestamp: new Date().toISOString(),
      type: 'CPU_HIGH',
      severity: 'MEDIUM',
      message: 'High CPU usage detected on srv-test-02',
      acknowledged: true, // Already acknowledged
      resolved: false
    },
    // Should NOT be suppressed
    {
      id: 'keep-1',
      timestamp: new Date().toISOString(),
      type: 'SERVICE_DOWN',
      severity: 'CRITICAL',
      message: 'CRITICAL: Service outage detected',
      acknowledged: false,
      resolved: false
    },
    {
      id: 'keep-2',
      timestamp: new Date().toISOString(),
      type: 'MEMORY_HIGH',
      severity: 'HIGH',
      message: 'Memory usage critical on srv-prod-01',
      metadata: { currentValue: '97%' },
      acknowledged: false,
      resolved: false
    }
  ];

  console.log('\n🔍 DEBUGGING SUPPRESSION RULES');
  console.log('Expected to suppress: suppress-1, suppress-2, suppress-3, suppress-4');
  console.log('Expected to keep: keep-1, keep-2');
  
  engine.resetMetrics();
  const result = await engine.processAlerts(testAlerts);
  
  console.log('\n📊 Results:');
  console.log(`Suppressed: ${result.metrics.suppressed} (expected 4)`);
  console.log(`Escalated: ${result.processedAlerts.length} (expected 2)`);
  
  console.log('\n📋 Escalated alerts:');
  result.processedAlerts.forEach(alert => {
    console.log(`• ${alert.id}: ${alert.message}`);
  });
  
  // Test each suppression rule individually
  console.log('\n🔧 Testing individual rules:');
  const rules = engine.config.noiseSuppressionRules;
  
  testAlerts.forEach(alert => {
    console.log(`\nAlert ${alert.id} (${alert.type}, ${alert.severity}):`);
    let suppressed = false;
    
    for (const rule of rules) {
      if (rule.condition(alert)) {
        console.log(`  ✅ Matches rule: ${rule.name}`);
        suppressed = true;
        break;
      }
    }
    
    if (!suppressed) {
      console.log(`  ❌ No matching suppression rule`);
    }
    
    // Check critical protection
    if (engine.isCriticalAlert(alert)) {
      console.log(`  🛡️ Protected as critical alert`);
    }
  });
}

debugSuppression().catch(console.error);