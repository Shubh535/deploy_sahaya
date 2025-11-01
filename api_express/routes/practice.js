const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const requireAuth = require('../middleware/auth');
const { chatWithGemini } = require('../gcloud');
const db = admin.firestore();

// POST /practice/simulate - AI interviewer simulation (protected) - BASIC VERSION
router.post('/simulate', requireAuth, async (req, res) => {
  const { scenario, userInput, history = [], userId } = req.body;
  if (!scenario || !userInput) {
    return res.status(400).json({ error: 'Missing scenario or userInput' });
  }
  
  const vertexService = require('../vertexService');
  
  // Compose system prompt for interviewer and feedback
  let interviewerPrompt = '';
  let feedbackPrompt = '';
  if (scenario === 'assertive') {
    interviewerPrompt = `You are a close, supportive friend who really enjoys spending time together. You're caught a bit off guard by your friend saying they need alone time - you might feel slightly hurt or worried that something's wrong. Respond with 3-4 sentences that show your genuine feelings but also care about your friend's wellbeing. Ask thoughtful follow-up questions to understand if they're okay, and express your emotions honestly but gently. Be conversational and authentic - real friends don't give perfect responses.

User said: "${userInput}"

Respond naturally as this friend would:`;
    
    feedbackPrompt = `You are an experienced mental wellness coach analyzing how this person expressed their need for alone time. 

User's exact words: "${userInput}"

Based on their SPECIFIC words and phrasing, provide detailed, personalized feedback (3-4 sentences minimum). Quote or reference their actual language. 

Analyze these aspects:
1. How assertively they stated their needs (did they use "I" statements? were they direct? did they own their needs?)
2. How kindly/empathetically they considered the other person's feelings (did they acknowledge the relationship? show appreciation?)
3. Whether they gave enough context or explanation (did they explain WHY they need alone time?)

Then give ONE specific, actionable suggestion for improvement based on what you observed in their actual response.

Be constructive, encouraging, and reference what they actually said. Make your feedback unique to this conversation.`;
    
  } else if (scenario === 'boundaries') {
    interviewerPrompt = `You are a classmate who's been struggling to keep up with coursework and was really hoping to get these notes. You feel a bit desperate about the upcoming exam. When your classmate sets a boundary, you might feel disappointed, maybe slightly frustrated. Respond with 3-4 sentences showing your genuine reaction - maybe a hint of disappointment, possibly a question about why or if there's an alternative, but ultimately respect their decision if they're firm. Be authentic - show real emotions but don't be hostile.

User said: "${userInput}"

Respond naturally as this classmate would:`;
    
    feedbackPrompt = `You are a mental wellness coach analyzing how clearly and respectfully this person set a boundary.

User's exact words: "${userInput}"

Based on their EXACT words, provide 3-4 sentences of detailed, personalized feedback. Reference their specific phrasing. 

Evaluate:
1. How clearly they stated the boundary (was it direct or vague? did they say "no" explicitly or imply it?)
2. How respectfully they communicated it (did they acknowledge the other person's needs? were they kind but firm?)
3. Whether they stayed firm without being aggressive (did they offer alternatives? did they over-explain or apologize excessively?)

Give ONE actionable suggestion tied directly to what you observed in their specific response.

Quote their actual words when giving feedback. Make it unique to what they said.`;
    
  } else if (scenario === 'help') {
    interviewerPrompt = `You are a compassionate teacher who has noticed this student seems stressed lately. You genuinely care about your students' wellbeing while also maintaining academic standards. When the student asks for an extension, respond with 3-4 thoughtful sentences. Ask caring, specific questions about what's going on and what support they might need. Show warmth and understanding, mention you've noticed they seem overwhelmed, and indicate you're considering their request thoughtfully. Be conversational and human - share brief observations about their recent performance.

User said: "${userInput}"

Respond warmly as this teacher would:`;
    
    feedbackPrompt = `You are a mental wellness coach evaluating how effectively this person asked for help.

User's exact words: "${userInput}"

Analyze their SPECIFIC words carefully. Write 3-4 sentences minimum that:

1. Assess whether they clearly explained their situation and why they need help (did they give context? was it specific or vague?)
2. Note if they showed appropriate vulnerability while maintaining responsibility (did they blame others or own their situation?)
3. Evaluate if they were specific about what help they need (did they ask for a concrete solution?)

Reference their actual language and phrasing.

End with ONE specific, actionable tip for making requests for help more effective and self-compassionate, based on what you observed in their actual response.

Quote what they said to make feedback personalized.`;
    
  } else if (scenario === 'feedback') {
    interviewerPrompt = `You are a mentor who has invested time in this person's development and wants to see them grow. You've given them constructive feedback about something specific. Respond to their reaction with 3-4 sentences that show you're paying attention to how they're receiving it. If they're defensive, gently probe deeper. If they're receptive, expand on your feedback with a concrete example. Show you care about their success and appreciate thoughtful responses to criticism. Be encouraging but maintain the importance of the feedback.

User said: "${userInput}"

Respond thoughtfully as this mentor would:`;
    
    feedbackPrompt = `You are a mental wellness coach analyzing how this person received constructive criticism.

User's exact words: "${userInput}"

Based on their ACTUAL response, write 3-4 detailed sentences minimum evaluating:

1. How calmly they processed the feedback (defensive language? open language? thoughtful questions?)
2. Whether they asked clarifying questions or just accepted/rejected it (did they engage with the feedback?)
3. If they showed growth mindset or self-compassion (did they focus on learning or beating themselves up?)

Quote their specific words and phrases.

Provide ONE actionable strategy to help them receive feedback even more constructively, tailored to patterns you observed in what they actually said.

Make feedback unique by referencing their exact language.`;
    
  } else {
    interviewerPrompt = `You are a thoughtful, supportive conversation partner engaged in a meaningful discussion. Respond authentically with 3-4 sentences that show you're genuinely listening and thinking about what was said. Ask insightful follow-up questions, share relevant brief thoughts or reactions, and keep the conversation flowing naturally. Be warm, empathetic, and human in your response.

User said: "${userInput}"

Respond naturally:`;
    
    feedbackPrompt = `You are a mental wellness coach.

User said: "${userInput}"

Analyze this person's communication based on their SPECIFIC words. Write 3-4 sentences of detailed, personalized feedback referencing what they actually said. Identify clear strengths and areas for growth based on their actual language and approach.

End with ONE concrete, actionable suggestion for improving their communication.

Quote their words to make feedback personalized.`;
  }

  try {
    // AI Interviewer response using vertexService for longer, more descriptive responses
    console.log('Generating AI interviewer response...');
    const aiResponseText = await vertexService.generateText(interviewerPrompt);
    
    // AI Feedback using vertexService for personalized, specific feedback
    console.log('Generating personalized feedback...');
    const feedbackText = await vertexService.generateText(feedbackPrompt);
    
    res.json({
      ai: aiResponseText.trim(),
      feedback: feedbackText.trim(),
    });
  } catch (error) {
    console.error('Practice simulation error:', error);
    res.status(500).json({ error: error.message || 'AI simulation failed' });
  }
});

// POST /practice/simulate-enhanced - Enhanced AI conversation simulation with detailed feedback
router.post('/simulate-enhanced', requireAuth, async (req, res) => {
  const { uid } = req.user;
  const { scenario, userInput, conversationHistory, turnCount } = req.body;
  
  const vertexService = require('../vertexService');
  
  try {
    // Build conversation context
    const historyContext = (conversationHistory || []).map((h, idx) => 
      `Turn ${idx + 1}:\nUser: ${h.user}\nAI: ${h.ai}`
    ).join('\n\n');
    
    // Scenario-specific AI personality and context
    const scenarioPrompts = {
      'job-interview': `You are a senior hiring manager at a leading tech company. You've conducted hundreds of interviews and know how to make candidates comfortable while assessing their skills deeply. You're professional, insightful, and genuinely interested in understanding the candidate's experience and thought process. Share brief anecdotes from your company culture when relevant.`,
      
      'college-admission': `You are an experienced college admissions officer who truly cares about finding the right fit between students and your institution. You're warm, encouraging, and ask thoughtful questions that help students showcase their authentic selves. You genuinely want to understand their passions, challenges they've overcome, and how they'll contribute to campus life.`,
      
      'parent-talk': `You are a loving parent who has high hopes for your child but also remembers the pressures of growing up. You express your concerns with care, share your own life experiences when relevant, and try to understand your child's perspective. You're worried but also willing to listen and find middle ground.`,
      
      'class-presentation': `You are an engaged classmate who genuinely finds the topic interesting. You ask thoughtful questions that show you've been paying attention, and you're curious to learn more. Sometimes you relate the content to your own experiences or knowledge.`,
      
      'project-pitch': `You are an experienced investor who has seen countless pitches. You're intrigued but naturally skeptical - you ask probing questions about market size, competition, financial projections, and team capabilities. You appreciate passion but need to see solid thinking and planning. Sometimes you share brief insights from your portfolio companies.`,
      
      'conflict-resolution': `You are a team member who has your own perspective on the conflict but also wants to find a solution that works for everyone. You express your feelings honestly but also show willingness to understand the other side. You reference specific incidents but avoid personal attacks.`,
      
      'saying-no': `You are someone making a genuine request who will naturally feel disappointed if told no, but you understand boundaries. You might express your disappointment or ask for an alternative, but you ultimately respect the other person's decision. Show genuine emotions but remain respectful.`,
      
      'extension-request': `You are a professor who balances compassion for student wellbeing with maintaining academic standards. You've seen many situations over the years and can often tell when a student is genuinely struggling. Ask caring questions about their situation and show you're considering their request thoughtfully.`,
      
      'group-project': `You are a responsible team member who wants the project to succeed. You have ideas about task division and are concerned about meeting deadlines. You try to be diplomatic but also need to ensure everyone pulls their weight. Reference the project requirements and timeline in your responses.`,
      
      'friend-support': `You are a close friend going through a genuinely difficult time. You're vulnerable, sharing your real feelings and struggles. You appreciate when your friend shows they understand and care. You might tear up, express frustration, or show hope depending on what your friend says.`,
      
      'assertive': `You are a close friend who genuinely enjoys spending time together. You're a bit surprised by the request for alone time and might feel slightly hurt, but you ultimately care about your friend's wellbeing. Ask gentle questions to understand if everything is okay.`,
      
      'boundaries': `You are a classmate who's been struggling to keep up with coursework and was hoping to get notes. You might feel disappointed or defensive initially, but you can understand and respect boundaries when they're communicated clearly and kindly.`,
      
      'help': `You are a compassionate teacher who notices when students are struggling. You've taught for years and understand the pressures students face. You're willing to help but also want to ensure students are learning to manage their responsibilities. Ask caring, specific questions.`,
      
      'feedback-response': `You are a mentor who has invested time in this person's development. You're giving constructive feedback because you see their potential and want them to grow. You're direct but kind, and you appreciate when they respond thoughtfully to criticism. Share specific examples when relevant.`
    };
    
    const prompt = `${scenarioPrompts[scenario] || 'You are a thoughtful conversation partner who responds authentically and shows genuine interest in the discussion.'}

Previous conversation:
${historyContext}

User's latest response: "${userInput}"

IMPORTANT Instructions:
1. Stay deeply in character - respond as this person would ACTUALLY respond in real life
2. Write 3-4 sentences minimum - be descriptive and conversational, not brief
3. Include natural human elements: emotions, pauses, personal touches, brief anecdotes or examples when appropriate
4. Ask thoughtful follow-up questions that show you're engaged and thinking critically
5. Show personality - use appropriate expressions, vary sentence structure, include reactions
6. Reference specific details from what the user said to show you're listening carefully
7. Be authentic - real people don't give perfect, polished responses. Show warmth, curiosity, concern, or enthusiasm as appropriate
8. Move the conversation forward meaningfully while maintaining natural flow

DO NOT be overly formal or robotic. DO speak like a real human having a genuine conversation.

Provide your response (conversational dialogue only, no meta-commentary):`;

    console.log(`Enhanced practice simulation for ${scenario}, turn ${turnCount || 0 + 1}`);
    const aiResponse = await vertexService.generateText(prompt);
    
    console.log('AI response generated:', aiResponse.substring(0, 100));
    res.status(200).json({ aiResponse: aiResponse.trim() });
    
  } catch (err) {
    console.error('Enhanced practice simulation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /practice/feedback-enhanced - Get detailed multi-dimensional feedback
router.post('/feedback-enhanced', requireAuth, async (req, res) => {
  const { uid } = req.user;
  const { scenario, conversationHistory } = req.body;
  
  const vertexService = require('../vertexService');
  
  try {
    // Build full conversation for analysis
    const fullConversation = (conversationHistory || []).map((h, idx) => 
      `Turn ${idx + 1}:\nUser: ${h.user}\nAI Interviewer: ${h.ai}`
    ).join('\n\n');
    
    const prompt = `You are an expert communication coach with 20+ years of experience analyzing professional and interpersonal conversations. You specialize in helping people improve their communication skills through detailed, personalized feedback.

SCENARIO CONTEXT: "${scenario}"

COMPLETE CONVERSATION TRANSCRIPT:
${fullConversation}

YOUR TASK: Analyze this SPECIFIC conversation deeply and provide genuinely personalized feedback based on what you actually observe in the user's responses.

CRITICAL REQUIREMENTS:
1. Quote or reference SPECIFIC phrases the user said when giving feedback
2. Base ALL scores on the ACTUAL content of this conversation, not generic assumptions
3. Make feedback UNIQUE to this conversation - avoid generic phrases
4. Consider the scenario context when evaluating appropriateness
5. Be constructive but honest - vary scores realistically (not all 7s)
6. Suggestions must be ACTIONABLE and tied to observed patterns in this conversation

Provide detailed feedback in this EXACT JSON format:
{
  "overall": "Write 3-4 sentences of personalized overall assessment. Start with a specific strength you observed, then mention an area for growth, and end encouragingly. Reference actual conversation content.",
  "empathy": {
    "score": <actual_score_1_to_10>,
    "feedback": "One detailed sentence analyzing empathy based on SPECIFIC examples from their responses. Quote phrases if relevant."
  },
  "tone": {
    "score": <actual_score_1_to_10>,
    "feedback": "One detailed sentence about tone appropriateness in THIS conversation. Reference how they handled specific moments."
  },
  "clarity": {
    "score": <actual_score_1_to_10>,
    "feedback": "One detailed sentence about communication clarity. Mention specific parts that were clear or unclear."
  },
  "confidence": {
    "score": <actual_score_1_to_10>,
    "feedback": "One detailed sentence about confidence level based on language patterns and content depth you observed."
  },
  "strengths": [
    "SPECIFIC strength with example: 'Your use of X phrase showed Y...'",
    "SPECIFIC strength: 'When you mentioned X, it demonstrated...'",
    "SPECIFIC strength: 'The way you handled X was particularly effective because...'"
  ],
  "areasToImprove": [
    "SPECIFIC area: 'Consider how you could have expanded on X when discussing...'",
    "SPECIFIC area: 'Your response to X might have been stronger if you had...'"
  ],
  "suggestions": [
    "ACTIONABLE tip based on what you observed: 'Next time when faced with X situation, try...'",
    "SPECIFIC technique: 'To improve the Y aspect you showed in your response about X, consider...'",
    "PRACTICAL advice: 'I noticed you did X, which was good. You could enhance this by...'"
  ],
  "xpGained": <15_to_50_based_on_actual_performance>,
  "badgeEarned": <badge_id_or_null>
}

SCORING RUBRIC (Be honest and realistic):
- 9-10: Exceptional - showed mastery in this conversation
- 7-8: Very good - strong performance with minor areas to polish
- 5-6: Good - solid attempt with clear room for improvement  
- 3-4: Needs work - basic understanding but significant gaps
- 1-2: Struggling - fundamental issues to address

XP CALCULATION (Based on this actual performance):
- Base: 15-20 points for genuine effort and completion
- +2 points for each score of 7-8 in any dimension
- +5 points for each score of 9-10 in any dimension
- +5 bonus if average score is 8+
- +10 bonus if all scores are 9+

BADGES (Award ONLY if truly earned in THIS conversation):
- "first-practice": Only if this appears to be their very first session
- "empathy-master": Only if empathy score is genuinely 9-10
- "clarity-champion": Only if clarity score is genuinely 9-10  
- "confident-communicator": Only if confidence score is genuinely 9-10
- "perfect-session": Only if ALL FOUR scores are 9-10
- null if no badge earned this session

Remember: Your feedback will help this person grow. Be specific, be honest, be encouraging. Reference what you actually saw in their responses.

Return ONLY the JSON object, no markdown formatting, no additional text:`;

    console.log('Generating detailed enhanced feedback...');
    const response = await vertexService.generateText(prompt);
    
    // Clean and parse JSON
    let cleanResponse = response.trim();
    if (cleanResponse.includes('```')) {
      cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    
    let feedback;
    try {
      feedback = JSON.parse(cleanResponse);
      console.log('Feedback parsed successfully, XP:', feedback.xpGained);
    } catch (parseErr) {
      console.error('Failed to parse feedback JSON:', parseErr);
      console.error('Raw response:', cleanResponse.substring(0, 200));
      
      // Fallback feedback with reasonable defaults
      feedback = {
        overall: "Great effort in this practice session! You demonstrated good communication skills and engagement with the scenario.",
        empathy: {
          score: 7,
          feedback: "You showed understanding of the other person's perspective and responded with appropriate emotional awareness."
        },
        tone: {
          score: 7,
          feedback: "Your tone was generally appropriate for the situation, balancing professionalism with authenticity."
        },
        clarity: {
          score: 7,
          feedback: "Your points were clearly communicated with good structure and logical flow."
        },
        confidence: {
          score: 6,
          feedback: "You expressed yourself with reasonable confidence, though there's room to be more assertive in key moments."
        },
        strengths: [
          "Active engagement throughout the conversation",
          "Appropriate emotional responses to the scenario",
          "Clear articulation of your thoughts and ideas"
        ],
        areasToImprove: [
          "Consider asking more clarifying questions to deepen the dialogue",
          "Use more specific examples to illustrate your points"
        ],
        suggestions: [
          "Practice using the STAR method (Situation, Task, Action, Result) for more structured responses",
          "Incorporate more empathetic phrases like 'I understand that...' or 'From your perspective...'",
          "Take brief pauses to gather thoughts before responding to complex questions"
        ],
        xpGained: 22,
        badgeEarned: null
      };
    }
    
    res.status(200).json({ feedback });
    
  } catch (err) {
    console.error('Enhanced feedback generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /practice/progress - Get user's practice progress and statistics
router.get('/progress', requireAuth, async (req, res) => {
  const { uid } = req.user;
  
  try {
    const doc = await db.collection('practice_progress').doc(uid).get();
    
    if (!doc.exists) {
      // Return default progress for new users
      return res.status(200).json({
        progress: {
          level: 1,
          xp: 0,
          badges: [],
          skillLevels: {
            empathy: 0,
            clarity: 0,
            confidence: 0,
            tone: 0
          },
          completedScenarios: [],
          totalPractices: 0,
          totalXP: 0,
          created: new Date().toISOString()
        }
      });
    }
    
    res.status(200).json({ progress: doc.data() });
    
  } catch (err) {
    console.error('Error fetching practice progress:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /practice/progress - Update user's practice progress after session
router.post('/progress', requireAuth, async (req, res) => {
  const { uid } = req.user;
  const { feedback, scenario, progress } = req.body;
  
  try {
    const progressRef = db.collection('practice_progress').doc(uid);
    
    // If frontend sends complete progress object, just save it
    if (progress) {
      await progressRef.set(progress, { merge: true });
      return res.json({ success: true, progress });
    }
    
    // Otherwise, calculate from feedback (legacy format)
    const doc = await progressRef.get();
    
    // Get current progress or initialize
    const current = doc.exists ? doc.data() : {
      level: 1,
      xp: 0,
      badges: [],
      skillLevels: { empathy: 0, clarity: 0, confidence: 0, tone: 0 },
      completedScenarios: [],
      totalPractices: 0,
      totalXP: 0
    };
    
    // Update XP and level
    const newXP = current.xp + (feedback?.xpGained || 20);
    const newLevel = Math.floor(newXP / 100) + 1;
    const totalXP = current.totalXP + (feedback?.xpGained || 20);
    
    // Update skill levels (incremental improvement based on feedback scores)
    const updatedSkills = {
      empathy: Math.min(100, current.skillLevels.empathy + (feedback.empathy?.score || 5) / 10),
      clarity: Math.min(100, current.skillLevels.clarity + (feedback.clarity?.score || 5) / 10),
      confidence: Math.min(100, current.skillLevels.confidence + (feedback.confidence?.score || 5) / 10),
      tone: Math.min(100, current.skillLevels.tone + (feedback.tone?.score || 5) / 10)
    };
    
    // Add scenario to completed list if not already there
    const completedScenarios = current.completedScenarios || [];
    if (scenario && !completedScenarios.includes(scenario)) {
      completedScenarios.push(scenario);
    }
    
    // Check for new badge unlocks
    const newBadges = [];
    if (current.totalPractices === 0) {
      newBadges.push('first-practice');
    }
    if (feedback.empathy?.score >= 9 && !current.badges.includes('empathy-master')) {
      newBadges.push('empathy-master');
    }
    if (feedback.clarity?.score >= 9 && !current.badges.includes('clarity-champion')) {
      newBadges.push('clarity-champion');
    }
    if (feedback.confidence?.score >= 9 && !current.badges.includes('confident-communicator')) {
      newBadges.push('confident-communicator');
    }
    if (feedback.badgeEarned && !current.badges.includes(feedback.badgeEarned)) {
      newBadges.push(feedback.badgeEarned);
    }
    
    const allBadges = [...new Set([...current.badges, ...newBadges])];
    
    // Save updated progress
    const updatedProgress = {
      level: newLevel,
      xp: newXP % 100, // XP within current level
      totalXP,
      badges: allBadges,
      skillLevels: updatedSkills,
      completedScenarios,
      totalPractices: current.totalPractices + 1,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await progressRef.set(updatedProgress, { merge: true });
    
    console.log('Practice progress updated for', uid, '- Level:', newLevel, 'XP:', newXP);
    res.status(200).json({ 
      success: true, 
      progress: updatedProgress,
      newBadgesUnlocked: newBadges 
    });
    
  } catch (err) {
    console.error('Error updating practice progress:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /practice/history - Get user's practice session history
router.get('/history', requireAuth, async (req, res) => {
  const { uid } = req.user;
  const { limit = 20 } = req.query;
  
  try {
    const snapshot = await db.collection('practice_sessions')
      .where('uid', '==', uid)
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit))
      .get();
    
    const history = [];
    snapshot.forEach(doc => {
      history.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.status(200).json({ history });
    
  } catch (err) {
    console.error('Error fetching practice history:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /practice/session/save - Save a practice session
router.post('/session/save', requireAuth, async (req, res) => {
  const { uid } = req.user;
  const { scenario, conversationHistory, feedback } = req.body;
  
  try {
    const sessionData = {
      uid,
      scenario,
      conversationHistory,
      feedback,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await db.collection('practice_sessions').add(sessionData);
    
    console.log('Practice session saved:', docRef.id);
    res.status(200).json({ success: true, sessionId: docRef.id });
    
  } catch (err) {
    console.error('Error saving practice session:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
