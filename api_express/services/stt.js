const { SpeechClient } = require('@google-cloud/speech');

const speechClient = new SpeechClient();

const MIME_TYPE_TO_ENCODING = {
  'audio/webm': 'WEBM_OPUS',
  'audio/webm;codecs=opus': 'WEBM_OPUS',
  'audio/ogg': 'OGG_OPUS',
  'audio/ogg;codecs=opus': 'OGG_OPUS',
  'audio/mpeg': 'MP3',
  'audio/wav': 'LINEAR16',
  'audio/x-wav': 'LINEAR16',
  'audio/mp4': 'MP4',
};

const DEFAULT_LANGUAGE = 'en-US';

async function transcribeAudio({
  audioBase64,
  languageCode = DEFAULT_LANGUAGE,
  mimeType = 'audio/webm',
  enableSpeakerDiarization = false,
}) {
  if (!audioBase64 || typeof audioBase64 !== 'string') {
    throw new Error('audioBase64 payload is required');
  }

  const encoding = MIME_TYPE_TO_ENCODING[mimeType] || 'WEBM_OPUS';

  const request = {
    audio: { content: audioBase64 },
    config: {
      encoding,
      languageCode,
      enableAutomaticPunctuation: true,
      enableWordTimeOffsets: true,
      audioChannelCount: 1,
      model: 'latest_long',
      // FIXED: Removed alternativeLanguageCodes to prevent Hindi/Bengali from being transcribed to English
      diarizationConfig: enableSpeakerDiarization
        ? { enableSpeakerDiarization: true, minSpeakerCount: 1, maxSpeakerCount: 2 }
        : undefined,
    },
  };

  try {
    const [response] = await speechClient.recognize(request);
    const firstResult = response.results?.[0];
    const firstAlternative = firstResult?.alternatives?.[0];

    return {
      transcript: firstAlternative?.transcript?.trim() || '',
      confidence: firstAlternative?.confidence ?? 0,
      languageCode: firstResult?.languageCode || languageCode,
      words: firstAlternative?.words || [],
      raw: response,
    };
  } catch (error) {
    console.error('[stt] Speech recognition failed:', error);
    throw error;
  }
}

module.exports = {
  transcribeAudio,
};
