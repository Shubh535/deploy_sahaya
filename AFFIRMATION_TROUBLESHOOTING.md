# Affirmation Stream - Troubleshooting & Testing Guide

## 🔍 Issues Fixed

### Changes Made:
1. **✅ Enhanced Error Handling** - Added console.log statements throughout
2. **✅ Improved Fallback Affirmations** - 5 unique affirmations per mood instead of just 1
3. **✅ Working Browser TTS** - Implemented Web Speech API as fallback
4. **✅ Stop Button for Audio** - Can now stop TTS playback
5. **✅ Better User Feedback** - Alert messages show actual errors
6. **✅ Daily Affirmation Fallback** - Shows default if API fails

---

## 🧪 Testing Instructions

### 1. Open Browser Console
Press `F12` or right-click → Inspect → Console tab

### 2. Navigate to Affirmation Stream
```
http://localhost:3000/first-aid-kit
Click "💬 Affirmations" card
```

### 3. Watch Console Output

You should see:
```
Fetching daily affirmation...
Daily affirmation response: { affirmation: {...} }
Fetching affirmations for mood: anxiety
Affirmations response: { affirmations: [...] }
```

---

## 📋 Feature Testing Checklist

### ✅ Daily Affirmation
**Test:**
1. Page loads automatically
2. Daily affirmation appears at top
3. Says "✨ Today's Affirmation"
4. Shows "Refreshes every 24 hours"

**What to look for in console:**
```
Fetching daily affirmation...
Daily affirmation response: {...}
```

**If it fails:**
- Check console for error message
- Fallback affirmation should still display:
  > "Today, I choose to embrace growth, practice kindness, and trust in my journey."

---

### ✅ Mood-Based Affirmations

**Test Each Mood:**
1. **😰 Anxiety** - Click button
2. **😢 Sadness** - Click button
3. **💪 Motivation** - Click button
4. **✨ Confidence** - Click button
5. **🙏 Gratitude** - Click button
6. **💖 Self-Love** - Click button

**Expected Behavior:**
- Loading spinner (⏳) appears
- 5 affirmations generate within 3-5 seconds
- Affirmations match the mood theme
- Console shows:
  ```
  Fetching affirmations for mood: anxiety
  Affirmations response: { affirmations: [5 items] }
  ```

**What to Check:**
- ✅ Affirmations are relevant to mood
- ✅ Each is 10-15 words
- ✅ Uses "I" statements
- ✅ Shows "🤖 Personalized for you" badge (if using Mitra context)

**If API Fails:**
- Should show alert: "Error loading affirmations: [error]. Using fallback."
- Should display 5 fallback affirmations specific to that mood
- Example fallback for Anxiety:
  * "I am safe in this moment and I trust myself."
  * "My breath anchors me to the present moment."
  * etc.

---

### ✅ Gemini Personalization (Mitra Context)

**How It Works:**
Backend fetches your last 3 Mitra chat messages and includes them as context for Gemini

**To Verify:**
1. First, have a conversation in Mitra (if you haven't already)
2. Go to Affirmation Stream
3. Generate affirmations
4. Check console on backend terminal for:
   ```
   POST /api/wellness/affirmations
   Request body: { mood: 'anxiety', personalized: true, count: 5 }
   ```

**Backend should show:**
- Fetching from `chat_messages` collection
- Using conversation context in Gemini prompt

**If No Mitra Messages Exist:**
- Affirmations still generate, just without personal context
- This is normal for first-time users

---

### ✅ Framer Motion Card Animations

**Test:**
1. Click "→" (Next) button
2. Watch card transition

**Expected Animation:**
- Old card rotates out (rotateY: 10deg)
- New card rotates in (rotateY: 0deg)
- Smooth 0.5s transition
- Scale effect (0.9 → 1.0)

**Troubleshooting:**
- If animations are choppy: Check browser performance
- If no animation: Framer Motion may not be loaded (check console errors)

**Progress Dots:**
- Current dot should be longer and have gradient
- Other dots should be small and gray
- Should match current index (0-4)

---

### ✅ Save Feature

**Test:**
1. Click "🤍 Save" button on any affirmation
2. Should change to "❤️ Saved"
3. Green "✓ Saved!" message appears top-right for 2 seconds
4. Console shows:
   ```
   Saving affirmation: { id: '...', text: '...', ... }
   Save response: { success: true }
   ```

**Firestore Verification:**
1. Open Firebase Console
2. Go to Firestore Database
3. Check collections:
   - `saved_affirmations/{your-uid}/affirmations/{affirmation-id}`
   - `affirmation_interactions` (with action: 'saved')

**Expected Data Structure:**
```javascript
// saved_affirmations/{uid}/affirmations/{affirmationId}
{
  text: "I am safe in this moment...",
  mood: "anxiety",
  savedAt: Timestamp
}

// affirmation_interactions/{interactionId}
{
  userId: "your-uid",
  affirmationId: "anxiety_1730000000_0",
  action: "saved",
  timestamp: Timestamp
}
```

**If Save Fails:**
- Console will show: "Failed to save: [error message]"
- Alert will appear with error details
- Check authentication (should auto-auth with x-dev-auth in dev mode)

---

### ✅ Listen Feature (Text-to-Speech)

**Test:**
1. Click "🔊 Listen" button
2. Button changes to "⏹️ Stop"
3. Browser speaks affirmation aloud

**Expected Behavior:**
- Voice should be calm and clear
- Rate: 0.9 (slightly slower than normal)
- Prefers female/natural voices
- Console shows:
  ```
  Using browser Speech Synthesis API for TTS
  ```

**Stop Functionality:**
- Click "⏹️ Stop" to interrupt
- Speech stops immediately
- Button returns to "🔊 Listen"

**Troubleshooting:**
**If no sound:**
1. Check browser permissions (may block autoplay)
2. Check volume settings
3. Try clicking after user interaction
4. Console will show if Speech Synthesis is not supported

**Browsers with Best TTS:**
- ✅ Chrome/Edge: Excellent (multiple voices)
- ✅ Safari: Good (Samantha voice)
- ⚠️ Firefox: Basic (limited voices)

**Voice Selection:**
The code tries to find voices with these names:
- "Female"
- "Samantha"
- "Natural"

If none found, uses default system voice.

**To See Available Voices:**
Open console and run:
```javascript
speechSynthesis.getVoices().forEach(v => console.log(v.name));
```

---

### ✅ Remind Feature

**Test:**
1. Click "⏰ Remind" button
2. Alert appears: "✅ Reminder set for 1 hour from now! 🔔"
3. Console shows:
   ```
   Setting reminder for affirmation: {...}
   Reminder response: { success: true, remindAt: 1730003600000 }
   ```

**Firestore Verification:**
```javascript
// affirmation_reminders/{reminderId}
{
  userId: "your-uid",
  affirmationId: "anxiety_1730000000_0",
  text: "I am safe in this moment...",
  remindAt: Timestamp (1 hour from now),
  completed: false,
  createdAt: Timestamp
}
```

**Note:**
- Reminder is **stored** in Firestore
- **Background job not implemented yet** (future enhancement)
- You can see all reminders in Firebase Console
- `remindAt` is Unix timestamp (milliseconds since epoch)

**Calculate Reminder Time:**
```javascript
// In console:
const reminderTime = new Date(1730003600000);
console.log(reminderTime.toLocaleString());
```

---

### ✅ Refresh Button

**Test:**
1. Scroll to bottom
2. Click "🔄 Generate New Affirmations"
3. Loading spinner appears
4. New set of 5 affirmations loads

**Expected:**
- Same mood as currently selected
- Different affirmations from previous set
- Gemini generates new content each time
- Index resets to 0 (first affirmation)

---

## 🐛 Common Issues & Solutions

### Issue 1: "Affirmations not loading"

**Symptoms:**
- Loading spinner doesn't appear
- No affirmations shown
- Console error

**Debug Steps:**
1. Check console for specific error
2. Verify backend running on port 4001:
   ```powershell
   curl http://localhost:4001/api/wellness/progress -H "x-dev-auth: allow"
   ```
3. Check Next.js dev server running on port 3000
4. Verify `.env.local` has:
   ```
   NEXT_PUBLIC_API_BASE_URL=http://localhost:4001
   ```

**If Backend Not Running:**
```powershell
cd d:\genAI
node api_express/index.js
```

---

### Issue 2: "Save button not working"

**Symptoms:**
- Click "Save" but nothing happens
- No "✓ Saved!" message
- Console error

**Check:**
1. Browser console for error message
2. Authentication token present
3. Firestore rules allow writes

**Dev Mode Bypass:**
Backend should auto-allow in dev mode with:
```
DEV_BYPASS_AUTH=1
```

**Manual Test:**
```powershell
curl http://localhost:3000/api/wellness/save-affirmation `
  -X POST `
  -H "Content-Type: application/json" `
  -H "x-dev-auth: allow" `
  -d '{\"affirmationId\":\"test_123\",\"text\":\"Test affirmation\",\"mood\":\"calm\"}'
```

---

### Issue 3: "TTS not speaking"

**Symptoms:**
- Click "Listen" but no sound
- Button changes but silent

**Solutions:**

**For Chrome/Edge:**
1. Check site permissions: Click padlock in address bar → Permissions
2. Ensure "Sound" is allowed
3. Try clicking "Listen" again (browser may block autoplay)

**For Safari:**
1. Preferences → Websites → Auto-Play → Allow All Auto-Play

**For Firefox:**
1. Limited voice support - may need to download voices
2. about:config → media.webspeech.synth.enabled → true

**Test Speech Synthesis:**
```javascript
// In browser console:
const utterance = new SpeechSynthesisUtterance("Hello world");
speechSynthesis.speak(utterance);
```

If this doesn't work, Speech Synthesis is blocked/unsupported.

---

### Issue 4: "Animations not smooth"

**Symptoms:**
- Card transitions choppy
- Framer Motion not working

**Solutions:**
1. Check browser hardware acceleration enabled
2. Close other tabs to free up resources
3. Verify Framer Motion installed:
   ```powershell
   npm list framer-motion
   ```
4. Check for console errors related to motion

**Fallback:**
If animations are problematic, you can disable them temporarily by removing `AnimatePresence` wrapper.

---

### Issue 5: "Daily affirmation not showing"

**Symptoms:**
- Top card empty or missing
- No daily affirmation text

**Debug:**
1. Check console: `Fetching daily affirmation...`
2. Check response in console
3. Verify backend endpoint:
   ```powershell
   curl http://localhost:3000/api/wellness/daily-affirmation -H "x-dev-auth: allow"
   ```

**Fallback:**
Should always show fallback even if API fails:
> "Today, I choose to embrace growth, practice kindness, and trust in my journey."

---

### Issue 6: "Personalization not working (no Mitra context)"

**Expected Behavior:**
If you **haven't used Mitra** yet, affirmations won't have personal context - this is normal!

**To Enable Personalization:**
1. Go to `/mitra` page
2. Have a conversation with Mitra
3. Return to Affirmation Stream
4. Generate affirmations
5. Backend will now include conversation context

**Verify Mitra Messages Exist:**
In Firebase Console:
- Check `chat_messages` collection
- Should have documents with `userId` field matching your UID

**Backend Logs:**
When personalized=true, backend should log:
```
Fetching recent Mitra messages for uid: dev-user
Found X messages for context
```

---

## 📊 Success Criteria

### All Features Working ✅
- [x] Daily affirmation loads automatically
- [x] Mood selector buttons work
- [x] 5 affirmations generate per mood
- [x] Card transitions animate smoothly
- [x] Navigation (prev/next) works
- [x] Progress dots update correctly
- [x] Save button works and shows confirmation
- [x] Listen button speaks affirmation
- [x] Stop button interrupts speech
- [x] Remind button sets reminder
- [x] Refresh button generates new affirmations
- [x] Firestore saves all data correctly
- [x] Console shows all operations
- [x] Errors display helpful messages

---

## 🎯 User Experience Goals

**User should feel:**
- ✅ Calm and supported
- ✅ In control of their experience
- ✅ Affirmations are relevant and personal
- ✅ Interface is intuitive and responsive
- ✅ Features work reliably

**Technical Goals:**
- ✅ No JavaScript errors in console
- ✅ All API calls complete successfully
- ✅ Fallbacks work if APIs fail
- ✅ Animations don't lag or stutter
- ✅ TTS works in major browsers
- ✅ Firestore data structure correct

---

## 📝 Testing Report Template

```markdown
## Affirmation Stream Test Report
**Date:** [DATE]
**Browser:** [Chrome/Safari/Firefox/Edge]
**Tester:** [NAME]

### Daily Affirmation
- Loads on page load: ✅/❌
- Shows meaningful affirmation: ✅/❌
- Fallback works if API fails: ✅/❌

### Mood Selection
- All 6 moods clickable: ✅/❌
- Affirmations match mood: ✅/❌
- Loading spinner appears: ✅/❌
- 5 affirmations generate: ✅/❌
- Fallback affirmations work: ✅/❌

### Navigation & Animations
- Card transitions smooth: ✅/❌
- Prev/Next buttons work: ✅/❌
- Progress dots update: ✅/❌
- No visual glitches: ✅/❌

### Save Feature
- Save button works: ✅/❌
- "✓ Saved!" message shows: ✅/❌
- Button changes to "❤️ Saved": ✅/❌
- Firestore document created: ✅/❌
- Interaction logged: ✅/❌

### Listen Feature (TTS)
- Audio plays on click: ✅/❌
- Voice is clear: ✅/❌
- Stop button works: ✅/❌
- No console errors: ✅/❌

### Remind Feature
- Reminder sets successfully: ✅/❌
- Alert confirms reminder: ✅/❌
- Firestore document created: ✅/❌
- Timestamp correct (1 hour): ✅/❌

### Refresh Feature
- New affirmations generate: ✅/❌
- Different from previous: ✅/❌
- Index resets to 0: ✅/❌

### Console Output
- No errors: ✅/❌
- All operations logged: ✅/❌
- Helpful error messages: ✅/❌

### Overall Assessment
**Rating:** ⭐⭐⭐⭐⭐
**Issues Found:** [LIST]
**Recommendations:** [TEXT]
```

---

## 🚀 Next Steps

If all tests pass:
1. ✅ Mark "Test Affirmation Stream" as complete
2. ✅ Test other modules (Breathing Coach, Mindfulness)
3. ✅ Deploy to production
4. ✅ Gather user feedback

---

**Happy Testing!** 🎉
