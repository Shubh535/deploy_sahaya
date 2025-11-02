const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { db } = require('../firebase');

// Helper function to get Firestore instance
const getDb = () => db;

// Initialize Gemini with API Key (simpler than Vertex AI)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

// ============================================
// DAILY MEME GENERATION
// ============================================
router.post('/daily-meme', async (req, res) => {
  console.log('=== Daily Meme Route Hit ===');
  try {
    const { userId } = req.body;
    console.log('User ID:', userId);

    // 1. Get user's recent mood from Manthan reflections (if available)
    let userMood = 'general';
    
    if (userId) {
      try {
        console.log('Fetching user mood from Firestore...');
        const reflectionsRef = getDb()
          .collection('manthan_journals')
          .where('uid', '==', userId)
          .limit(1);

        const snapshot = await reflectionsRef.get();
        console.log('Snapshot empty?', snapshot.empty);
        
        if (!snapshot.empty) {
          const lastReflection = snapshot.docs[0].data();
          console.log('Journal entry mood:', lastReflection.mood);
          
          // Access direct mood field (not nested)
          userMood = lastReflection.mood || 'general';
          console.log('User mood found:', userMood);
        }
      } catch (error) {
        console.log('Could not fetch user mood:', error.message);
      }
    }

    // 2. Generate meme keywords based on mood using Gemini
    const moodKeywordsPrompt = `You are an expert at selecting visual imagery that uplifts people's moods. 

Current user mood: ${userMood}

Generate 5 highly specific, vivid keywords for finding the PERFECT uplifting image on Unsplash that would help someone feeling ${userMood} feel better.

GUIDELINES:
- For "sad" mood: Focus on warm sunlight, cozy scenes, hopeful nature, gentle animals, peaceful landscapes
- For "anxious" mood: Focus on calm waters, serene forests, peaceful meditation, tranquil sunsets, soothing colors
- For "angry" mood: Focus on calming nature, ocean waves, zen gardens, peaceful animals, cooling colors
- For "happy" mood: Focus on vibrant celebrations, joyful moments, bright flowers, playful animals, sunshine
- For "excited" mood: Focus on adventure scenes, dynamic nature, energetic animals, colorful festivals, mountain peaks
- For "neutral" mood: Focus on inspiring landscapes, beautiful nature, aesthetic views, artistic photography

BE SPECIFIC: Instead of "cute animals", say "golden retriever puppies playing" or "sleepy kittens cuddling"
BE VIVID: Instead of "nature", say "misty mountain sunrise" or "autumn forest path"

Return ONLY 5 keywords as a comma-separated list, nothing else. No explanations.`;

    const keywordsResult = await model.generateContent(moodKeywordsPrompt);
    const keywords = keywordsResult.response.text().trim();

    console.log('Generated keywords:', keywords);

    // 3. Fetch image from Unsplash
    const unsplashAccessKey = 'I1A-Gscd6Ht-lFH1rk7fW4fpke2oHu19l-N9EmCzGv4';
    const randomKeyword = keywords.split(',')[Math.floor(Math.random() * keywords.split(',').length)].trim();
    
    console.log('Selected keyword for Unsplash:', randomKeyword);
    
    const unsplashUrl = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(randomKeyword)}&orientation=landscape&content_filter=high`;
    console.log('Fetching from Unsplash...');
    
    let memeImage;
    
    try {
      const unsplashResponse = await fetch(unsplashUrl, {
        headers: {
          'Authorization': `Client-ID ${unsplashAccessKey}`
        }
      });

      console.log('Unsplash response status:', unsplashResponse.status);

      if (!unsplashResponse.ok) {
        const errorText = await unsplashResponse.text();
        console.error('Unsplash API error:', errorText);
        throw new Error(`Unsplash API error: ${unsplashResponse.status}`);
      }

      const unsplashData = await unsplashResponse.json();
      console.log('Unsplash data received:', { id: unsplashData.id, photographer: unsplashData.user?.name });
      
      memeImage = {
        id: unsplashData.id,
        imageUrl: unsplashData.urls.regular,
        description: unsplashData.description || unsplashData.alt_description || 'An uplifting image',
        photographer: unsplashData.user.name,
        photographerUrl: unsplashData.user.links.html,
        downloadLocation: unsplashData.links.download_location // For tracking downloads as per Unsplash guidelines
      };

      console.log('Meme image prepared:', memeImage.imageUrl);

      // Track download for Unsplash (required by their API guidelines)
      try {
        await fetch(unsplashData.links.download_location, {
          headers: {
            'Authorization': `Client-ID ${unsplashAccessKey}`
          }
        });
        console.log('Download tracking successful');
      } catch (trackError) {
        console.log('Download tracking failed (non-critical):', trackError.message);
      }

    } catch (unsplashError) {
      console.error('Unsplash error, using fallback:', unsplashError.message);
      
      // Fallback to a curated positive image
      memeImage = {
        id: 'fallback-' + Date.now(),
        imageUrl: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131',
        description: 'A cute cat looking happy',
        photographer: 'Unsplash',
        photographerUrl: 'https://unsplash.com'
      };
    }

    // 4. Get existing reactions and bookmark status from Firestore (if user is logged in)
    let reactions = [];
    let bookmarked = false;

    if (userId) {
      try {
        const memeDoc = await getDb()
          .collection('users')
          .doc(userId)
          .collection('entertainment_memes')
          .doc(memeImage.id)
          .get();

        if (memeDoc.exists) {
          const data = memeDoc.data();
          reactions = data.reactions || [];
          bookmarked = data.bookmarked || false;
        }
      } catch (error) {
        console.log('Could not fetch meme data:', error.message);
      }
    }

    // 5. Return meme data
    console.log('Returning meme response with imageUrl:', memeImage.imageUrl);
    res.json({
      ...memeImage,
      reactions,
      bookmarked,
      mood: userMood,
      keywords
    });
    console.log('Meme response sent successfully');

  } catch (error) {
    console.error('Error generating daily meme:', error);
    res.status(500).json({
      error: 'Failed to generate meme',
      details: error.message
    });
  }
});

// ============================================
// MUSIC RECOMMENDATIONS
// ============================================
router.post('/music-recommendations', async (req, res) => {
  console.log('=== Music Recommendations Route Hit ===');
  try {
    const { userId } = req.body;
    console.log('User ID:', userId);

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // 1. Fetch user's recent emotions from Manthan
    console.log('Fetching Manthan reflections...');
    const reflectionsRef = getDb()
      .collection('manthan_journals')
      .where('uid', '==', userId)
      .limit(3);

    const snapshot = await reflectionsRef.get();
    console.log('Manthan snapshot empty?', snapshot.empty);
    console.log('Number of reflections found:', snapshot.size);

    let emotionContext = 'neutral';
    let reflectionSummary = '';

    if (!snapshot.empty) {
      const emotions = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log('Journal entry:', { mood: data.mood, title: data.title });
        
        // Access direct mood field (matching journalService.ts structure)
        const emotion = data.mood;
        if (emotion) {
          emotions.push(emotion);
          console.log('Found emotion:', emotion);
        }
        
        // Get reflection content
        if (data.content) {
          reflectionSummary += data.content + ' ';
        }
        
        // Also check insights if available
        if (data.insights?.emotional_summary) {
          reflectionSummary += data.insights.emotional_summary + ' ';
        }
      });

      if (emotions.length > 0) {
        emotionContext = emotions.join(', ');
      }
      console.log('Final emotion context:', emotionContext);
      console.log('Reflection summary length:', reflectionSummary.length);
    } else {
      console.log('No Manthan reflections found, using default emotion: neutral');
    }

    // 2. Generate Indian song recommendations using Gemini
    const musicPrompt = `You are a music curator for an Indian mental wellness app called "Sahay" (meaning support/help).

The user's recent emotional state: ${emotionContext}
${reflectionSummary ? `Context from their reflections: ${reflectionSummary.substring(0, 200)}` : ''}

Generate 5 Indian song recommendations that would help them feel better. Include a mix of:
- Classical/Semi-classical (ragas, ghazals)
- Bollywood (meaningful, soulful songs)
- Devotional/Spiritual (bhajans, mantras)
- Indie/Folk (regional songs)

For each song, provide:
1. Song title (in English or romanized Hindi/regional language)
2. Artist name
3. Genre (classical/bollywood/devotional/indie/folk)

Also provide a brief 1-sentence reasoning for why these songs match their mood.

Return your response in this EXACT JSON format (no markdown, no code blocks):
{
  "emotion": "brief emotion summary",
  "reasoning": "one sentence explaining the selection",
  "songs": [
    {
      "title": "song name",
      "artist": "artist name",
      "genre": "genre"
    }
  ]
}`;

    const musicResult = await model.generateContent(musicPrompt);
    let responseText = musicResult.response.text().trim();

    // Clean up response (remove markdown code blocks if present)
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let musicData;
    try {
      musicData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', responseText);
      
      // Fallback recommendations
      musicData = {
        emotion: emotionContext,
        reasoning: "These songs blend traditional Indian wisdom with modern sensibilities to uplift your spirit.",
        songs: [
          { title: "Kun Faya Kun", artist: "A.R. Rahman", genre: "Devotional" },
          { title: "Tum Ho Toh", artist: "Mohit Chauhan", genre: "Bollywood" },
          { title: "Ae Dil Hai Mushkil", artist: "Arijit Singh", genre: "Bollywood" },
          { title: "Shiv Tandav Stotram", artist: "Various Artists", genre: "Devotional" },
          { title: "Iktara", artist: "Kavita Seth", genre: "Folk" }
        ]
      };
    }

    // 3. Save recommendations to Firestore
    try {
      await getDb()
        .collection('users')
        .doc(userId)
        .collection('entertainment_music')
        .add({
          emotion: musicData.emotion,
          songs: musicData.songs,
          reasoning: musicData.reasoning,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
    } catch (saveError) {
      console.error('Could not save music recommendations:', saveError.message);
    }

    res.json(musicData);

  } catch (error) {
    console.error('Error generating music recommendations:', error);
    res.status(500).json({
      error: 'Failed to generate music recommendations',
      details: error.message
    });
  }
});

// ============================================
// REACT TO MEME
// ============================================
router.post('/react-meme', async (req, res) => {
  try {
    const { userId, memeId, reactions } = req.body;

    if (!userId || !memeId) {
      return res.status(400).json({ error: 'userId and memeId are required' });
    }

    await getDb()
      .collection('users')
      .doc(userId)
      .collection('entertainment_memes')
      .doc(memeId)
      .set({
        reactions: reactions || [],
        lastReactedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

    res.json({ success: true });

  } catch (error) {
    console.error('Error saving meme reaction:', error);
    res.status(500).json({
      error: 'Failed to save reaction',
      details: error.message
    });
  }
});

// ============================================
// BOOKMARK MEME
// ============================================
router.post('/bookmark-meme', async (req, res) => {
  try {
    const { userId, memeId, bookmarked } = req.body;

    if (!userId || !memeId) {
      return res.status(400).json({ error: 'userId and memeId are required' });
    }

    await getDb()
      .collection('users')
      .doc(userId)
      .collection('entertainment_memes')
      .doc(memeId)
      .set({
        bookmarked: bookmarked || false,
        lastBookmarkedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

    res.json({ success: true });

  } catch (error) {
    console.error('Error saving bookmark:', error);
    res.status(500).json({
      error: 'Failed to save bookmark',
      details: error.message
    });
  }
});

// ============================================
// GET BOOKMARKED MEMES
// ============================================
router.get('/bookmarks/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const bookmarksSnapshot = await getDb()
      .collection('users')
      .doc(userId)
      .collection('entertainment_memes')
      .where('bookmarked', '==', true)
      .orderBy('lastBookmarkedAt', 'desc')
      .limit(20)
      .get();

    const bookmarks = [];
    bookmarksSnapshot.forEach(doc => {
      bookmarks.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({ bookmarks });

  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({
      error: 'Failed to fetch bookmarks',
      details: error.message
    });
  }
});

module.exports = router;
