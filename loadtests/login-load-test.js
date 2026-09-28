import http from 'k6/http';
import { check, sleep } from 'k6';

// Simulate your event: 250 users logging in over 60 seconds
export const options = {
  stages: [
    { duration: '10s', target: 50 },   // Ramp up to 50 users
    { duration: '20s', target: 250 },   // Ramp to 250 users (the real test)
    { duration: '30s', target: 250 },   // Hold at 250
    { duration: '10s', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],  // 95% of requests must complete in <3s
    http_req_failed: ['rate<0.05'],     // Less than 5% failure rate
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Generate test user credentials (match your seed data)
function getTestUser(vuId) {
  const teamNum = Math.floor(vuId / 2) + 1;
  const member = vuId % 2 === 0 ? 'MEMBER_1' : 'MEMBER_2';
  return {
    email: `team${String(teamNum).padStart(3, '0')}${member === 'MEMBER_1' ? 'a' : 'b'}@test.com`,
    password: 'password123',
    teamMember: member,
  };
}

export default function () {
  const user = getTestUser(__VU);

  // Step 1: Load the login page
  const loginPage = http.get(`${BASE_URL}/login`);
  check(loginPage, {
    'login page loads': (r) => r.status === 200,
    'login page < 2s': (r) => r.timings.duration < 2000,
  });

  // Step 2: Submit login (THIS is what broke in your event)
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify(user),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(loginRes, {
    'login succeeds': (r) => r.status === 200,
    'login < 3s': (r) => r.timings.duration < 3000,
    'login < 5s (loose)': (r) => r.timings.duration < 5000,
  });

  if (loginRes.status !== 200) {
    console.log(`Login FAILED for ${user.email}: ${loginRes.status} - ${loginRes.body}`);
    return;
  }

  // Step 3: Load dashboard (triggers the post-login cascade)
  const dashboard = http.get(`${BASE_URL}/dashboard`);
  check(dashboard, {
    'dashboard loads': (r) => r.status === 200,
  });

  // Step 4: Simulate the API calls that fire on dashboard mount
  const responses = http.batch([
    ['GET', `${BASE_URL}/api/auth/me`],
    ['GET', `${BASE_URL}/api/event/state`],
    ['GET', `${BASE_URL}/api/rounds/status`],
    ['GET', `${BASE_URL}/api/results/me`],
  ]);

  responses.forEach((r, i) => {
    check(r, {
      [`api call ${i} succeeds`]: (res) => res.status === 200,
      [`api call ${i} < 2s`]: (res) => res.timings.duration < 2000,
    });
  });

  sleep(1);
}
