// Test the AI chat functionality
async function testAPI() {
  try {
    console.log('Testing AI chat...');
    const response = await fetch('http://localhost:4001/api/mitra/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hello, I need help with stress management!' })
    });
    
    console.log('AI response status:', response.status);
    if (response.ok) {
      const data = await response.json();
      console.log('AI chat working! ✅');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      const errorData = await response.text();
      console.log('AI response error:', errorData);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();