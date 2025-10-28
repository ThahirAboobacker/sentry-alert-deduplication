/**
 * Sentry Accuracy Analysis Tool
 * Identifies specific areas where filtering accuracy is below 95%
 */

const SuperOpsAPI = require('./superops-api');
const DeduplicationEngine = require('./deduplication-engine');
const HackathonDemo = require('./hackathon-demo');

class AccuracyAnalysis {
  constructor() {
    this.superOpsAPI = new SuperOpsAPI({ simulationMode: true });
    this.deduplicationEngine = new DeduplicationEngine();
    this.hackathonDemo = new HackathonDemo();
  }

  async runComprehensiveAnalysis() {
    console.log('\n🔍 SENTRY ACCURACY ANALYSIS');
    console.log('🎯 Identifying components below 95% accuracy');
    console.log('=' .repeat(70));

    const results = {
      deduplicationAccuracy: await this.testDeduplicationAccuracy(),
      suppressionAccuracy: await this.testSuppressionAccuracy(),
      criticalProtectionAccuracy: await this.testCriticalProtectionAccuracy(),
      edgeCaseHandling: await this.testEdgeCaseHandling(),
      overallSystemAccuracy: 0
    };

    // Calculate overall accuracy
    const accuracies = [
      results.deduplicationAccuracy.accuracy,
      results.suppressionAccuracy.accuracy,
      results.criticalProtectionAccuracy.accuracy,
      results.edgeCaseHandling.accuracy
    ];
    results.overallSystemAccuracy = Math.round(accuracies.reduce((a, b) => a + b) / accuracies.length);

    this.generateAccuracyReport(results);
    this.providePrioritizedFixes(results);

    return results;
  }

  async testDeduplicationAccuracy() {
    console.log('\n📋 Testing Deduplication Accuracy...');
    
    // Create test scenario with known duplicates
    const testAlerts = this.createDeduplicationTestSet();
    const expectedDuplicates = this.countExpectedDuplicates(testAlerts);
    
    this.deduplicationEngine.resetMetrics();
    const result = await this.deduplicationEngine.processAlerts(testAlerts);
    
    const actualDuplicates = result.metrics.duplicates;
    const accuracy = Math.round((Math.min(actualDuplicates, expectedDuplicates) / Math.max(actualDuplicates, expectedDuplicates)) * 100);
    
    console.log(`• Expected duplicates: ${expectedDuplicates}`);
    console.log(`• Detected duplicates: ${actualDuplicates}`);
    console.log(`• Deduplication accuracy: ${accuracy}%`);
    
    return {
      accuracy,
      expected: expectedDuplicates,
      actual: actualDuplicates,
      issues: this.identifyDeduplicationIssues(testAlerts, result)
    };
  }

  async testSuppressionAccuracy() {
    console.log('\n🔇 Testing Noise Suppression Accuracy...');
    
    // Create test scenario with known noise
    const testAlerts = this.createSuppressionTestSet();
    const expectedSuppressed = this.countExpectedSuppressed(testAlerts);
    
    this.deduplicationEngine.resetMetrics();
    const result = await this.deduplicationEngine.processAlerts(testAlerts);
    
    const actualSuppressed = result.metrics.suppressed;
    const accuracy = Math.round((Math.min(actualSuppressed, expectedSuppressed) / Math.max(actualSuppressed, expectedSuppressed)) * 100);
    
    console.log(`• Expected suppressed: ${expectedSuppressed}`);
    console.log(`• Actually suppressed: ${actualSuppressed}`);
    console.log(`• Suppression accuracy: ${accuracy}%`);
    
    return {
      accuracy,
      expected: expectedSuppressed,
      actual: actualSuppressed,
      issues: this.identifySuppressionIssues(testAlerts, result)
    };
  }

  async testCriticalProtectionAccuracy() {
    console.log('\n🛡️ Testing Critical Alert Protection...');
    
    // Create test scenario with critical alerts mixed with noise
    const testAlerts = this.createCriticalProtectionTestSet();
    const expectedCritical = this.countExpectedCritical(testAlerts);
    
    this.deduplicationEngine.resetMetrics();
    const result = await this.deduplicationEngine.processAlerts(testAlerts);
    
    const actualCritical = result.processedAlerts.filter(a => 
      this.deduplicationEngine.isCriticalAlert(a) || a.severity === 'CRITICAL'
    ).length;
    
    const accuracy = expectedCritical > 0 ? Math.round((actualCritical / expectedCritical) * 100) : 100;
    
    console.log(`• Expected critical escalated: ${expectedCritical}`);
    console.log(`• Actually critical escalated: ${actualCritical}`);
    console.log(`• Critical protection accuracy: ${accuracy}%`);
    
    return {
      accuracy,
      expected: expectedCritical,
      actual: actualCritical,
      issues: this.identifyCriticalProtectionIssues(testAlerts, result)
    };
  }

  async testEdgeCaseHandling() {
    console.log('\n⚠️ Testing Edge Case Handling...');
    
    const edgeCases = [
      this.testEmptyAlerts(),
      this.testMalformedAlerts(),
      this.testTimestampEdgeCases(),
      this.testUnicodeHandling(),
      this.testLargeVolumeHandling()
    ];
    
    let passedTests = 0;
    for (const testCase of edgeCases) {
      try {
        await testCase;
        passedTests++;
      } catch (error) {
        console.log(`❌ Edge case failed: ${error.message}`);
      }
    }
    
    const accuracy = Math.round((passedTests / edgeCases.length) * 100);
    console.log(`• Edge case tests passed: ${passedTests}/${edgeCases.length}`);
    console.log(`• Edge case handling accuracy: ${accuracy}%`);
    
    return {
      accuracy,
      passed: passedTests,
      total: edgeCases.length,
      issues: edgeCases.length - passedTests > 0 ? ['Edge case handling needs improvement'] : []
    };
  }

  createDeduplicationTestSet() {
    const baseAlert = {
      id: 'test-1',
      timestamp: new Date().toISOString(),
      type: 'CPU_HIGH',
      severity: 'HIGH',
      client: 'TestClient',
      server: 'srv-test-01',
      message: 'High CPU usage detected on srv-test-01 (TestClient)',
      source: 'monitoring_system',
      acknowledged: false,
      resolved: false,
      metadata: { threshold: '85%', currentValue: '90%' }
    };

    // Create exact duplicates (should be detected)
    const exactDuplicates = Array.from({length: 5}, (_, i) => ({
      ...baseAlert,
      id: `test-duplicate-${i}`,
      timestamp: new Date(Date.now() + (i * 30000)).toISOString() // 30 seconds apart
    }));

    // Create near-duplicates (should be detected)
    const nearDuplicates = Array.from({length: 3}, (_, i) => ({
      ...baseAlert,
      id: `test-near-${i}`,
      message: baseAlert.message + ' - Additional occurrence',
      timestamp: new Date(Date.now() + (i * 60000)).toISOString() // 1 minute apart
    }));

    // Create different alerts (should NOT be detected as duplicates)
    const differentAlerts = [
      { ...baseAlert, id: 'different-1', server: 'srv-test-02', message: 'High CPU usage detected on srv-test-02 (TestClient)' },
      { ...baseAlert, id: 'different-2', type: 'MEMORY_HIGH', message: 'Memory usage critical on srv-test-01 (TestClient)' }
    ];

    return [...exactDuplicates, ...nearDuplicates, ...differentAlerts];
  }

  countExpectedDuplicates(alerts) {
    // In our test set: 5 exact duplicates + 3 near duplicates = 7 duplicates (keeping 1 of each group)
    return 7; // 4 exact + 2 near + 0 different
  }

  createSuppressionTestSet() {
    const now = new Date();
    return [
      // Should be suppressed
      {
        id: 'suppress-1',
        timestamp: now.toISOString(),
        type: 'CPU_HIGH',
        severity: 'LOW',
        message: 'High CPU usage detected on srv-test-01',
        metadata: { currentValue: '70%' }, // Below threshold
        acknowledged: false,
        resolved: false
      },
      {
        id: 'suppress-2',
        timestamp: now.toISOString(),
        type: 'SSL_EXPIRY',
        severity: 'LOW',
        message: 'SSL certificate expiring in 15 days on srv-web-01',
        metadata: { currentValue: '15days' },
        acknowledged: false,
        resolved: false
      },
      {
        id: 'suppress-3',
        timestamp: now.toISOString(),
        type: 'SYSTEM_INFO',
        severity: 'LOW',
        message: 'Informational: System health check completed',
        acknowledged: false,
        resolved: false
      },
      {
        id: 'suppress-4',
        timestamp: now.toISOString(),
        type: 'CPU_HIGH',
        severity: 'MEDIUM',
        message: 'High CPU usage detected on srv-test-02',
        acknowledged: true, // Already acknowledged
        resolved: false
      },
      // Should NOT be suppressed
      {
        id: 'keep-1',
        timestamp: now.toISOString(),
        type: 'SERVICE_DOWN',
        severity: 'CRITICAL',
        message: 'CRITICAL: Service outage detected',
        acknowledged: false,
        resolved: false
      },
      {
        id: 'keep-2',
        timestamp: now.toISOString(),
        type: 'MEMORY_HIGH',
        severity: 'HIGH',
        message: 'Memory usage critical on srv-prod-01',
        metadata: { currentValue: '97%' },
        acknowledged: false,
        resolved: false
      }
    ];
  }

  countExpectedSuppressed(alerts) {
    return 4; // suppress-1, suppress-2, suppress-3, suppress-4
  }

  createCriticalProtectionTestSet() {
    const now = new Date();
    return [
      // Critical alerts that should NEVER be suppressed
      {
        id: 'critical-1',
        timestamp: now.toISOString(),
        type: 'SERVICE_DOWN',
        severity: 'CRITICAL',
        message: 'CRITICAL: Database outage detected',
        acknowledged: false,
        resolved: false
      },
      {
        id: 'critical-2',
        timestamp: now.toISOString(),
        type: 'NETWORK_TIMEOUT',
        severity: 'LOW', // Low severity but contains critical keyword
        message: 'Network outage affecting multiple servers',
        acknowledged: false,
        resolved: false
      },
      {
        id: 'critical-3',
        timestamp: now.toISOString(),
        type: 'CPU_HIGH',
        severity: 'LOW',
        message: 'System down - critical infrastructure failure',
        acknowledged: true, // Even if acknowledged, should not suppress critical
        resolved: false
      },
      // Non-critical noise
      {
        id: 'noise-1',
        timestamp: now.toISOString(),
        type: 'SSL_EXPIRY',
        severity: 'LOW',
        message: 'SSL certificate expiring in 20 days',
        acknowledged: false,
        resolved: false
      }
    ];
  }

  countExpectedCritical(alerts) {
    return 3; // critical-1, critical-2, critical-3
  }

  async testEmptyAlerts() {
    const result = await this.deduplicationEngine.processAlerts([]);
    if (result.processedAlerts.length !== 0) {
      throw new Error('Empty alert array not handled correctly');
    }
  }

  async testMalformedAlerts() {
    const malformedAlerts = [
      { id: 'malformed-1' }, // Missing required fields
      { id: 'malformed-2', message: null, type: 'CPU_HIGH' },
      { id: 'malformed-3', timestamp: 'invalid-date', type: 'MEMORY_HIGH' }
    ];
    
    // Should not crash
    await this.deduplicationEngine.processAlerts(malformedAlerts);
  }

  async testTimestampEdgeCases() {
    const now = new Date();
    const edgeCaseAlerts = [
      {
        id: 'time-1',
        timestamp: new Date(now.getTime() - 1000000000).toISOString(), // Very old
        type: 'CPU_HIGH',
        message: 'Old alert'
      },
      {
        id: 'time-2',
        timestamp: new Date(now.getTime() + 1000000000).toISOString(), // Future
        type: 'CPU_HIGH',
        message: 'Future alert'
      }
    ];
    
    await this.deduplicationEngine.processAlerts(edgeCaseAlerts);
  }

  async testUnicodeHandling() {
    const unicodeAlerts = [
      {
        id: 'unicode-1',
        timestamp: new Date().toISOString(),
        type: 'CPU_HIGH',
        message: 'Alert with émojis 🚨 and ünïcödé characters',
        server: 'srv-tëst-01'
      }
    ];
    
    await this.deduplicationEngine.processAlerts(unicodeAlerts);
  }

  async testLargeVolumeHandling() {
    const largeAlertSet = Array.from({length: 1000}, (_, i) => ({
      id: `large-${i}`,
      timestamp: new Date().toISOString(),
      type: 'CPU_HIGH',
      message: `Alert ${i}`,
      server: `srv-${i % 10}`
    }));
    
    const startTime = Date.now();
    await this.deduplicationEngine.processAlerts(largeAlertSet);
    const processingTime = Date.now() - startTime;
    
    if (processingTime > 5000) { // Should process 1000 alerts in under 5 seconds
      throw new Error(`Large volume processing too slow: ${processingTime}ms`);
    }
  }

  identifyDeduplicationIssues(testAlerts, result) {
    const issues = [];
    
    // Check if fingerprinting is too strict or too loose
    const expectedGroups = this.groupAlertsByExpectedFingerprint(testAlerts);
    const actualDuplicates = result.metrics.duplicates;
    
    if (actualDuplicates < expectedGroups.duplicates) {
      issues.push('Deduplication too strict - missing some duplicates');
    }
    if (actualDuplicates > expectedGroups.duplicates) {
      issues.push('Deduplication too loose - false positive duplicates');
    }
    
    return issues;
  }

  identifySuppressionIssues(testAlerts, result) {
    const issues = [];
    
    // Check if suppression rules are working correctly
    const suppressedAlerts = testAlerts.length - result.processedAlerts.length - result.metrics.duplicates;
    const expectedSuppressed = this.countExpectedSuppressed(testAlerts);
    
    if (suppressedAlerts < expectedSuppressed) {
      issues.push('Noise suppression too lenient - letting noise through');
    }
    if (suppressedAlerts > expectedSuppressed) {
      issues.push('Noise suppression too aggressive - suppressing valid alerts');
    }
    
    return issues;
  }

  identifyCriticalProtectionIssues(testAlerts, result) {
    const issues = [];
    
    // Check if any critical alerts were suppressed
    const criticalAlerts = testAlerts.filter(a => 
      this.deduplicationEngine.isCriticalAlert(a) || a.severity === 'CRITICAL'
    );
    
    const escalatedCritical = result.processedAlerts.filter(a => 
      this.deduplicationEngine.isCriticalAlert(a) || a.severity === 'CRITICAL'
    );
    
    if (escalatedCritical.length < criticalAlerts.length) {
      issues.push('Critical alert protection failed - some critical alerts suppressed');
    }
    
    return issues;
  }

  groupAlertsByExpectedFingerprint(alerts) {
    // Simulate expected grouping logic
    const groups = new Map();
    let duplicates = 0;
    
    for (const alert of alerts) {
      const key = `${alert.type}_${alert.server}_${alert.message?.substring(0, 50)}`;
      if (groups.has(key)) {
        duplicates++;
      } else {
        groups.set(key, alert);
      }
    }
    
    return { groups: groups.size, duplicates };
  }

  generateAccuracyReport(results) {
    console.log('\n📊 ACCURACY REPORT');
    console.log('=' .repeat(70));
    console.log(`🎯 Overall System Accuracy: ${results.overallSystemAccuracy}%`);
    console.log(`📋 Deduplication Accuracy: ${results.deduplicationAccuracy.accuracy}%`);
    console.log(`🔇 Suppression Accuracy: ${results.suppressionAccuracy.accuracy}%`);
    console.log(`🛡️ Critical Protection Accuracy: ${results.criticalProtectionAccuracy.accuracy}%`);
    console.log(`⚠️ Edge Case Handling: ${results.edgeCaseHandling.accuracy}%`);
    
    console.log('\n🎯 TARGET: 95% Accuracy');
    console.log(`Status: ${results.overallSystemAccuracy >= 95 ? '✅ ACHIEVED' : '❌ NEEDS IMPROVEMENT'}`);
  }

  providePrioritizedFixes(results) {
    console.log('\n🔧 PRIORITIZED FIXES FOR 95%+ ACCURACY');
    console.log('=' .repeat(70));
    
    const fixes = [];
    
    if (results.deduplicationAccuracy.accuracy < 95) {
      fixes.push({
        priority: 1,
        component: 'Deduplication Engine',
        accuracy: results.deduplicationAccuracy.accuracy,
        issues: results.deduplicationAccuracy.issues,
        fixes: [
          'Improve fingerprint algorithm to handle message variations',
          'Add fuzzy matching for near-duplicate detection',
          'Implement time-window clustering for related alerts'
        ]
      });
    }
    
    if (results.suppressionAccuracy.accuracy < 95) {
      fixes.push({
        priority: 2,
        component: 'Noise Suppression',
        accuracy: results.suppressionAccuracy.accuracy,
        issues: results.suppressionAccuracy.issues,
        fixes: [
          'Refine suppression rules with more precise conditions',
          'Add context-aware suppression (incident correlation)',
          'Implement machine learning for adaptive thresholds'
        ]
      });
    }
    
    if (results.criticalProtectionAccuracy.accuracy < 95) {
      fixes.push({
        priority: 1, // Critical protection is highest priority
        component: 'Critical Alert Protection',
        accuracy: results.criticalProtectionAccuracy.accuracy,
        issues: results.criticalProtectionAccuracy.issues,
        fixes: [
          'Expand critical keyword detection',
          'Add severity-based protection rules',
          'Implement whitelist for never-suppress alert types'
        ]
      });
    }
    
    if (results.edgeCaseHandling.accuracy < 95) {
      fixes.push({
        priority: 3,
        component: 'Edge Case Handling',
        accuracy: results.edgeCaseHandling.accuracy,
        issues: results.edgeCaseHandling.issues,
        fixes: [
          'Add input validation and sanitization',
          'Implement graceful error handling',
          'Add performance optimization for large volumes'
        ]
      });
    }
    
    // Sort by priority
    fixes.sort((a, b) => a.priority - b.priority);
    
    fixes.forEach((fix, index) => {
      console.log(`\n${index + 1}. ${fix.component} (Priority ${fix.priority})`);
      console.log(`   Current Accuracy: ${fix.accuracy}%`);
      console.log(`   Issues: ${fix.issues.join(', ')}`);
      console.log(`   Recommended Fixes:`);
      fix.fixes.forEach(f => console.log(`   • ${f}`));
    });
    
    if (fixes.length === 0) {
      console.log('🎉 All components are above 95% accuracy!');
    }
  }
}

// Run analysis if called directly
if (require.main === module) {
  const analysis = new AccuracyAnalysis();
  analysis.runComprehensiveAnalysis().catch(console.error);
}

module.exports = AccuracyAnalysis;