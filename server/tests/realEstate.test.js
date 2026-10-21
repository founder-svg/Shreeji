import http from 'http';
import app from '../src/app.js';
import { initDatabase } from '../src/config/database.js';
import { config } from '../src/config/env.js';

const PORT = 5598;

const runTests = async () => {
  console.log('🧪 Starting Shreeji Real Estate Domain & API Integration Tests...\n');
  await initDatabase();

  const server = app.listen(PORT);

  const request = (path, options = {}) => {
    return new Promise((resolve, reject) => {
      const startTime = process.hrtime.bigint();
      const reqOptions = {
        hostname: 'localhost',
        port: PORT,
        path,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Platform': 'web',
          ...(options.headers || {}),
        },
      };

      const req = http.request(reqOptions, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          const endTime = process.hrtime.bigint();
          const durationMs = Number(endTime - startTime) / 1_000_000;
          let parsed;
          try {
            parsed = JSON.parse(body);
          } catch (e) {
            parsed = body;
          }
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsed,
            durationMs,
          });
        });
      });

      req.on('error', reject);

      if (options.body) {
        req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
      }
      req.end();
    });
  };

  let totalTests = 0;
  let passedTests = 0;

  const assert = (condition, title, latency) => {
    totalTests++;
    const latencyStr = latency !== undefined ? ` [${latency.toFixed(2)}ms]` : '';
    if (condition) {
      passedTests++;
      console.log(`  ✅ PASS: ${title}${latencyStr}`);
    } else {
      console.error(`  ❌ FAIL: ${title}${latencyStr}`);
      process.exitCode = 1;
    }
  };

  try {
    // 1. Admin Authentication for Protected Endpoints
    const rAuth = await request('/api/v1/auth/login', {
      method: 'POST',
      body: {
        email: config.admin.email,
        password: config.admin.password,
      },
    });
    const adminToken = rAuth.body.token;
    assert(rAuth.statusCode === 200 && adminToken, 'Admin authenticates and receives JWT bearer token', rAuth.durationMs);

    // 2. Public Projects Listing
    const rProjects = await request('/api/v1/projects');
    const projectsList = rProjects.body.data || [];
    assert(
      rProjects.statusCode === 200 &&
      Array.isArray(projectsList) &&
      projectsList.length >= 3,
      'GET /api/v1/projects lists seeded commercial development projects',
      rProjects.durationMs
    );

    const firstProject = projectsList[0];

    // 3. Single Project Details
    const rSingleProject = await request(`/api/v1/projects/${firstProject.id}`);
    const projectDetail = rSingleProject.body.data;
    assert(
      rSingleProject.statusCode === 200 &&
      projectDetail &&
      projectDetail.slug === firstProject.slug &&
      projectDetail.latitude &&
      projectDetail.longitude,
      'GET /api/v1/projects/:id returns full project specs with geo-coordinates',
      rSingleProject.durationMs
    );

    // 4. Project Plots Retrieval
    const rProjectPlots = await request(`/api/v1/projects/${firstProject.id}/plots`);
    const projectPlots = rProjectPlots.body.data || [];
    assert(
      rProjectPlots.statusCode === 200 &&
      Array.isArray(projectPlots) &&
      projectPlots.length >= 1,
      'GET /api/v1/projects/:id/plots retrieves parcels belonging to the project',
      rProjectPlots.durationMs
    );

    // 5. Global Plots Listing with Availability Filter
    const rPlots = await request('/api/v1/plots?availabilityStatus=available');
    const plotsList = rPlots.body.data || [];
    assert(
      rPlots.statusCode === 200 &&
      Array.isArray(plotsList) &&
      plotsList.length > 0 &&
      plotsList.every((p) => (p.availabilityStatus || p.availability_status) === 'available'),
      'GET /api/v1/plots?availabilityStatus=available filters plots by availability status',
      rPlots.durationMs
    );

    const targetPlot = plotsList[0];

    // 6. Single Plot Detail with Surveyed GeoJSON Boundary
    const rPlotDetail = await request(`/api/v1/plots/${targetPlot.id}`);
    const plotDetail = rPlotDetail.body.data;
    const boundary = plotDetail?.boundaryGeometry || plotDetail?.boundary_geometry;
    assert(
      rPlotDetail.statusCode === 200 &&
      (plotDetail?.plotNumber || plotDetail?.plot_number) &&
      boundary &&
      boundary.type === 'Polygon',
      'GET /api/v1/plots/:id returns validated surveyed boundary geometry (Polygon)',
      rPlotDetail.durationMs
    );

    // 7. Public Property Lead / Inquiry Submission
    const leadPayload = {
      name: 'Dr. Rajesh Patel',
      phone: '+91 98250 12345',
      role: 'buyer',
      propertyCategory: 'commercial_office',
      preferredLocation: 'Sector 8, Gandhidham',
      budgetRange: '75L - 1.5Cr',
      message: 'Looking for a premium commercial corporate office space in Sector 8.',
      projectId: firstProject.id,
      plotId: targetPlot.id,
    };

    const rLead = await request('/api/v1/property-inquiries', {
      method: 'POST',
      body: leadPayload,
    });

    const createdInquiry = rLead.body.data;
    assert(
      rLead.statusCode === 201 &&
      createdInquiry &&
      createdInquiry.id,
      'POST /api/v1/property-inquiries captures lead and initializes status to new',
      rLead.durationMs
    );

    // 8. Admin Lead Access
    const rAdminLeads = await request('/api/v1/admin/property-inquiries', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const inquiriesList = rAdminLeads.body.inquiries || rAdminLeads.body.data || [];
    assert(
      rAdminLeads.statusCode === 200 &&
      Array.isArray(inquiriesList) &&
      inquiriesList.some((i) => i.id === createdInquiry.id),
      'GET /api/v1/admin/property-inquiries returns CRM leads for authorized staff',
      rAdminLeads.durationMs
    );

    // 9. Admin Lead Status Transition & Staff Assignment
    const rUpdateLead = await request(`/api/v1/admin/property-inquiries/${createdInquiry.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        status: 'contacted',
        assignedStaffId: 'staff-vikram-joshi',
        notes: 'Client reached via telephone. Scheduled site inspection on Saturday.',
      },
    });
    const updatedInquiry = rUpdateLead.body.data;
    assert(
      rUpdateLead.statusCode === 200 &&
      updatedInquiry &&
      updatedInquiry.status === 'contacted',
      'PATCH /api/v1/admin/property-inquiries/:id updates follow-up status and assigned advisor',
      rUpdateLead.durationMs
    );

    // 10. Admin Plot Status Update (Reserve / Mark Under Offer)
    const rUpdatePlot = await request(`/api/v1/admin/plots/${targetPlot.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        availabilityStatus: 'under_offer',
        notes: 'Token advance received under review.',
      },
    });
    const updatedPlot = rUpdatePlot.body.data;
    assert(
      rUpdatePlot.statusCode === 200 &&
      updatedPlot &&
      (updatedPlot.availabilityStatus === 'under_offer' || updatedPlot.availability_status === 'under_offer'),
      'PATCH /api/v1/admin/plots/:id updates parcel availability status atomically',
      rUpdatePlot.durationMs
    );

    // 11. Admin Map / 3D Asset Registration
    const assetPayload = {
      projectId: firstProject.id,
      assetType: '3d_model',
      title: 'Gandhidham Hub 3D Architectural Exterior Model',
      url: '/uploads/models/gandhidham_hub_v1.glb',
      storageKey: 'models/gandhidham_hub_v1.glb',
      format: 'glb',
      fileSizeBytes: 4892010,
      coordinateReferenceSystem: 'EPSG:4326',
      version: 1,
    };
    const rAsset = await request('/api/v1/admin/assets', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: assetPayload,
    });
    const createdAsset = rAsset.body.data;
    assert(
      rAsset.statusCode === 201 &&
      createdAsset &&
      (createdAsset.assetType === '3d_model' || createdAsset.asset_type === '3d_model'),
      'POST /api/v1/admin/assets securely registers 3D viewer / geographic assets',
      rAsset.durationMs
    );

    // 12. Security: Unauthorized access to Admin endpoints blocked
    const rUnauth = await request('/api/v1/admin/property-inquiries');
    assert(
      rUnauth.statusCode === 401,
      'Security: Unauthenticated request to /api/v1/admin/* rejected with 401 Unauthorized',
      rUnauth.durationMs
    );

  } catch (err) {
    console.error('💥 Test execution error:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    console.log(`\n----------------------------------------------------`);
    console.log(`📊 Real Estate Test Summary: ${passedTests}/${totalTests} tests passed`);
    console.log(`----------------------------------------------------\n`);
  }
};

runTests();
