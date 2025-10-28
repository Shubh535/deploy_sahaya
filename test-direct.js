// Test chatWithGemini directly
require('dotenv').config({ path: './.env.local' });

const { chatWithGemini } = require('./api_express/gcloud');

async function testDirect() {
  try {
    console.log('Testing chatWithGemini directly...');
    const result = await chatWithGemini({
      message: 'Hello, I need help with stress management!',
      mode: 'listener',
      language: 'en',
      history: [],
      userId: 'test-user'
    });
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

testDirect();