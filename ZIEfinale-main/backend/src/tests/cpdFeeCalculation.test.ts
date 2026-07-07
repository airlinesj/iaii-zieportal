/**
 * CPD Fee Calculation - Test Examples
 * This file demonstrates how the new fee calculation feature works
 */

import {
  CPD_DURATION_FEES,
  calculateCpdDurationFeeUsd,
  convertUsdToLocalCurrency,
  calculateCpdDurationFeeWithConversion,
  getCpdDurationFeeOptions,
  CpdDurationFeeResult
} from '../services/CpdPaymentService';

// ============================================
// TEST SCENARIOS
// ============================================

/**
 * Test 1: Get all available fee options
 */
export function testGetFeeOptions() {
  console.log('\n=== TEST 1: Get Fee Options ===');
  const options = getCpdDurationFeeOptions();
  console.log('Available CPD fee options:');
  options.forEach(option => {
    console.log(`- ${option.label}: $${option.usdFee.toFixed(2)}`);
  });
  return options;
}

/**
 * Test 2: Calculate fee for half-day course
 */
export function testHalfDayCourse() {
  console.log('\n=== TEST 2: Half-Day Course ===');
  const durationDays = 0.5;
  console.log(`Course Duration: ${durationDays} days`);
  
  try {
    const result = calculateCpdDurationFeeUsd(durationDays);
    console.log(`Category: ${result.category}`);
    console.log(`Label: ${result.label}`);
    console.log(`USD Fee: $${result.usdFee.toFixed(2)}`);
    return result;
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

/**
 * Test 3: Calculate fee for full-day course
 */
export function testFullDayCourse() {
  console.log('\n=== TEST 3: Full-Day Course ===');
  const durationDays = 1;
  console.log(`Course Duration: ${durationDays} day`);
  
  try {
    const result = calculateCpdDurationFeeUsd(durationDays);
    console.log(`Category: ${result.category}`);
    console.log(`Label: ${result.label}`);
    console.log(`USD Fee: $${result.usdFee.toFixed(2)}`);
    return result;
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

/**
 * Test 4: Calculate fee for 2-day course
 */
export function testTwoDayCourse() {
  console.log('\n=== TEST 4: Two-Day Course ===');
  const durationDays = 2;
  console.log(`Course Duration: ${durationDays} days`);
  
  try {
    const result = calculateCpdDurationFeeUsd(durationDays);
    console.log(`Category: ${result.category}`);
    console.log(`Label: ${result.label}`);
    console.log(`USD Fee: $${result.usdFee.toFixed(2)}`);
    return result;
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

/**
 * Test 5: Calculate fee for 5-day course (within 3-7 days range)
 */
export function testFiveDayCourse() {
  console.log('\n=== TEST 5: Five-Day Course ===');
  const durationDays = 5;
  console.log(`Course Duration: ${durationDays} days`);
  
  try {
    const result = calculateCpdDurationFeeUsd(durationDays);
    console.log(`Category: ${result.category}`);
    console.log(`Label: ${result.label}`);
    console.log(`USD Fee: $${result.usdFee.toFixed(2)}`);
    return result;
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

/**
 * Test 6: Calculate fee for 10-day course (more than 7 days)
 */
export function testTenDayCourse() {
  console.log('\n=== TEST 6: Ten-Day Course ===');
  const durationDays = 10;
  console.log(`Course Duration: ${durationDays} days`);
  
  try {
    const result = calculateCpdDurationFeeUsd(durationDays);
    console.log(`Category: ${result.category}`);
    console.log(`Label: ${result.label}`);
    console.log(`USD Fee: $${result.usdFee.toFixed(2)}`);
    return result;
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

/**
 * Test 7: Currency conversion - USD to ZWL
 */
export function testCurrencyConversion() {
  console.log('\n=== TEST 7: Currency Conversion ===');
  const usdAmount = 100;
  const interbankRate = 26.5; // ZWL per USD
  
  console.log(`USD Amount: $${usdAmount.toFixed(2)}`);
  console.log(`Interbank Rate: ${interbankRate} ZWL per USD`);
  
  const zwlAmount = convertUsdToLocalCurrency(usdAmount, interbankRate);
  console.log(`Converted Amount: ZWL ${zwlAmount.toFixed(2)}`);
  
  return zwlAmount;
}

/**
 * Test 8: Complete fee calculation with currency conversion
 */
export function testCompleteCalculation() {
  console.log('\n=== TEST 8: Complete Fee Calculation ===');
  const durationDays = 2;
  const interbankRate = 26.5;
  
  console.log(`Course Duration: ${durationDays} days`);
  console.log(`Interbank Rate: ${interbankRate} ZWL per USD`);
  
  try {
    const result = calculateCpdDurationFeeWithConversion(durationDays, interbankRate);
    console.log(`\nDuration Category: ${result.durationCategory}`);
    console.log(`Duration Label: ${result.durationLabel}`);
    console.log(`USD Cost: $${result.usdCost.toFixed(2)}`);
    console.log(`Interbank Rate: ${result.interbankRate}`);
    console.log(`ZWL Cost: ZWL ${result.zwlCost.toFixed(2)}`);
    console.log(`Currency Pair: ${result.currencyPair}`);
    
    return result;
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

/**
 * Test 9: Invalid input handling
 */
export function testErrorHandling() {
  console.log('\n=== TEST 9: Error Handling ===');
  
  // Test invalid duration (too small)
  console.log('\nTest 9a: Invalid duration (0.2 days)');
  try {
    calculateCpdDurationFeeUsd(0.2);
    console.log('ERROR: Should have thrown an error');
  } catch (error: any) {
    console.log(`✓ Correctly caught error: ${error.message}`);
  }
  
  // Test negative duration
  console.log('\nTest 9b: Negative duration (-1 days)');
  try {
    calculateCpdDurationFeeUsd(-1);
    console.log('ERROR: Should have thrown an error');
  } catch (error: any) {
    console.log(`✓ Correctly caught error: ${error.message}`);
  }
  
  // Test invalid exchange rate
  console.log('\nTest 9c: Invalid exchange rate (negative)');
  try {
    convertUsdToLocalCurrency(100, -5);
    console.log('ERROR: Should have thrown an error');
  } catch (error: any) {
    console.log(`✓ Correctly caught error: ${error.message}`);
  }
}

/**
 * Test 10: All fee options with conversion
 */
export function testAllOptionsWithConversion() {
  console.log('\n=== TEST 10: All Options with Currency Conversion ===');
  const interbankRate = 26.5;
  const options = getCpdDurationFeeOptions();
  
  console.log(`\nUsing Interbank Rate: ${interbankRate} ZWL per USD\n`);
  console.log('Duration | Label | USD | ZWL');
  console.log('-'.repeat(70));
  
  options.forEach(option => {
    const zwlAmount = convertUsdToLocalCurrency(option.usdFee, interbankRate);
    console.log(
      `${option.key.padEnd(10)} | ${option.label.padEnd(30)} | $${option.usdFee.toFixed(2).padEnd(8)} | ZWL ${zwlAmount.toFixed(2)}`
    );
  });
}

// ============================================
// RUN ALL TESTS
// ============================================

export function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     CPD FEE CALCULATION - COMPREHENSIVE TEST SUITE          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  testGetFeeOptions();
  testHalfDayCourse();
  testFullDayCourse();
  testTwoDayCourse();
  testFiveDayCourse();
  testTenDayCourse();
  testCurrencyConversion();
  testCompleteCalculation();
  testErrorHandling();
  testAllOptionsWithConversion();

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║              ALL TESTS COMPLETED SUCCESSFULLY               ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
}

// Execute tests if this file is run directly
if (require.main === module) {
  runAllTests();
}
