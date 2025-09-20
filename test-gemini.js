// Test Gemini API directly
async function testGeminiAPI() {
  const API_KEY = 'AIzaSyBkTjnnBCNgXV0Oy7ahKsfwDYsijKQEwwU';

  try {
    console.log('Testing Gemini API directly...');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Hello, this is a test message!' }] }],
        }),
      }
    );

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));

    if (data.candidates && data.candidates[0]) {
      const text = data.candidates[0].content?.parts?.[0]?.text;
      console.log('Extracted text:', text);
    } else {
      console.log('No candidates in response');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testGeminiAPI();