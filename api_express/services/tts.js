const textToSpeech = require('@google-cloud/text-to-speech');

const client = new textToSpeech.TextToSpeechClient();

const DEFAULT_LANGUAGE_CODE = 'en-US';
const DEFAULT_VOICE = {
  languageCode: DEFAULT_LANGUAGE_CODE,
  name: 'en-US-Neural2-F',
  ssmlGender: 'FEMALE'
};

const LANGUAGE_VOICE_MAP = {
  en: {
    languageCode: 'en-IN',
    name: 'en-IN-Neural2-D',
    ssmlGender: 'FEMALE'
  },
  hi: {
    languageCode: 'hi-IN',
    name: 'hi-IN-Wavenet-A',
    ssmlGender: 'FEMALE'
  },
  bn: {
    languageCode: 'bn-IN',
    name: 'bn-IN-Wavenet-A',
    ssmlGender: 'FEMALE'
  }
};

function resolveVoice(languageKey) {
  return LANGUAGE_VOICE_MAP[languageKey] || DEFAULT_VOICE;
}

async function synthesizeSpeech({
  text,
  language = 'en',
  speakingRate = 0.95,
  pitch = -2.0
}) {
  if (!text || typeof text !== 'string' || !text.trim()) {
    throw new Error('Text is required for TTS synthesis.');
  }

  const voice = resolveVoice(language);

  const request = {
    input: { text: text.trim() },
    voice,
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate,
      pitch,
      effectsProfileId: ['handset-class-device']
    }
  };

  const [response] = await client.synthesizeSpeech(request);
  const audioContent = response?.audioContent;

  if (!audioContent) {
    throw new Error('Text-to-Speech returned empty audio content.');
  }

  return {
    audioContent,
    mimeType: 'audio/mpeg',
    voice
  };
}

module.exports = {
  synthesizeSpeech
};
