// Test Vertex AI functions directly
require('dotenv').config({ path: './.env.local' });

const { chatWithGemini, analyzeJournalEntry, emotionalReasoning } = require('./api_express/gcloud');

async function testVertexAI() {
  try {
    console.log('Testing chatWithGemini...');
    const chatResult = await chatWithGemini({
      message: 'Hello, I need help with stress management!',
      mode: 'listener',
      language: 'en',
      history: [],
      userId: 'test-user'
    });
    console.log('Chat result:', chatResult);

    console.log('Testing analyzeJournalEntry...');
    const journalResult = await analyzeJournalEntry({
      entry: 'I feel calm and grateful for my family.',
      language: 'en'
    });
    console.log('Journal result:', journalResult);

    console.log('Testing emotionalReasoning...');
    const emotionResult = await emotionalReasoning({
      text: 'I am feeling stressed about exams.',
      language: 'en'
    });
    console.log('Emotion result:', emotionResult);

  } catch (error) {
    console.error('Test error:', error);
  }
}

testVertexAI();