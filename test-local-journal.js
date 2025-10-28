// Simple local test for journal functionality
async function testJournalLocally() {
  const baseUrl = 'http://localhost:3002';

  console.log('🧪 Testing Journal AI Integration Locally...\n');

  try {
    // Test 1: Reflection Prompts
    console.log('1. Testing Reflection Prompts...');
    const promptsResponse = await fetch(`${baseUrl}/api/journal/reflection-prompts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-dev-auth': 'allow'
      },
      body: JSON.stringify({ type: 'daily' })
    });

    if (promptsResponse.ok) {
      const promptsData = await promptsResponse.json();
      console.log('✅ Prompts API: SUCCESS');
      console.log(`   Generated ${promptsData.prompts?.length || 0} prompts`);
      if (promptsData.prompts && promptsData.prompts.length > 0) {
        console.log(`   Sample: "${promptsData.prompts[0]}"`);
      }
    } else {
      console.log('❌ Prompts API: FAILED');
      console.log(`   Status: ${promptsResponse.status}`);
      console.log(`   Response: ${await promptsResponse.text()}`);
    }

    // Test 2: AI Insights
    console.log('\n2. Testing AI Insights...');
    const insightsResponse = await fetch(`${baseUrl}/api/journal/insights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-dev-auth': 'allow'
      },
      body: JSON.stringify({
        type: 'daily',
        responses: [
          'Today I feel grateful for my health and family support',
          'I was challenged by a work deadline but completed it successfully',
          'I learned that taking breaks helps me stay focused'
        ],
        emotionalState: { before: 6, emotions: ['grateful', 'accomplished'] }
      })
    });

    if (insightsResponse.ok) {
      const insightsData = await insightsResponse.json();
      console.log('✅ Insights API: SUCCESS');
      console.log(`   Generated ${insightsData.insights?.length || 0} insights`);
      if (insightsData.insights && insightsData.insights.length > 0) {
        console.log(`   Sample: "${insightsData.insights[0]}"`);
      }
    } else {
      console.log('❌ Insights API: FAILED');
      console.log(`   Status: ${insightsResponse.status}`);
      console.log(`   Response: ${await insightsResponse.text()}`);
    }

    // Test 3: Session Saving
    console.log('\n3. Testing Session Saving...');
    const sessionData = {
      id: `test_${Date.now()}`,
      type: 'daily',
      prompts: ['Test prompt 1', 'Test prompt 2'],
      responses: ['Test response 1', 'Test response 2'],
      insights: ['Test insight 1', 'Test insight 2'],
      emotionalState: { before: 5, after: 7, emotions: ['test'] },
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };

    const saveResponse = await fetch(`${baseUrl}/api/journal/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-dev-auth': 'allow'
      },
      body: JSON.stringify(sessionData)
    });

    if (saveResponse.ok) {
      const saveResult = await saveResponse.json();
      console.log('✅ Session Save: SUCCESS');
      console.log(`   Session ID: ${saveResult.sessionId}`);
    } else {
      console.log('❌ Session Save: FAILED');
      console.log(`   Status: ${saveResponse.status}`);
      console.log(`   Response: ${await saveResponse.text()}`);
    }

    console.log('\n🎉 Local Testing Complete!');
    console.log('\n📊 Summary:');
    console.log('   • Server: Running on port 3002');
    console.log('   • Firebase: Configured with service account key');
    console.log('   • Authentication: Dev bypass enabled');
    console.log('   • AI Integration: Ready for testing');

  } catch (error) {
    console.log('\n❌ Test Error:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   • Make sure Next.js server is running on port 3002');
    console.log('   • Check Firebase service account key is valid');
    console.log('   • Verify GEMINI_API_KEY is set');
    console.log('   • Check server logs for detailed errors');
  }
}

testJournalLocally();