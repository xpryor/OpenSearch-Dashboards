#!/usr/bin/env node

// Simple demo script to test coordinate parsing functionality
// This can be run independently to verify the coordinate parser works

const { CoordinateParser } = require('./public/utils/coordinate_parser');

console.log('GeoJump Plugin Demo');
console.log('==================');

// Test cases
const testCases = [
  '40.7128, -74.0060',
  '40.7128 -74.0060',
  '40°42\'46"N 74°0\'21"W',
  '40°42.767\'N 74°0.35\'W',
  'New York City', // This should fail
  '91, 0', // Invalid latitude
  '0, 181', // Invalid longitude
];

console.log('\nTesting coordinate parsing:');
console.log('---------------------------');

testCases.forEach((testCase, index) => {
  console.log(`\nTest ${index + 1}: "${testCase}"`);
  
  try {
    const result = CoordinateParser.parseCoordinates(testCase);
    if (result) {
      console.log(`  ✓ Parsed: lat=${result.lat.toFixed(6)}, lon=${result.lon.toFixed(6)}`);
      
      // Test formatting
      const formatted = CoordinateParser.formatCoordinates(result, 'decimal_degrees');
      console.log(`  ✓ Formatted: ${formatted}`);
    } else {
      console.log('  ✗ Failed to parse');
    }
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
  }
});

console.log('\nDemo completed!');
console.log('\nTo use the GeoJump plugin:');
console.log('1. Start OpenSearch Dashboards: yarn start');
console.log('2. Navigate to http://localhost:5601');
console.log('3. Look for "GeoJump" in the main navigation menu');
console.log('4. Enter coordinates and jump to locations on maps!');
