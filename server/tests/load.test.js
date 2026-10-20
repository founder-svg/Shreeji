process.env.NODE_ENV = 'test';
import autocannon from 'autocannon';
import app from '../src/app.js';
import { initDatabase } from '../src/config/database.js';

const PORT = 5597;

const runLoadBenchmarks = async () => {
  console.log('===============================================================');
  console.log('🚀 SHREEJI 100-CONCURRENT-USER REALISTIC LOAD & STRESS SUITE');
  console.log('===============================================================\n');

  await initDatabase();
  const server = app.listen(PORT);
  const baseUrl = `http://localhost:${PORT}`;

  try {
    // Warm-up request
    await fetch(`${baseUrl}/api/v1/products`);
    await fetch(`${baseUrl}/api/v1/categories`);

    // -------------------------------------------------------------
    // STAGE 1: Baseline Single-User Latency (1 Connection)
    // -------------------------------------------------------------
    console.log('🔹 Stage 1: Running Baseline Test (1 Virtual User, 3 seconds)...');
    const stage1 = await autocannon({
      url: `${baseUrl}/api/v1/products`,
      connections: 1,
      duration: 3,
    });
    console.log(`   Baseline: ${stage1.requests.average.toFixed(0)} req/s | p50: ${stage1.latency.p50}ms | p95: ${stage1.latency.p97_5 || stage1.latency.p99}ms | Errors: ${stage1.errors}\n`);

    // -------------------------------------------------------------
    // STAGE 2: Moderate Concurrency (25 Virtual Users)
    // -------------------------------------------------------------
    console.log('🔹 Stage 2: Running Moderate Concurrency Test (25 Virtual Users, 3 seconds)...');
    const stage2 = await autocannon({
      url: `${baseUrl}/api/v1/products?search=crimson&sort=price-low`,
      connections: 25,
      duration: 3,
    });
    console.log(`   25 Users: ${stage2.requests.average.toFixed(0)} req/s | p50: ${stage2.latency.p50}ms | p95: ${stage2.latency.p97_5 || stage2.latency.p99}ms | Errors: ${stage2.errors}\n`);

    // -------------------------------------------------------------
    // STAGE 3: PRD MANDATORY ACCEPTANCE TARGET (100 CONCURRENT USERS)
    // -------------------------------------------------------------
    console.log('🔥 STAGE 3: RUNNING 100 CONCURRENT USERS ACCEPTANCE BENCHMARK (5 seconds)...');
    const stage3 = await autocannon({
      url: `${baseUrl}/api/v1/products`,
      connections: 100,
      duration: 5,
      headers: {
        'X-Client-Platform': 'web',
      },
    });

    const p95_100 = stage3.latency.p97_5 || stage3.latency.p99;
    const p99_100 = stage3.latency.p99;
    const errorRatePercent = stage3.requests.total > 0
      ? ((stage3.errors / stage3.requests.total) * 100).toFixed(3)
      : '0.000';

    console.log('\n===============================================================');
    console.log('📊 100 CONCURRENT ACTIVE USERS OFFICIAL TEST REPORT');
    console.log('===============================================================');
    console.log(`Concurrent Active Users:  100 virtual users`);
    console.log(`Total Requests Handled:   ${stage3.requests.total}`);
    console.log(`Throughput Rate:          ${stage3.requests.average.toFixed(0)} requests/second`);
    console.log(`Data Throughput:          ${(stage3.throughput.average / 1024 / 1024).toFixed(2)} MB/s`);
    console.log(`Latency p50 (Median):     ${stage3.latency.p50} ms`);
    console.log(`Latency p90:              ${stage3.latency.p90} ms`);
    console.log(`Latency p95:              ${p95_100} ms (Target: <= 200 ms)`);
    console.log(`Latency p99:              ${p99_100} ms (Target: <= 500 ms)`);
    console.log(`Total Error Count:        ${stage3.errors}`);
    console.log(`Error Rate:               ${errorRatePercent}% (Target: < 0.1%)`);
    console.log('===============================================================\n');

    // -------------------------------------------------------------
    // STAGE 4: Burst & Stress Test (120 Connections)
    // -------------------------------------------------------------
    console.log('⚡ Stage 4: Running Burst & Stress Test (120 Virtual Users, 3 seconds)...');
    const stage4 = await autocannon({
      url: `${baseUrl}/api/v1/products/prod-1`,
      connections: 120,
      duration: 3,
    });
    console.log(`   120 Users Burst: ${stage4.requests.average.toFixed(0)} req/s | p50: ${stage4.latency.p50}ms | p95: ${stage4.latency.p97_5 || stage4.latency.p99}ms | Errors: ${stage4.errors}\n`);

    server.close(() => {
      const p95Passed = p95_100 <= 200;
      const p99Passed = p99_100 <= 500;
      const errorPassed = parseFloat(errorRatePercent) < 0.1;

      if (p95Passed && p99Passed && errorPassed) {
        console.log('🏆 [PRD ACCEPTANCE VERIFIED]: 100 Concurrent Active Users target PASSED!');
        console.log('   All latency thresholds (p95 <= 200ms, p99 <= 500ms, errors < 0.1%) met.\n');
        process.exit(0);
      } else {
        console.error('❌ Some acceptance criteria were not satisfied.');
        process.exit(1);
      }
    });
  } catch (err) {
    console.error('💥 Load benchmark failed:', err);
    server.close(() => process.exit(1));
  }
};

runLoadBenchmarks();
