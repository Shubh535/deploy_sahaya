const { db } = require('../../firebase');
const admin = require('firebase-admin');

const MEMORY_FEATURE_FLAG = String(process.env.ENABLE_MEMORY || '').toLowerCase();
const MAX_RECENT_MESSAGES = 20;
const MAX_FACTS = 50;

const MEMORY_DISABLED_WARNING = 'Memory bank integration disabled; returning empty context.';

function isMemoryEnabled() {
  if (!MEMORY_FEATURE_FLAG) return true; // default on
  return ['1', 'true', 'yes', 'on'].includes(MEMORY_FEATURE_FLAG);
}

/**
 * Extract simple facts from user message using pattern matching
 */
function extractFactsFromMessage(message) {
  const facts = [];
  const text = message.toLowerCase();

  // Name extraction - must come after "my name is", "i'm", "i am", "call me"
  const nameMatch = text.match(/(?:my name is|(?:^|\s)i'm|(?:^|\s)i am|call me)\s+([a-z]+)(?:\s|$|[,.])/i);
  if (nameMatch && !['also', 'interested', 'from', 'studying'].includes(nameMatch[1])) {
    facts.push({ type: 'name', value: nameMatch[1], confidence: 0.9 });
  }

  // Field of study
  const studyMatch = text.match(/(?:i study|studying|major in|learning)\s+([a-z\s]+?)(?:\.|$|,)/i);
  if (studyMatch) {
    facts.push({ type: 'field', value: studyMatch[1].trim(), confidence: 0.8 });
  }

  // Interests - handle multiple patterns
  const loveMatch = text.match(/(?:i love)\s+([^.!?]+?)(?:\.|$)/i);
  const likeMatch = text.match(/(?:i like)\s+([^.!?]+?)(?:\.|$)/i);
  const interestedMatch = text.match(/(?:interested in|passionate about)\s+([^.!?]+?)(?:\.|$)/i);
  
  const interestMatches = [loveMatch, likeMatch, interestedMatch].filter(Boolean);
  
  interestMatches.forEach(match => {
    const interestText = match[1];
    // Split by commas and "and", then clean up
    const interests = interestText
      .split(/\s+and\s+|,\s*/)
      .map(i => i.trim())
      .filter(i => i && i.length > 2); // Filter out empty and very short strings
    
    interests.forEach(interest => {
      facts.push({ type: 'interest', value: interest, confidence: 0.7 });
    });
  });

  // Location
  const locationMatch = text.match(/(?:i'm from|i live in|from)\s+([a-z\s]+?)(?:\.|$|,)/i);
  if (locationMatch) {
    facts.push({ type: 'location', value: locationMatch[1].trim(), confidence: 0.8 });
  }

  return facts;
}

/**
 * Fetch user context from Firestore
 */
async function fetchUserContext(userId) {
  if (!userId) {
    return {
      facts: [],
      warnings: ['No userId supplied for memory fetch.']
    };
  }

  if (!isMemoryEnabled()) {
    return {
      facts: [],
      warnings: [MEMORY_DISABLED_WARNING]
    };
  }

  try {
    const userRef = db.collection('users').doc(userId);
    
    // Fetch profile and active context in parallel
    const [profileSnap, activeContextSnap] = await Promise.all([
      userRef.collection('memory').doc('profile').get(),
      userRef.collection('memory').doc('activeContext').get()
    ]);

    const profile = profileSnap.exists ? profileSnap.data() : {};
    const activeContext = activeContextSnap.exists ? activeContextSnap.data() : {};

    // Build facts array from profile
    const facts = [];
    if (profile.profile?.name) {
      facts.push(`Name: ${profile.profile.name}`);
    }
    if (profile.profile?.interests?.length) {
      facts.push(`Interests: ${profile.profile.interests.join(', ')}`);
    }
    if (profile.profile?.field) {
      facts.push(`Field of Study: ${profile.profile.field}`);
    }
    if (profile.profile?.location) {
      facts.push(`Location: ${profile.profile.location}`);
    }

    // Add custom facts from activeContext
    if (Array.isArray(activeContext.facts)) {
      facts.push(...activeContext.facts);
    }

    return {
      facts: facts.slice(0, MAX_FACTS),
      recentMessages: activeContext.recentMessages || [],
      userProfile: profile.profile || {},
      emotionalPattern: profile.emotionalPatterns || {},
      lastUpdatedAt: activeContext.updatedAt || null,
      warnings: []
    };
  } catch (error) {
    console.warn('[memoryAdapter] fetchUserContext failed:', error);
    return {
      facts: [],
      warnings: ['Memory fetch failed; using empty context.']
    };
  }
}

/**
 * Record conversation turn in Firestore
 */
async function recordConversationTurn({ userId, request, response, metadata = {} }) {
  if (!userId) {
    return {
      stored: false,
      warnings: ['No userId provided for memory write.']
    };
  }

  if (!isMemoryEnabled()) {
    return {
      stored: false,
      warnings: [MEMORY_DISABLED_WARNING]
    };
  }

  try {
    const userRef = db.collection('users').doc(userId);
    const now = new Date().toISOString();
    
    // Extract facts from user message
    const extractedFacts = extractFactsFromMessage(request.text || request);
    
    // Get current conversation ID (or create new one)
    const conversationId = metadata.conversationId || `conv_${Date.now()}`;
    const conversationRef = userRef.collection('conversations').doc(conversationId);
    
    // Prepare message pair
    const messagePair = [
      {
        role: 'user',
        text: typeof request === 'string' ? request : request.text,
        timestamp: now,
        emotion: metadata.emotionAnalysis?.emotion || null
      },
      {
        role: 'assistant',
        text: typeof response === 'string' ? response : response.text,
        timestamp: now,
        metadata: {
          model: metadata.gemini?.model || 'gemini-2.0-flash',
          mode: metadata.mode || 'listener'
        }
      }
    ];

    // Update conversation document
    const conversationUpdate = {
      conversationId,
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
      messages: admin.firestore.FieldValue.arrayUnion(...messagePair),
      metadata: {
        messageCount: admin.firestore.FieldValue.increment(2)
      }
    };
    
    // Only add extractedFacts if there are any
    if (extractedFacts.length > 0) {
      conversationUpdate.extractedFacts = admin.firestore.FieldValue.arrayUnion(...extractedFacts);
    }
    
    await conversationRef.set(conversationUpdate, { merge: true });

    // Update active context
    const activeContextRef = userRef.collection('memory').doc('activeContext');
    const activeContextSnap = await activeContextRef.get();
    const activeContext = activeContextSnap.exists ? activeContextSnap.data() : { recentMessages: [], facts: [] };
    
    // Add new messages and trim to last N
    const recentMessages = [...(activeContext.recentMessages || []), ...messagePair].slice(-MAX_RECENT_MESSAGES);
    
    await activeContextRef.set({
      userId,
      updatedAt: now,
      recentMessages,
      sessionContext: {
        currentTopic: metadata.topic || 'general',
        emotionalState: metadata.emotionAnalysis?.emotion?.label || 'calm',
        conversationGoal: metadata.mode || 'listener'
      },
      facts: activeContext.facts || []
    }, { merge: true });

    // Update profile with extracted facts
    if (extractedFacts.length > 0) {
      const profileRef = userRef.collection('memory').doc('profile');
      const profileSnap = await profileRef.get();
      const profile = profileSnap.exists ? profileSnap.data() : { profile: {}, emotionalPatterns: {} };
      
      // Merge extracted facts into profile
      extractedFacts.forEach(fact => {
        if (fact.type === 'name') profile.profile.name = fact.value;
        if (fact.type === 'field') profile.profile.field = fact.value;
        if (fact.type === 'location') profile.profile.location = fact.value;
        if (fact.type === 'interest') {
          profile.profile.interests = profile.profile.interests || [];
          if (!profile.profile.interests.includes(fact.value)) {
            profile.profile.interests.push(fact.value);
          }
        }
      });

      // Update emotional patterns
      if (metadata.emotionAnalysis?.emotion) {
        profile.emotionalPatterns.recentEmotions = profile.emotionalPatterns.recentEmotions || [];
        profile.emotionalPatterns.recentEmotions.push({
          label: metadata.emotionAnalysis.emotion.label,
          intensity: metadata.emotionAnalysis.emotion.intensity || 0,
          timestamp: now
        });
        // Keep only last 10 emotions
        profile.emotionalPatterns.recentEmotions = profile.emotionalPatterns.recentEmotions.slice(-10);
      }

      profile.updatedAt = now;
      profile.metadata = profile.metadata || {};
      profile.metadata.totalConversations = (profile.metadata.totalConversations || 0) + 1;
      profile.metadata.lastActive = now;

      await profileRef.set(profile, { merge: true });
    }

    return {
      stored: true,
      extractedFacts: extractedFacts.length,
      warnings: []
    };
  } catch (error) {
    console.warn('[memoryAdapter] recordConversationTurn failed:', error);
    return {
      stored: false,
      warnings: ['Memory write failed; payload not persisted.']
    };
  }
}

module.exports = {
  fetchUserContext,
  recordConversationTurn
};
