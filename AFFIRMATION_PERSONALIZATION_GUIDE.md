# Affirmation Personalization Guide

## How to Know if Affirmations are Personalized

### Visual Indicators (Frontend)

When you use the Affirmation feature, you'll see one of three badges below each affirmation:

#### 1. ✨ **AI Personalized with Your Context**
- **Color**: White badge with gradient glow
- **Meaning**: Gemini AI generated this affirmation using your recent Mitra conversation history
- **How it works**: The system analyzed your last 3 messages with Mitra to understand your emotional state, concerns, and needs
- **Best experience**: Chat with Mitra about your feelings before using affirmations!

#### 2. 🤖 **AI Generated**
- **Color**: Lighter white badge
- **Meaning**: Gemini AI generated this affirmation based on mood alone (no Mitra context)
- **How it works**: Uses mood-based prompts to generate relevant affirmations
- **Tip**: To get personalized affirmations, have a conversation with Mitra first!

#### 3. 💙 **Expertly Curated**
- **Color**: Subtle white badge
- **Meaning**: These are curated fallback affirmations (AI temporarily unavailable)
- **How it works**: Uses pre-written, mood-specific affirmations
- **Quality**: Still high-quality, just not AI-generated

---

## Backend Console Logs

When you generate affirmations, check the backend console for these logs:

```
✅ Returning 5 affirmations for mood: anxiety
📊 Personalization Status: YES - Used Mitra conversation context
🎯 Affirmation Source: Gemini AI
```

### What the logs mean:

**Personalization Status:**
- `YES - Used Mitra conversation context` → Truly personalized! ✨
- `NO - Generic (chat with Mitra for personalization)` → Generic mood-based

**Affirmation Source:**
- `Gemini AI` → Fresh AI-generated content
- `Backend Fallback` → Using curated affirmations

---

## How to Get Personalized Affirmations

### Step 1: Chat with Mitra
1. Go to `/mitra` page
2. Have a conversation about:
   - How you're feeling
   - What's bothering you
   - Your current challenges
   - Your goals or fears

Example conversation:
```
You: "I've been feeling really anxious about my upcoming presentation"
Mitra: "I understand that presentations can feel overwhelming..."
You: "Yeah, I'm worried I'll forget what to say"
```

### Step 2: Use Affirmations Within ~10 Minutes
The system looks at your last 3 Mitra messages, so use affirmations while the context is fresh!

### Step 3: Verify Personalization
Look for the **✨ AI Personalized with Your Context** badge

---

## Technical Details

### Backend Logic

```javascript
// 1. Fetch recent Mitra conversations
if (personalized) {
  try {
    const recentMsgs = await db.collection('chat_messages')
      .where('userId', '==', uid)
      .orderBy('timestamp', 'desc')
      .limit(3)
      .get();
    
    if (!recentMsgs.empty) {
      conversationContext = recentMsgs.docs
        .map(d => d.data().content)
        .join(' ')
        .slice(0, 500); // Use first 500 chars
    }
  } catch (error) {
    // Falls back to generic if Firestore index not ready
    console.log('Could not load Mitra context');
  }
}

// 2. Generate with context
const prompt = `Generate affirmations for ${mood}.
${conversationContext ? `Context: "${conversationContext}"` : ''}
...`;

// 3. Mark as personalized only if context exists
personalized: conversationContext.length > 0 && affirmationTexts.length > 0
```

### Frontend Detection

```typescript
// Three states based on affirmation properties:
if (affirmation.personalized) {
  // ✨ AI Personalized (has Mitra context)
} else if (affirmation.id.startsWith('fallback_')) {
  // 💙 Curated (frontend fallback)
} else {
  // 🤖 AI Generated (no Mitra context)
}
```

---

## Troubleshooting

### Not seeing personalized affirmations?

**Problem**: Always seeing "🤖 AI Generated" instead of "✨ AI Personalized"

**Solutions**:

1. **Chat with Mitra first**
   - Have at least 1-2 message exchanges
   - Make sure messages are about your emotions/feelings

2. **Check Firestore Index** (for developers)
   - The backend needs a Firestore composite index on `chat_messages`
   - Fields: `userId` (ascending), `timestamp` (descending)
   - If you see console error about missing index, click the Firebase link to create it

3. **Verify Backend Logs**
   ```
   Could not load Mitra context (index may not exist)
   📊 Personalization Status: NO
   ```
   This means Mitra context query failed - check Firestore setup

4. **Clear and Regenerate**
   - Click the "🔄 Generate New" button
   - Try a different mood
   - Refresh the page

---

## Examples

### Generic Affirmation (No Mitra Context)
```
Mood: Anxiety
Badge: 🤖 AI Generated
Text: "I am safe in this moment and I trust myself completely."
```

### Personalized Affirmation (With Mitra Context)
```
Mood: Anxiety
Badge: ✨ AI Personalized with Your Context
Text: "I am fully prepared for my presentation and my knowledge will shine through."

Context: User told Mitra about presentation anxiety
```

### Curated Affirmation (Fallback)
```
Mood: Confidence
Badge: 💙 Expertly Curated
Text: "I trust my abilities and know my worth."

Reason: Gemini API temporarily unavailable
```

---

## Best Practices

1. **Build Mitra History**: Have 2-3 conversations with Mitra about different topics
2. **Use Fresh Context**: Generate affirmations within 10-15 minutes of Mitra chat
3. **Be Specific**: Tell Mitra specific situations/feelings for better personalization
4. **Watch the Badges**: They tell you exactly what type of affirmation you're getting
5. **Check Console**: Backend logs show the personalization decision process

---

## FAQ

**Q: How long does Mitra context last?**
A: The system uses your last 3 messages (up to 500 characters). Older messages aren't used.

**Q: Can I force personalization?**
A: No, but chatting with Mitra first ensures you'll get personalized affirmations.

**Q: Why do I sometimes get fallback affirmations?**
A: If Gemini API is slow or unavailable, the system uses curated affirmations to ensure you always get help.

**Q: Are curated affirmations worse than AI?**
A: No! They're expertly written and mood-specific. They just aren't tailored to your specific situation.

**Q: How can I test personalization?**
A: 
1. Generate affirmations without Mitra chat → Should see "🤖 AI Generated"
2. Chat with Mitra about something specific
3. Generate affirmations again → Should see "✨ AI Personalized"

---

## Summary

- **✨ AI Personalized** = Best experience (Gemini + Mitra context)
- **🤖 AI Generated** = Good experience (Gemini, no context)
- **💙 Curated** = Reliable experience (fallback)

All three provide valuable affirmations - personalization just makes them more relevant to your current situation! 🌟
