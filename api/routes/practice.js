const express = require('express');
const router = express.Router();

const requireAuth = require('../middleware/auth');

const { chatWithGemini } = require('../gcloud');

// POST /practice/simulate - AI interviewer simulation (protected)
router.post('/simulate', requireAuth, async (req, res) => {
  const { scenario, userInput, history = [], userId } = req.body;
  if (!scenario || !userInput) {
    return res.status(400).json({ error: 'Missing scenario or userInput' });
  }
  // Compose system prompt for interviewer and feedback
  let interviewerPrompt = '';
  let feedbackPrompt = '';
  if (scenario === 'assertive') {
    interviewerPrompt = `You are a supportive friend. Respond to the user's attempt to express their need for alone time. Ask a gentle follow-up question.`;
    feedbackPrompt = `You are a mental wellness coach. Give specific, actionable feedback on how assertively and kindly the user expressed their needs. Suggest one way to improve.`;
  } else if (scenario === 'boundaries') {
    interviewerPrompt = `You are a classmate. Respond to the user's attempt to set a boundary about sharing notes. Ask a follow-up or express your feelings.`;
    feedbackPrompt = `You are a mental wellness coach. Give feedback on how clearly and respectfully the user set a boundary. Suggest one way to improve.`;
  } else if (scenario === 'help') {
    interviewerPrompt = `You are a teacher. Respond to the user's request for an extension due to overwhelm. Ask a clarifying or supportive question.`;
    feedbackPrompt = `You are a mental wellness coach. Give feedback on how effectively the user asked for help. Suggest one way to make the request even more effective or self-compassionate.`;
  } else if (scenario === 'feedback') {
    interviewerPrompt = `You are a mentor. Respond to the user's reaction to constructive criticism. Ask a follow-up or offer support.`;
    feedbackPrompt = `You are a mental wellness coach. Give feedback on how calmly and constructively the user received feedback. Suggest one way to improve their response.`;
  } else {
    interviewerPrompt = `You are a supportive conversation partner. Respond empathetically to the user's message.`;
    feedbackPrompt = `You are a mental wellness coach. Give feedback on the user's communication and suggest one way to improve.`;
  }

  try {
    // AI Interviewer response
    const aiRes = await chatWithGemini({
      message: `${interviewerPrompt}\n\nUser: ${userInput}`,
      mode: 'listener',
      history,
      userId,
    });
    // AI Feedback
    const fbRes = await chatWithGemini({
      message: `${feedbackPrompt}\n\nUser: ${userInput}`,
      mode: 'coach',
      history,
      userId,
    });
    res.json({
      ai: aiRes.text,
      feedback: fbRes.text,
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'AI simulation failed' });
  }
});

module.exports = router;
