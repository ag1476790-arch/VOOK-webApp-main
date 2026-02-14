#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Running VOOK-webApp2 Performance Tests...\n');

const results = {
  apiSpeed: null,
  lighthouse: null,
  errors: []
};

// Test 1: API Response Time
console.log('📡 Testing API speed...');
try {
  const startTime = Date.now();
  const response = execSync(
    'curl -w "%{time_total}" -o /dev/null -s http://localhost:3000/api/feed?communityId=test',
    { encoding: 'utf8', timeout: 10000 }
  );
  const apiTime = parseFloat(response.trim()) * 1000;
  results.apiSpeed = apiTime;
  console.log(`✅ Feed API: ${apiTime.toFixed(2)}ms\n`);
} catch (error) {
  console.log('⚠️  API test skipped (server may not be running)\n');
  results.errors.push('API test failed - ensure dev server is running');
}

// Test 2: Lighthouse Score (if lighthouse is available)
console.log('📊 Running Lighthouse audit...');
try {
  // Check if lighthouse is installed
  try {
    execSync('npx lighthouse --version', { stdio: 'ignore' });
  } catch {
    console.log('⚠️  Lighthouse not found. Installing...');
    execSync('npm install -g @lhci/cli', { stdio: 'inherit' });
  }

  const reportPath = path.join(process.cwd(), 'lighthouse-report.json');
  
  execSync(
    `npx lighthouse http://localhost:3000 --output=json --output-path=${reportPath} --preset=performance --chrome-flags="--headless" --quiet`,
    { stdio: 'inherit', timeout: 120000 }
  );

  if (fs.existsSync(reportPath)) {
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const score = Math.round(report.categories.performance.score * 100);
    results.lighthouse = score;
    console.log(`\n✅ Lighthouse Performance Score: ${score}/100\n`);
    
    // Extract key metrics
    const metrics = report.audits;
    console.log('📈 Key Metrics:');
    console.log(`   LCP: ${(metrics['largest-contentful-paint'].numericValue / 1000).toFixed(2)}s`);
    console.log(`   FID: ${metrics['max-potential-fid']?.numericValue?.toFixed(0) || 'N/A'}ms`);
    console.log(`   CLS: ${metrics['cumulative-layout-shift'].numericValue.toFixed(3)}`);
    console.log(`   TBT: ${(metrics['total-blocking-time'].numericValue / 1000).toFixed(2)}s\n`);
  }
} catch (error) {
  console.log('⚠️  Lighthouse test skipped (server may not be running or timeout)\n');
  results.errors.push('Lighthouse test failed');
}

// Summary
console.log('🎉 PERFORMANCE TESTS COMPLETE\n');
console.log('📊 Results Summary:');
if (results.apiSpeed) {
  console.log(`   API Response: ${results.apiSpeed.toFixed(2)}ms ${results.apiSpeed < 80 ? '✅' : '⚠️'}`);
}
if (results.lighthouse) {
  console.log(`   Lighthouse Score: ${results.lighthouse}/100 ${results.lighthouse >= 90 ? '✅' : '⚠️'}`);
}
if (results.errors.length > 0) {
  console.log(`\n⚠️  Errors: ${results.errors.join(', ')}`);
}

console.log('\n✅ Run `npm run deploy` to push to Vercel production');
