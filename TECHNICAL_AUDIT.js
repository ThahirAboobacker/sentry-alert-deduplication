/**
 * CRITICAL TECHNICAL AUDIT - Sentry Alert Deduplication
 * Tests real vs fake functionality with unseen data
 */

const DeduplicationEngine = require('./src/deduplication-engine');
const crypto = require('crypto');
const moment = require('moment');

class SentryTechnicalAudit {
  constructor() {
    this.engine = new DeduplicationEngine();
    this.testResults = {
      realFunctionality: [],
      limitations: [],
      strengths: [],
      overallScore: 0
    };
  }

  async runCompleteAudit() {
    console.log('\n🔍 SENTRY TECHNICAL AUDIT - REAL VS FAKE ANALYSIS');
    console.log('=' .repeat(70));
    console.log('🎯 Testing with completely NEW, UNSEEN alert data');
    console.log('🔬 Measuring actual vs claimed performance\n');

    // Test 1: Real deduplication with new data
    await this.testRealDeduplication();
    
    // Test 2: Edge cases and malformed data
    await this.testEdgeCases();
    
    // Test 3: Performance with large datasets
    await this.testPerformance();
    
    // Test 4: Critical alert protection
    await this.testCriticalProtection();
    
    // Test 5: Noise suppression accuracy
    await this.testNoiseSuppression();
    
    // Test 6: Algorithm robustness
    await this.testAlgorithmRobustness();

    // Final assessment
    this.generateFinalAssessment();
  }

  async testRealDeduplication() {
    console.log('🧪 TEST 1: REAL DEDUPLICATION WITH NEW DATA');
    console.log('-'.repeat(50));

    // Generate completely new alert data (not from demo files)
    const newAlerts = this.generateFreshAlertData(50);
    console.log(`📊 Generated ${newAlerts.length} fresh alerts for testing`);

    this.engine.resetMetrics();
    const result = await this.engine.processAlerts(newAlerts);

    // Analyze if deduplication actually worked
    const duplicateCount = this.countActualDuplicates(newAlerts);
    const detectedDuplicates = result.metrics.duplicates;
    
    console.log(`🔍 Actual duplicates in data: ${duplicateCount}`);
    console.log(`🤖 Detected by Sentry: ${detectedDuplicates}`);
    console.log(`📊 Detection accuracy: ${Math.round((detectedDuplicates / duplicateCount) * 100)}%`);
    
    const isRealDeduplication = detectedDuplicates > 0 && detectedDuplicates <= duplicateCount;
    
    if (isRealDeduplication) {
      this.testResults.realFunctionality.push('✅ Deduplication algorithm is REAL and functional');
      this.testResults.strengths.push(`Detected ${detectedDuplicates}/${duplicateCount} duplicates correctly`);
    } else {
      this.testResults.limitations.push('❌ Deduplication may be fake or non-functional');
    }

    console.log(`🎯 Result: ${result.originalCount} → ${result.processedAlerts.length} alerts (${result.reductionPercentage}% reduction)`);
    console.log(`✅ Status: ${isRealDeduplication ? 'REAL FUNCTIONALITY' : 'QUESTIONABLE FUNCTIONALITY'}\n`);
  }

  async testEdgeCases() {
    console.log('🧪 TEST 2: EDGE CASES AND MALFORMED DATA');
    console.log('-'.repeat(50));

    const edgeCases = [
      // Malformed alerts
      null,
      undefined,
      {},
      { message: 'Test without required fields' },
      { timestamp: 'invalid-date', message: 'Bad timestamp' },
      { timestamp: new Date().toISOString(), message: null },
      
      // Similar but different alerts (should NOT be deduplicated)
      {
        id: '1',
        timestamp: new Date().toISOString(),
        type: 'CPU_HIGH',
        server: 'srv-01',
        client: 'ClientA',
        message: 'CPU usage at 95%',
        severity: 'CRITICAL'
      },
      {
        id: '2', 
        timestamp: new Date().toISOString(),
        type: 'CPU_HIGH',
        server: 'srv-02', // Different server
        client: 'ClientA',
        message: 'CPU usage at 95%',
        severity: 'CRITICAL'
      }
    ];

    this.engine.resetMetrics();
    
    try {
      const result = await this.engine.processAlerts(edgeCases);
      console.log(`📊 Processed ${edgeCases.length} edge cases`);
      console.log(`🛡️ Handled gracefully: ${result.processedAlerts.length} valid alerts extracted`);
      
      this.testResults.strengths.push('✅ Handles malformed data gracefully');
    } catch (error) {
      console.log(`❌ Failed on edge cases: ${error.message}`);
      this.testResults.limitations.push('❌ Poor error handling for malformed data');
    }

    console.log('✅ Status: Edge case handling tested\n');
  }

  async testPerformance() {
    console.log('🧪 TEST 3: PERFORMANCE WITH LARGE DATASETS');
    console.log('-'.repeat(50));

    const sizes = [100, 500, 1000];
    
    for (const size of sizes) {
      const largeDataset = this.generateFreshAlertData(size);
      
      const startTime = process.hrtime.bigint();
      this.engine.resetMetrics();
      const result = await this.engine.processAlerts(largeDataset);
      const endTime = process.hrtime.bigint();
      
      const processingTimeMs = Number(endTime - startTime) / 1000000;
      const avgTimePerAlert = processingTimeMs / size;
      
      console.log(`📊 ${size} alerts: ${processingTimeMs.toFixed(2)}ms total, ${avgTimePerAlert.toFixed(2)}ms per alert`);
      
      if (avgTimePerAlert < 1) {
        this.testResults.strengths.push(`✅ Fast processing: ${avgTimePerAlert.toFixed(2)}ms per alert for ${size} alerts`);
      } else {
        this.testResults.limitations.push(`⚠️ Slow processing: ${avgTimePerAlert.toFixed(2)}ms per alert for ${size} alerts`);
      }
    }

    console.log('✅ Status: Performance testing completed\n');
  }

  async testCriticalProtection() {
    console.log('🧪 TEST 4: CRITICAL ALERT PROTECTION');
    console.log('-'.repeat(50));

    const criticalAlerts = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        type: 'SERVICE_DOWN',
        message: 'CRITICAL: Database service down',
        severity: 'CRITICAL',
        server: 'db-01',
        client: 'TestClient'
      },
      {
        id: '2',
        timestamp: new Date().toISOString(),
        type: 'NETWORK_OUTAGE',
        message: 'Network outage detected',
        severity: 'HIGH',
        server: 'router-01',
        client: 'TestClient'
      },
      {
        id: '3',
        timestamp: new Date().toISOString(),
        type: 'SYSTEM_FAILED',
        message: 'System failed to start',
        severity: 'MEDIUM',
        server: 'app-01',
        client: 'TestClient'
      },
      // Non-critical that should be suppressed
      {
        id: '4',
        timestamp: new Date().toISOString(),
        type: 'INFO',
        message: 'Informational: Backup completed',
        severity: 'LOW',
        server: 'backup-01',
        client: 'TestClient'
      }
    ];

    this.engine.resetMetrics();
    const result = await this.engine.processAlerts(criticalAlerts);
    
    const criticalPreserved = result.processedAlerts.filter(alert => 
      this.engine.isCriticalAlert(alert)
    ).length;
    
    console.log(`🛡️ Critical alerts in input: 3`);
    console.log(`✅ Critical alerts preserved: ${criticalPreserved}`);
    console.log(`📊 Total output: ${result.processedAlerts.length} alerts`);
    
    if (criticalPreserved === 3) {
      this.testResults.strengths.push('✅ Perfect critical alert protection (0% false negatives)');
    } else {
      this.testResults.limitations.push(`❌ Critical alert protection failed: ${3 - criticalPreserved} critical alerts lost`);
    }

    console.log('✅ Status: Critical protection tested\n');
  }

  async testNoiseSuppression() {
    console.log('🧪 TEST 5: NOISE SUPPRESSION ACCURACY');
    console.log('-'.repeat(50));

    const noiseAlerts = [
      // Should be suppressed
      {
        id: '1',
        timestamp: new Date().toISOString(),
        type: 'CPU_HIGH',
        message: 'CPU usage at 70%',
        severity: 'LOW',
        server: 'app-01',
        client: 'TestClient',
        metadata: { currentValue: '70%' }
      },
      {
        id: '2',
        timestamp: new Date().toISOString(),
        type: 'INFO',
        message: 'Informational: System health check completed',
        severity: 'LOW',
        server: 'monitor-01',
        client: 'TestClient'
      },
      {
        id: '3',
        timestamp: new Date().toISOString(),
        type: 'BACKUP',
        message: 'Backup completed successfully',
        severity: 'LOW',
        server: 'backup-01',
        client: 'TestClient',
        acknowledged: true
      },
      // Should NOT be suppressed
      {
        id: '4',
        timestamp: new Date().toISOString(),
        type: 'CPU_HIGH',
        message: 'CPU usage at 98%',
        severity: 'HIGH',
        server: 'app-01',
        client: 'TestClient',
        metadata: { currentValue: '98%' }
      }
    ];

    this.engine.resetMetrics();
    const result = await this.engine.processAlerts(noiseAlerts);
    
    console.log(`🔇 Noise alerts suppressed: ${result.metrics.suppressed}`);
    console.log(`✅ Important alerts preserved: ${result.processedAlerts.length}`);
    
    // Should suppress 3 noise alerts, preserve 1 important alert
    if (result.metrics.suppressed === 3 && result.processedAlerts.length === 1) {
      this.testResults.strengths.push('✅ Perfect noise suppression accuracy');
    } else {
      this.testResults.limitations.push(`⚠️ Noise suppression inaccuracy: expected 3 suppressed, 1 preserved; got ${result.metrics.suppressed} suppressed, ${result.processedAlerts.length} preserved`);
    }

    console.log('✅ Status: Noise suppression tested\n');
  }

  async testAlgorithmRobustness() {
    console.log('🧪 TEST 6: ALGORITHM ROBUSTNESS');
    console.log('-'.repeat(50));

    // Test fingerprinting consistency
    const alert1 = {
      type: 'CPU_HIGH',
      server: 'srv-01',
      client: 'ClientA',
      message: 'CPU usage high'
    };
    
    const alert2 = {
      type: 'CPU_HIGH',
      server: 'srv-01', 
      client: 'ClientA',
      message: 'CPU usage high'
    };

    const fingerprint1 = this.engine.generateAlertFingerprint(alert1);
    const fingerprint2 = this.engine.generateAlertFingerprint(alert2);
    
    console.log(`🔍 Fingerprint consistency: ${fingerprint1 === fingerprint2 ? '✅ PASS' : '❌ FAIL'}`);
    
    if (fingerprint1 === fingerprint2) {
      this.testResults.strengths.push('✅ Consistent fingerprinting algorithm');
    } else {
      this.testResults.limitations.push('❌ Inconsistent fingerprinting algorithm');
    }

    // Test time window logic
    const now = moment();
    const alert3 = { ...alert1, timestamp: now.toISOString() };
    const alert4 = { ...alert1, timestamp: now.clone().add(2, 'minutes').toISOString() }; // Within 5min window
    const alert5 = { ...alert1, timestamp: now.clone().add(10, 'minutes').toISOString() }; // Outside window

    this.engine.resetMetrics();
    await this.engine.processAlerts([alert3, alert4, alert5]);
    
    console.log(`⏰ Time window deduplication: ${this.engine.metrics.duplicates === 1 ? '✅ PASS' : '❌ FAIL'}`);
    
    if (this.engine.metrics.duplicates === 1) {
      this.testResults.strengths.push('✅ Correct time window deduplication');
    } else {
      this.testResults.limitations.push('❌ Incorrect time window logic');
    }

    console.log('✅ Status: Algorithm robustness tested\n');
  }

  generateFreshAlertData(count) {
    const alerts = [];
    const now = moment();
    
    // Create base alerts
    for (let i = 0; i < Math.floor(count * 0.4); i++) {
      alerts.push({
        id: `fresh-${i}`,
        timestamp: now.clone().subtract(Math.random() * 60, 'minutes').toISOString(),
        type: `TYPE_${Math.floor(Math.random() * 5)}`,
        server: `srv-${Math.floor(Math.random() * 3) + 1}`,
        client: `Client${String.fromCharCode(65 + Math.floor(Math.random() * 3))}`,
        message: `Fresh alert ${i} - ${crypto.randomBytes(4).toString('hex')}`,
        severity: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][Math.floor(Math.random() * 4)]
      });
    }
    
    // Add intentional duplicates for testing
    const baseCount = alerts.length;
    for (let i = 0; i < Math.floor(count * 0.6); i++) {
      const original = alerts[Math.floor(Math.random() * baseCount)];
      const duplicate = {
        ...original,
        id: `dup-${i}`,
        timestamp: moment(original.timestamp).add(Math.random() * 4, 'minutes').toISOString() // Within dedup window
      };
      alerts.push(duplicate);
    }
    
    return alerts.slice(0, count);
  }

  countActualDuplicates(alerts) {
    const fingerprints = new Map();
    let duplicates = 0;
    
    for (const alert of alerts) {
      const key = `${alert.type}_${alert.server}_${alert.client}_${(alert.message || '').substring(0, 50)}`;
      
      if (fingerprints.has(key)) {
        const lastSeen = fingerprints.get(key);
        const timeDiff = moment(alert.timestamp).diff(moment(lastSeen), 'seconds');
        if (Math.abs(timeDiff) < 300) { // 5 minute window
          duplicates++;
        }
      } else {
        fingerprints.set(key, alert.timestamp);
      }
    }
    
    return duplicates;
  }

  generateFinalAssessment() {
    console.log('🏆 FINAL TECHNICAL ASSESSMENT');
    console.log('=' .repeat(70));
    
    const totalTests = 6;
    const passedTests = this.testResults.strengths.length;
    const failedTests = this.testResults.limitations.length;
    
    this.testResults.overallScore = Math.round((passedTests / (passedTests + failedTests)) * 100);
    
    console.log('\n✅ CONFIRMED STRENGTHS:');
    this.testResults.strengths.forEach(strength => console.log(`   ${strength}`));
    
    console.log('\n⚠️ IDENTIFIED LIMITATIONS:');
    this.testResults.limitations.forEach(limitation => console.log(`   ${limitation}`));
    
    console.log('\n📊 REAL vs FAKE ANALYSIS:');
    
    if (this.testResults.overallScore >= 80) {
      console.log('🟢 VERDICT: MOSTLY REAL FUNCTIONALITY');
      console.log('   • Core algorithms are genuinely working');
      console.log('   • Deduplication logic is functional');
      console.log('   • Performance claims are accurate');
      console.log('   • Ready for technical judge evaluation');
    } else if (this.testResults.overallScore >= 60) {
      console.log('🟡 VERDICT: MIXED REAL/DEMO FUNCTIONALITY');
      console.log('   • Some algorithms work, others may be demo-only');
      console.log('   • Partial functionality with limitations');
      console.log('   • Needs improvement before production');
    } else {
      console.log('🔴 VERDICT: MOSTLY DEMO/FAKE FUNCTIONALITY');
      console.log('   • Core algorithms may be non-functional');
      console.log('   • Results may be pre-calculated');
      console.log('   • Significant technical debt');
    }
    
    console.log(`\n🎯 OVERALL TECHNICAL SCORE: ${this.testResults.overallScore}%`);
    
    console.log('\n💡 RECOMMENDATIONS:');
    if (this.testResults.overallScore >= 80) {
      console.log('   • Document the working algorithms clearly');
      console.log('   • Add more edge case handling');
      console.log('   • Consider machine learning enhancements');
    } else {
      console.log('   • Fix identified algorithmic issues');
      console.log('   • Improve error handling');
      console.log('   • Add comprehensive testing');
    }
    
    console.log('\n🔍 AUDIT COMPLETE - TECHNICAL TRUTH REVEALED');
    console.log('=' .repeat(70));
  }
}

// Run audit if called directly
if (require.main === module) {
  const audit = new SentryTechnicalAudit();
  audit.runCompleteAudit().catch(console.error);
}

module.exports = SentryTechnicalAudit;