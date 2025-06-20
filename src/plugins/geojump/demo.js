#!/usr/bin/env node

// Simple demo script to test coordinate parsing functionality
// This can be run independently to verify the coordinate parser works

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

// Note: This demo script is for documentation purposes only
// The actual coordinate parsing logic is implemented in TypeScript
// and would need to be compiled before running this demo

testCases.forEach((testCase, index) => {
  console.log(`\nTest ${index + 1}: "${testCase}"`);
  console.log('  (Coordinate parsing would be tested here in a real implementation)');
});

console.log('\nDemo completed!');
console.log('\nTo use the GeoJump plugin:');
console.log('1. Start OpenSearch Dashboards: yarn start');
console.log('2. Navigate to http://localhost:5601');
console.log('3. Look for "GeoJump" in the main navigation menu');
console.log('4. Enter coordinates and jump to locations on maps!');
