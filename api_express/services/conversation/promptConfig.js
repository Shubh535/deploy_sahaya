const DEFAULT_MODE = 'listener';
const DEFAULT_LANGUAGE = 'en';

const LANGUAGE_REGISTRY = {
  en: {
    label: 'English',
    locale: 'en-IN',
    translatorDirective: `Respond entirely in English while preserving the emotional tone provided by the user. If the user mixes languages, translate gracefully and keep important Indian-origin terms transliterated when helpful.`
  },
  hi: {
    label: 'हिंदी',
    locale: 'hi-IN',
    translatorDirective: `CRITICAL: You MUST respond ONLY in Hindi (हिंदी). उत्तर केवल हिंदी में दें। यदि उपयोगकर्ता अंग्रेज़ी या मिश्रित भाषा का प्रयोग करे तो भावों को सुरक्षित रखते हुए हिंदी में अनुवाद कर दें। आवश्यक होने पर अंग्रेज़ी शब्दों को देवनागरी में लिखें या कोष्ठक में मूल शब्द जोड़ें। DO NOT respond in English. केवल हिंदी में जवाब दें।`
  },
  bn: {
    label: 'বাংলা',
    locale: 'bn-IN',
    translatorDirective: `CRITICAL: You MUST respond ONLY in Bengali (বাংলা). উত্তর শুধুমাত্র বাংলায় দিন। ব্যবহারকারীর অনুভূতি বজায় রেখে উষ্ণ বাংলায় উত্তর দিন। প্রয়োজনে ইংরেজি বা হিন্দি শব্দগুলিকে বাংলায় ব্যাখ্যা করুন বা রোমান হরফে উল্লেখ করুন যাতে অর্থ স্পষ্ট থাকে। DO NOT respond in English. শুধুমাত্র বাংলায় উত্তর দিন।`
  }
};

const MODE_PROFILES = {
  listener: {
    base: `You are Mitra, an empathetic companion for Indian students. You listen deeply, validate emotions, normalise their experience, and respond with warm encouragement. Keep responses concise (3-5 sentences) and ask gentle follow-up questions when appropriate.`,
    languageOverrides: {
      hi: `आप मित्रा हैं — भारतीय विद्यार्थियों की सहानुभूतिपूर्ण मित्र। सरल, आत्मीय हिंदी में भावनाओं को मान्यता दें, अनुभव को सामान्य करें और कोमल प्रोत्साहन दें।`,
      bn: `তুমি মিত্রা — ভারতীয় ছাত্রছাত্রীদের সহমর্মী সহচর। সহজ, হৃদ্য বাংলা ভাষায় অনুভূতিকে মান্যতা দাও, অভিজ্ঞতাকে স্বাভাবিক করে তোলো এবং মৃদু উৎসাহ দাও।`
    }
  },
  coach: {
    base: `You are Mitra, a growth coach for Indian students. Share practical, culturally-aware strategies with a growth mindset. Balance empathy with clear, actionable next steps.`,
    languageOverrides: {
      hi: `आप मित्रा हैं — भारतीय विद्यार्थियों के लिए विकास कोच। सहानुभूति रखते हुए ठोस, व्यावहारिक उपाय दें और विकास मानसिकता को बढ़ावा दें।`,
      bn: `তুমি মিত্রা — ভারতীয় ছাত্রছাত্রীদের জন্য উন্নয়ন কোচ। সহমর্মিতা বজায় রেখে বাস্তবসম্মত পদক্ষেপ ও গ্রোথ মাইন্ডসেট জাগিয়ে তোলো।`
    }
  },
  mindfulness: {
    base: `You are Mitra, a gentle mindfulness guide. Speak softly, invite grounding through breath, body sensations, and present-moment awareness. Use imagery that feels familiar to Indian students.`,
    languageOverrides: {
      hi: `आप मित्रा हैं — एक सौम्य माइंडफुलनेस गाइड। शांत हिंदी में सांस, शरीर और इस पल से जोड़ने वाले निर्देश दें। उपमाएँ भारतीय संदर्भ में रखें।`,
      bn: `তুমি মিত্রা — এক কোমল মাইন্ডফুলনেস গাইড। শান্ত বাংলায় শ্বাস, দেহ ও বর্তমান মুহূর্তের সঙ্গে সংযোগ ঘটাতে সাহায্য করো। ভারতীয় প্রেক্ষাপটের উপমা ব্যবহার করো।`
    }
  }
};

const AVAILABLE_LANGUAGES = Object.keys(LANGUAGE_REGISTRY);

function coerceMode(mode = DEFAULT_MODE) {
  if (mode && MODE_PROFILES[mode]) return mode;
  return DEFAULT_MODE;
}

function coerceLanguage(mode, language = DEFAULT_LANGUAGE) {
  if (language && LANGUAGE_REGISTRY[language]) return language;
  if (MODE_PROFILES[mode]?.languageOverrides?.hi) return 'hi';
  return DEFAULT_LANGUAGE;
}

function formatHistory(history) {
  if (!Array.isArray(history)) return '';
  return history
    .filter((item) => item && typeof item.text === 'string' && item.text.trim())
    .slice(-5) // Limit to last 5 messages to reduce token usage
    .map((item) => {
      const role = item.role === 'assistant' ? 'Mitra' : 'User';
      const text = item.text.trim().substring(0, 200); // Truncate to 200 chars
      return `${role}: ${text}`;
    })
    .join('\n');
}

function formatMemory(memoryContext) {
  if (!memoryContext || typeof memoryContext !== 'object') {
    return 'Memory: none.';
  }

  const facts = Array.isArray(memoryContext.facts) ? memoryContext.facts : [];
  const cleanedFacts = facts
    .filter((fact) => typeof fact === 'string' && fact.trim())
    .slice(0, 3) // Limit to top 3 facts
    .map((fact) => fact.trim().substring(0, 100)) // Truncate each to 100 chars
    .map((fact) => `- ${fact}`);

  if (!cleanedFacts.length) {
    return 'Memory: none.';
  }

  return `Memory: ${cleanedFacts.join(' ')}`;
}

function formatEmotionInsights(emotionInsights) {
  if (!emotionInsights || typeof emotionInsights !== 'object') {
    return 'Emotion: neutral.';
  }

  const emotion = emotionInsights.emotion || {};
  const strategy = emotionInsights.strategy || {};
  const tone = emotionInsights.tone || {};

  const lines = [
    `Emotion: ${emotion.label || 'neutral'} (${(emotion.intensity ?? 0).toFixed(1)})`,
    `Strategy: ${strategy.type || 'validate'}`,
    tone.keywords && tone.keywords.length ? `Tone: ${tone.keywords.slice(0, 2).join(', ')}` : ''
  ].filter(Boolean);

  return `Emotion: ${lines.join(' | ')}`;
}

function buildPrompt({
  message,
  mode = DEFAULT_MODE,
  language = DEFAULT_LANGUAGE,
  history = [],
  memoryContext = null,
  emotionInsights = null
}) {
  const safeMode = coerceMode(mode);
  const safeLanguage = coerceLanguage(safeMode, language);
  const modeProfile = MODE_PROFILES[safeMode] || {};
  const languageProfile = LANGUAGE_REGISTRY[safeLanguage] || LANGUAGE_REGISTRY[DEFAULT_LANGUAGE];
  const systemPrompt = modeProfile.languageOverrides?.[safeLanguage]
    || modeProfile.base
    || MODE_PROFILES[DEFAULT_MODE].base;

  const historySection = formatHistory(history);
  const memorySection = formatMemory(memoryContext);
  const emotionSection = formatEmotionInsights(emotionInsights);
  const trimmedMessage = (message || '').toString().trim();
  const languageDirective = languageProfile?.translatorDirective || LANGUAGE_REGISTRY[DEFAULT_LANGUAGE].translatorDirective;

  return [
    systemPrompt,
    languageDirective,
    emotionSection,
    memorySection,
    historySection ? `History:\n${historySection}` : 'History: none.',
    `User: ${trimmedMessage || '(empty)'}`
  ].join('\n\n');
}

module.exports = {
  AVAILABLE_LANGUAGES,
  DEFAULT_LANGUAGE,
  DEFAULT_MODE,
  LANGUAGE_REGISTRY,
  MODE_PROFILES,
  buildPrompt,
  coerceLanguage,
  coerceMode,
  formatEmotionInsights,
  formatHistory,
  formatMemory
};
