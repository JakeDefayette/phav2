#!/usr/bin/env node

/**
 * Test script to verify the report generation pipeline
 */

const API_BASE_URL = 'http://localhost:3000';

async function testReportPipeline() {
  console.log('🧪 Testing Report Generation Pipeline...\n');

  try {
    // Step 1: Start an assessment
    console.log('1️⃣ Starting assessment...');
    const startResponse = await fetch(`${API_BASE_URL}/api/assessment/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        childData: {
          firstName: 'Test',
          lastName: 'Child',
          dateOfBirth: '2015-01-01',
          gender: 'male',
        },
        parentData: {
          firstName: 'Test',
          lastName: 'Parent',
          email: 'test@example.com',
          phone: '555-0123',
        },
      }),
    });

    if (!startResponse.ok) {
      throw new Error(`Start assessment failed: ${startResponse.status} ${startResponse.statusText}`);
    }

    const startResult = await startResponse.json();
    console.log('✅ Assessment started:', {
      assessmentId: startResult.data.assessmentId,
      childId: startResult.data.childId,
    });

    const assessmentId = startResult.data.assessmentId;

    // Step 2: Submit survey responses
    console.log('\n2️⃣ Submitting survey responses...');
    const responses = [
      {
        question_id: '550e8400-e29b-41d4-a716-446655440011',
        response_value: ['stress', 'sleep_issues'],
        response_text: 'stress, sleep_issues',
      },
      {
        question_id: '550e8400-e29b-41d4-a716-446655440021',
        response_value: ['headache', 'fatigue'],
        response_text: 'headache, fatigue',
      },
      {
        question_id: '550e8400-e29b-41d4-a716-446655440001',
        response_value: 'Test',
        response_text: 'Test',
      },
      {
        question_id: '550e8400-e29b-41d4-a716-446655440002',
        response_value: 'Child',
        response_text: 'Child',
      },
      {
        question_id: '550e8400-e29b-41d4-a716-446655440003',
        response_value: 8,
        response_text: '8',
      },
      {
        question_id: '550e8400-e29b-41d4-a716-446655440004',
        response_value: 'male',
        response_text: 'male',
      },
    ];

    const submitResponse = await fetch(`${API_BASE_URL}/api/assessment/${assessmentId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        responses,
        brainOMeterScore: 75,
        practiceId: null,
      }),
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      throw new Error(`Submit assessment failed: ${submitResponse.status} ${submitResponse.statusText}\n${errorText}`);
    }

    const submitResult = await submitResponse.json();
    console.log('✅ Assessment submitted:', {
      assessmentId: submitResult.data.assessmentId,
      reportId: submitResult.data.reportId,
      status: submitResult.data.status,
      brainOMeterScore: submitResult.data.brainOMeterScore,
    });

    // Step 3: Test report retrieval
    console.log('\n3️⃣ Testing report retrieval...');
    const reportId = submitResult.data.reportId;
    
    const reportResponse = await fetch(`${API_BASE_URL}/api/reports/${reportId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!reportResponse.ok) {
      const errorText = await reportResponse.text();
      throw new Error(`Report retrieval failed: ${reportResponse.status} ${reportResponse.statusText}\n${errorText}`);
    }

    const reportResult = await reportResponse.json();
    console.log('✅ Report retrieved:', {
      reportId: reportResult.data.report.id,
      assessmentId: reportResult.data.report.assessment_id,
      hasContent: !!reportResult.data.report.content,
      hasCharts: !!reportResult.data.report.content?.charts,
    });

    // Step 4: Test PDF download
    console.log('\n4️⃣ Testing PDF download...');
    const downloadResponse = await fetch(`${API_BASE_URL}/api/reports/${reportId}/download`, {
      method: 'GET',
    });

    if (!downloadResponse.ok) {
      const errorText = await downloadResponse.text();
      console.warn(`⚠️ PDF download failed: ${downloadResponse.status} ${downloadResponse.statusText}\n${errorText}`);
    } else {
      const contentType = downloadResponse.headers.get('content-type');
      const contentLength = downloadResponse.headers.get('content-length');
      console.log('✅ PDF download successful:', {
        contentType,
        contentLength: contentLength ? `${contentLength} bytes` : 'unknown',
      });
    }

    console.log('\n🎉 Report pipeline test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Report pipeline test failed:', error.message);
    process.exit(1);
  }
}

// Run the test if called directly
if (require.main === module) {
  testReportPipeline();
}

module.exports = { testReportPipeline }; 