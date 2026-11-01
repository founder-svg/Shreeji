import assert from 'assert';
import http from 'http';
import app from '../src/app.js';
import { cacheService } from '../src/config/cache.js';
import { clientRepository } from '../src/repositories/clientRepository.js';

const PORT = 5055;
let server;

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', reject);

    if (postData) {
      const payload = typeof postData === 'string' ? postData : JSON.stringify(postData);
      req.setHeader('Content-Type', 'application/json');
      req.setHeader('Content-Length', Buffer.byteLength(payload));
      req.write(payload);
    }

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Shreeji Client Auth & KYC Verification Pipeline Tests (Phase 2)...\n');

  cacheService.flush();

  server = app.listen(PORT);

  try {
    let clientToken = null;
    let clientId = `SHR-TEST-${Date.now().toString().slice(-4)}`;
    let kycAppId = null;
    let adminToken = null;

    // 0. Admin Login for CRM management tests
    const adminLoginRes = await makeRequest(
      { hostname: 'localhost', port: PORT, path: '/api/v1/auth/login', method: 'POST' },
      { email: 'admin@shreeji.com', password: 'shreeji123' }
    );
    assert.strictEqual(adminLoginRes.status, 200, 'Admin authenticates successfully');
    adminToken = adminLoginRes.body.token;
    assert.ok(adminToken, 'Admin token generated');

    // 1. Client Registration
    const testPhone = `9825${Math.floor(100000 + Math.random() * 900000)}`;
    const regRes = await makeRequest(
      { hostname: 'localhost', port: PORT, path: '/api/v1/client/register', method: 'POST' },
      {
        fullName: 'Rajesh K. Vaghela',
        phone: testPhone,
        email: 'rajesh.vaghela@example.com',
        password: 'securePassword123',
        clientId: clientId,
        agentCode: 'AGENT-SHREEJI-07',
      }
    );

    assert.strictEqual(regRes.status, 201, 'POST /api/v1/client/register creates client account');
    assert.ok(regRes.body.token, 'Registration returns signed JWT token');
    assert.strictEqual(regRes.body.client.clientId, clientId, 'Client ID matches');
    assert.strictEqual(regRes.body.client.agentCode, 'AGENT-SHREEJI-07', 'Agent referral code saved');
    clientToken = regRes.body.token;
    console.log('  ✅ PASS: Client registration with User ID & Agent Referral Code');

    // 2. Reject Duplicate Registration
    const dupRes = await makeRequest(
      { hostname: 'localhost', port: PORT, path: '/api/v1/client/register', method: 'POST' },
      {
        fullName: 'Another User',
        phone: testPhone,
        password: 'password123',
        clientId: 'ANOTHER-ID',
      }
    );
    assert.strictEqual(dupRes.status, 409, 'Duplicate phone number registration rejected with 409');
    console.log('  ✅ PASS: Collision detection for duplicate registration');

    // 3. Reject Short Password
    const weakPassRes = await makeRequest(
      { hostname: 'localhost', port: PORT, path: '/api/v1/client/register', method: 'POST' },
      {
        fullName: 'User Weak Pass',
        phone: '9998887776',
        password: '123',
      }
    );
    assert.strictEqual(weakPassRes.status, 400, 'Weak password (< 6 chars) rejected with 400');
    console.log('  ✅ PASS: Password length validation enforced');

    // 4. Client Login via User ID
    const loginRes = await makeRequest(
      { hostname: 'localhost', port: PORT, path: '/api/v1/client/login', method: 'POST' },
      {
        identifier: clientId,
        password: 'securePassword123',
      }
    );
    assert.strictEqual(loginRes.status, 200, 'Client logs in with User ID');
    assert.ok(loginRes.body.token, 'Login returns JWT');
    assert.strictEqual(loginRes.body.client.hasKyc, false, 'hasKyc is false initially');
    console.log('  ✅ PASS: Client login via User ID');

    // 5. Client Login via Mobile Phone Number
    const phoneLoginRes = await makeRequest(
      { hostname: 'localhost', port: PORT, path: '/api/v1/client/login', method: 'POST' },
      {
        identifier: testPhone,
        password: 'securePassword123',
      }
    );
    assert.strictEqual(phoneLoginRes.status, 200, 'Client logs in with Phone Number');
    console.log('  ✅ PASS: Client login via Mobile Number');

    // 6. Reject Invalid Password
    const badLoginRes = await makeRequest(
      { hostname: 'localhost', port: PORT, path: '/api/v1/client/login', method: 'POST' },
      {
        identifier: clientId,
        password: 'wrongPassword',
      }
    );
    assert.strictEqual(badLoginRes.status, 401, 'Invalid password rejected with 401');
    console.log('  ✅ PASS: Unauthorized login rejected');

    // 7. GET /api/v1/client/me profile
    const meRes = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/v1/client/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${clientToken}` },
    });
    assert.strictEqual(meRes.status, 200, 'GET /api/v1/client/me returns client profile');
    assert.strictEqual(meRes.body.client.fullName, 'Rajesh K. Vaghela');
    console.log('  ✅ PASS: GET /api/v1/client/me profile inspection');

    // 8. Submit KYC Form with Aadhar Card & Selected Plot #1
    const kycRes = await makeRequest(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/v1/client/kyc',
        method: 'POST',
        headers: { Authorization: `Bearer ${clientToken}` },
      },
      {
        fullName: 'Rajesh K. Vaghela',
        phone: testPhone,
        email: 'rajesh.vaghela@example.com',
        addressStreet: 'Plot 42, Sector 8, Tagore Road Avenue',
        city: 'Gandhidham',
        state: 'Gujarat',
        pincode: '370201',
        occupation: 'Logistics Business Owner',
        companyName: 'Vaghela Freight & Warehousing Corp',
        workDetails: 'Container logistics and commercial freight operations in Kandla port corridor',
        annualIncomeOrBudget: '₹40 - ₹60 Lakhs',
        aadharNumber: '5421 9876 1234',
        panNumber: 'ABCDE1234F',
        interestedProjectId: 'nagavaladiya-374',
        interestedPlotNumber: '1',
        interestedPlotArea: '182.5 Sq.Yards',
        interestedPlotValue: '₹29,46,620',
        agentCode: 'AGENT-SHREEJI-07',
      }
    );

    assert.strictEqual(kycRes.status, 201, 'POST /api/v1/client/kyc submits KYC application');
    assert.ok(kycRes.body.application.id, 'KYC Application ID returned');
    assert.strictEqual(kycRes.body.application.maskedAadhar, 'XXXX-XXXX-1234', 'Aadhar is securely masked');
    assert.ok(kycRes.body.whatsAppDispatch.directUrl, 'WhatsApp sales dispatch URL generated');
    assert.ok(kycRes.body.whatsAppDispatch.directUrl.includes('919825799754'), 'WhatsApp points to Shreeji +91 98257 99754');
    kycAppId = kycRes.body.application.id;
    console.log('  ✅ PASS: Full KYC verification submission with plot reservation & WhatsApp dispatch (+91 98257 99754)');

    // 9. Reject Invalid Aadhar Number (< 12 digits)
    const badAadharRes = await makeRequest(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/v1/client/kyc',
        method: 'POST',
        headers: { Authorization: `Bearer ${clientToken}` },
      },
      {
        fullName: 'Rajesh K. Vaghela',
        phone: testPhone,
        addressStreet: 'Tagore Road',
        city: 'Gandhidham',
        pincode: '370201',
        aadharNumber: '12345', // Invalid
      }
    );
    assert.strictEqual(badAadharRes.status, 400, 'Invalid Aadhar rejected with 400');
    console.log('  ✅ PASS: UIDAI 12-digit Aadhar validation enforced');

    // 10. Check KYC status for client
    const statusRes = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/v1/client/kyc/status',
      method: 'GET',
      headers: { Authorization: `Bearer ${clientToken}` },
    });
    assert.strictEqual(statusRes.status, 200, 'GET /api/v1/client/kyc/status returns status');
    assert.strictEqual(statusRes.body.hasKyc, true);
    assert.strictEqual(statusRes.body.status, 'pending');
    assert.strictEqual(statusRes.body.application.interestedPlotNumber, '1');
    console.log('  ✅ PASS: Client KYC status retrieval');

    // 11. Admin view all KYC applications
    const adminKycRes = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/v1/admin/kyc-applications',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(adminKycRes.status, 200, 'Admin retrieves KYC application list');
    assert.ok(Array.isArray(adminKycRes.body.data), 'Array of KYC applications returned');
    const found = adminKycRes.body.data.find((k) => k.id === kycAppId);
    assert.ok(found, 'Submitted KYC found in admin list');
    console.log('  ✅ PASS: Admin KYC list access and CRM pipeline visibility');

    // 12. Admin updates KYC application status
    const updateRes = await makeRequest(
      {
        hostname: 'localhost',
        port: PORT,
        path: `/api/v1/admin/kyc-applications/${kycAppId}`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
      },
      {
        status: 'verified',
        adminNotes: 'Aadhar and 7/12 land registration eligibility verified by Shreeji legal team',
      }
    );
    assert.strictEqual(updateRes.status, 200, 'Admin marks KYC application verified');
    assert.strictEqual(updateRes.body.application.verification_status || updateRes.body.application.verificationStatus, 'verified');
    console.log('  ✅ PASS: Admin KYC status progression (pending -> verified)');

    // 13. Security: Unauthenticated KYC request rejected
    const unauthRes = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/v1/client/kyc/status',
      method: 'GET',
    });
    assert.strictEqual(unauthRes.status, 401, 'Unauthenticated request rejected with 401');
    console.log('  ✅ PASS: Security: 401 Unauthorized enforced without JWT token');

    // 14. Phase 3: WhatsApp Dispatch Audit & Admin Log Verification
    const waAuditRes = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/v1/admin/whatsapp-dispatches',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(waAuditRes.status, 200, 'Admin retrieves WhatsApp dispatch audit log');
    assert.strictEqual(waAuditRes.body.targetSalesNumber, '919825799754', 'Target recipient is official Shreeji sales (+91 98257 99754)');
    assert.ok(Array.isArray(waAuditRes.body.data), 'Dispatch records array returned');
    const waLog = waAuditRes.body.data.find((d) => d.kyc_application_id === kycAppId || d.kycApplicationId === kycAppId);
    assert.ok(waLog, 'KYC submission logged in whatsapp_dispatches table');
    console.log('  ✅ PASS: WhatsApp dispatch logged and verified in database audit store (+91 98257 99754)');

    // 15. Phase 3: Client-side Direct WhatsApp Dispatch API
    const customDispatchRes = await makeRequest(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/v1/dispatch/whatsapp',
        method: 'POST',
      },
      {
        clientName: 'Manish V. Patel',
        clientPhone: '9825012345',
        messageType: 'quick_inquiry',
        propertyRef: 'Plot #42 - Nagavaladiya (Survey 374)',
        messageText: 'Client clicked 3D map quick reserve on Plot #42',
      }
    );
    assert.strictEqual(customDispatchRes.status, 201, 'POST /api/v1/dispatch/whatsapp records dispatch');
    assert.strictEqual(customDispatchRes.body.data.recipientPhone, '919825799754', 'Recipient is 919825799754');
    assert.ok(customDispatchRes.body.data.directUrl.includes('919825799754'), 'Direct WhatsApp URL targets 919825799754');
    console.log('  ✅ PASS: Client-side custom WhatsApp dispatch API functional and tracked');

    // 16. Phase 3: Property Inquiry sync with WhatsApp dispatch
    const propInqRes = await makeRequest(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/v1/property-inquiries',
        method: 'POST',
      },
      {
        name: 'Harshil Joshi',
        phone: '9898011223',
        role: 'buyer',
        propertyCategory: 'Commercial Showroom',
        preferredLocation: 'Station Road, Adipur',
        message: 'Looking for 1,500 Sq.Ft showroom space for retail branch',
      }
    );
    assert.strictEqual(propInqRes.status, 201, 'Inquiry registered');
    assert.ok(propInqRes.body.whatsAppDispatch, 'WhatsApp dispatch payload returned for lead');
    assert.strictEqual(propInqRes.body.whatsAppDispatch.phoneNumber, '919825799754', 'Inquiry WhatsApp targets 919825799754');
    console.log('  ✅ PASS: Property inquiry leads automatically synced to DB and formatted for WhatsApp (+91 98257 99754)');

    console.log('\n----------------------------------------------------');
    console.log('🎉 All 16 Client Auth, KYC & WhatsApp Dispatch Tests PASSED (Phase 3)!');
    console.log('----------------------------------------------------\n');
  } finally {
    if (server) server.close();
  }
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  if (server) server.close();
  process.exit(1);
});
