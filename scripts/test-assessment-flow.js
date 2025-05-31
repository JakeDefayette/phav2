#!/usr/bin/env node

/**
 * Test script to verify the complete assessment flow
 * Detects the correct port and tests the full pipeline
 */

// Try different ports where Next.js might be running
const POSSIBLE_PORTS = [3000, 3002, 3003];

async function detectServerPort() {
  for (const port of POSSIBLE_PORTS) {
    try {
      const response = await fetch(`http://localhost:${port}/api/health/supabase`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000) // 2 second timeout
      });
      
      if (response.ok || response.status < 500) {
        console.log(`✅ Found server running on port ${port}`);
        return port;
      }
    } catch (error) {
      continue; // Try next port
    }
  }
  
  throw new Error('No server found on any of the expected ports (3000, 3002, 3003)');
}

async function testCompleteAssessmentFlow() {
  console.log('🧪 Testing Complete Assessment Flow...\n');

  try {
    // Step 0: Detect server port
    console.log('🔍 Detecting server port...');
    const port = await detectServerPort();
    const API_BASE_URL = `http://localhost:${port}`;
    console.log(`📡 Using API base URL: ${API_BASE_URL}\n`);

    // Step 1: Check API health
    console.log('1️⃣ Checking API health...');
    const healthResponse = await fetch(`${API_BASE_URL}/api/health/supabase`);
    const healthData = await healthResponse.json();
    console.log('📊 API Health Status:', healthData);
    
    if (healthData.status === 'unhealthy') {
      console.log('⚠️  Supabase connection is unhealthy, but proceeding with test...');
    }

    // Step 2: Start an assessment
    console.log('\n2️⃣ Starting assessment...');
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
          email: `test-${Date.now()}@example.com`, // Unique email for each test
          phone: '555-0123',
        },
      }),
    });

    if (!startResponse.ok) {
      const errorText = await startResponse.text();
      throw new Error(`Start assessment failed: ${startResponse.status} ${startResponse.statusText}\nResponse: ${errorText}`);
    }

    const startResult = await startResponse.json();
    console.log('✅ Assessment started successfully:', {
      assessmentId: startResult.data.assessmentId,
      childId: startResult.data.childId,
      isAnonymous: startResult.data.isAnonymous,
    });

    const assessmentId = startResult.data.assessmentId;

    // Step 3: Submit survey responses
    console.log('\n3️⃣ Submitting survey responses...');
    const responses = [
      {
        question_id: '550e8400-e29b-41d4-a716-446655440011',
        response_value: ['stress', 'sleep_issues'],
      },
      {
        question_id: '550e8400-e29b-41d4-a716-446655440021', 
        response_value: ['headache', 'fatigue'],
      },
      {
        question_id: '550e8400-e29b-41d4-a716-446655440001',
        response_value: 'Test',
      },
      {
        question_id: '550e8400-e29b-41d4-a716-446655440002',
        response_value: 'Child',
      },
      {
        question_id: '550e8400-e29b-41d4-a716-446655440003',
        response_value: 8,
      },
      {
        question_id: '550e8400-e29b-41d4-a716-446655440004',
        response_value: 'male',
      },
    ];

    const brainOMeterScore = 75; // Example score

    const submitResponse = await fetch(
      `${API_BASE_URL}/api/assessment/${assessmentId}/submit`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responses,
          brainOMeterScore,
          practiceId: null, // For anonymous assessments
        }),
      }
    );

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      throw new Error(`Submit assessment failed: ${submitResponse.status} ${submitResponse.statusText}\nResponse: ${errorText}`);
    }

    const submitResult = await submitResponse.json();
    console.log('✅ Assessment submitted successfully:', submitResult.data);

    // Step 4: Test report download (if implemented)
    if (submitResult.data.reportId) {
      console.log('\n4️⃣ Testing report download...');
      const reportResponse = await fetch(
        `${API_BASE_URL}/api/reports/${submitResult.data.reportId}/download`
      );
      
      if (reportResponse.ok) {
        console.log('✅ Report download endpoint working');
      } else {
        console.log('⚠️  Report download endpoint returned:', reportResponse.status);
      }
    }

    console.log('\n🎉 Complete assessment flow test passed!');
    console.log('📋 Summary:');
    console.log(`   - Assessment ID: ${assessmentId}`);
    console.log(`   - Child ID: ${startResult.data.childId}`);
    console.log(`   - Brain-O-Meter Score: ${brainOMeterScore}`);
    console.log(`   - Report ID: ${submitResult.data.reportId || 'N/A'}`);
    console.log(`   - Anonymous: ${startResult.data.isAnonymous}`);

  } catch (error) {
    console.error('\n❌ Assessment flow test failed:');
    console.error('Error:', error.message);
    
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
    
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testCompleteAssessmentFlow();
}

module.exports = { testCompleteAssessmentFlow }; 