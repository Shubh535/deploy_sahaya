// Test the AI chat functionality
async function testAPI() {
  try {
    console.log('Testing server root...');
    const response = await fetch('http://localhost:4001/');
    console.log('Root response status:', response.status);
    const text = await response.text();
    console.log('Root response:', text);
    
    console.log('Testing AI chat...');
    console.log('Making request to http://localhost:4001/api/mitra/test');
    const response2 = await fetch('http://localhost:4001/api/mitra/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hello, I need help with stress management!' })
    });
    
    console.log('AI response status:', response2.status);
    if (response2.ok) {
      const data = await response2.json();
      console.log('AI chat working! ✅');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      const errorData = await response2.text();
      console.log('AI response error:', errorData);
    }
  } catch (error) {
    console.error('Fetch error:', error.message);
  }
}

testAPI();