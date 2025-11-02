

"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../components/AuthProvider";
import { getIdToken } from "../utils/getIdToken";
import { useVoicePipeline, VoiceSessionSummary, VoiceSessionStopResult } from "./useVoicePipeline";

// Speech Recognition types
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

declare const SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

const MODES = [
  { key: "coach", label: "Coach", icon: "👩‍🏫" },
  { key: "listener", label: "Listener", icon: "👂" },
  { key: "mindfulness", label: "Mindfulness", icon: "🌸" },
];

type LanguageOption = {
  key: string;
  label: string;
  locale: string;
  translatorDirective?: string;
};

const FALLBACK_LANGUAGES: LanguageOption[] = [
  { key: "en", label: "English", locale: "en-US" },
  { key: "hi", label: "हिन्दी", locale: "hi-IN" },
];

const VOICE_PIPELINE_VERSION = "voice-pipeline-stub.v1";

type EmotionStrategy = {
  type: string;
  rationale?: string;
  followUpQuestion?: string;
};

type EmotionInsights = {
  emotion: {
    label: string;
    confidence: number;
    intensity?: number;
  };
  sentiment: string;
  needs: string[];
  strategy?: EmotionStrategy;
  tone?: {
    style?: string;
    keywords?: string[];
  };
};

type ChatMessage = {
  text: string;
  role: "user" | "assistant";
  meta?: {
    emotion?: { label: string; confidence: number; intensity?: number };
    strategy?: EmotionStrategy;
    sentiment?: string;
    needs?: string[];
    toneKeywords?: string[];
    warnings?: string[];
    source?: "text" | "voice";
    intensity?: number;
    transcriptionConfidence?: number;
    transcriptSource?: "webSpeech" | "vertex";
  };
};

interface ConversationResult {
  response: {
    text: string;
    language: string;
  };
  emotion?: {
    label: string;
    confidence: number;
  };
  memory?: {
    retrieved?: Array<Record<string, unknown>>;
    updates?: Array<Record<string, unknown>>;
  };
  meta?: {
    warnings?: string[];
    timestamp?: string;
    mode?: string;
    language?: string;
    emotionAnalysis?: EmotionInsights;
  };
}

const appendEmotionalContext = (message: string, intensity: number) => {
  if (intensity > 5) {
    return `[High emotional intensity detected (${intensity.toFixed(1)}/10). Respond with extra compassion and care.] ${message}`;
  }
  if (intensity > 2) {
    return `[Moderate emotional intensity detected (${intensity.toFixed(1)}/10). Be attentive to their needs.] ${message}`;
  }
  return message;
};

const mapHistory = (msgs: ChatMessage[]): { role: "user" | "assistant"; text: string }[] =>
  msgs.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", text: m.text }));

function MessageBubble({ text, fromUser, meta }: { text: string; fromUser: boolean; meta?: ChatMessage["meta"]; }) {
  return (
    <div
      className={`max-w-[75%] px-4 py-2 rounded-2xl mb-2 text-sm shadow-sm whitespace-pre-line ${
        fromUser
          ? "ml-auto message-user text-right"
          : "mr-auto message-assistant"
      }`}
    >
      <p>{text}</p>
      {!fromUser && meta && (
        <div className="mt-2 space-y-1 text-xs text-left text-slate-600 dark:text-slate-200">
          {meta.sentiment && (
            <div>
              <span className="font-semibold">Sentiment:</span> {meta.sentiment}
            </div>
          )}
          {meta.strategy && (
            <div className="space-y-1">
              <div>
                <span className="font-semibold">Strategy:</span> {meta.strategy.type}
              </div>
              {meta.strategy.rationale && (
                <div className="italic opacity-80">{meta.strategy.rationale}</div>
              )}
              {meta.strategy.followUpQuestion && (
                <div className="pt-1">
                  <span className="font-semibold">Follow-up:</span> {meta.strategy.followUpQuestion}
                </div>
              )}
            </div>
          )}
          {meta.needs && meta.needs.length > 0 && (
            <div>
              <span className="font-semibold">Needs:</span> {meta.needs.slice(0, 4).join(", ")}
            </div>
          )}
          {meta.toneKeywords && meta.toneKeywords.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {meta.toneKeywords.slice(0, 4).map((keyword) => (
                <span
                  key={keyword}
                  className="px-2 py-0.5 rounded-full bg-white/60 dark:bg-black/30 border border-white/40 dark:border-white/10"
                >
                  #{keyword}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ZenPortalAnimation({ onComplete }: { onComplete: () => void }) {
  const [stage, setStage] = useState<'portal' | 'expanding' | 'revealing' | 'done'>('portal');

  useEffect(() => {
    const timer1 = setTimeout(() => setStage('expanding'), 500);
    const timer2 = setTimeout(() => setStage('revealing'), 1500);
    const timer3 = setTimeout(() => {
      setStage('done');
      onComplete();
    }, 3500);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center z-50 overflow-hidden">
      {/* Floating particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 bg-white rounded-full opacity-60 animate-ping`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className="text-center relative z-10">
        {stage === 'portal' && (
          <div className="w-16 h-16 border-4 border-white rounded-full animate-pulse"></div>
        )}
        {stage === 'expanding' && (
          <div className="relative">
            <div className="w-32 h-32 border-4 border-white rounded-full animate-ping absolute inset-0"></div>
            <div className="w-24 h-24 border-4 border-purple-300 rounded-full animate-ping absolute inset-4"></div>
            <div className="w-16 h-16 border-4 border-pink-300 rounded-full animate-ping absolute inset-8"></div>
            <div className="w-8 h-8 bg-white rounded-full absolute inset-12 animate-pulse"></div>
          </div>
        )}
        {stage === 'revealing' && (
          <div className="relative animate-fade-in">
            <div className="text-8xl animate-bounce">�‍♀️</div>
            <div className="absolute -top-8 -left-8 text-4xl animate-spin">✨</div>
            <div className="absolute -top-8 -right-8 text-4xl animate-spin">�</div>
            <div className="absolute -bottom-8 -left-8 text-4xl animate-spin">�️</div>
            <div className="absolute -bottom-8 -right-8 text-4xl animate-spin">🌿</div>
            {/* Ripple effects */}
            <div className="absolute inset-0 border-2 border-white rounded-full animate-ping opacity-75"></div>
            <div className="absolute inset-2 border-2 border-purple-300 rounded-full animate-ping opacity-50" style={{animationDelay: '0.5s'}}></div>
          </div>
        )}
        {stage === 'done' && (
          <div className="text-6xl animate-fade-out">�‍♀️</div>
        )}
        <p className="mt-8 text-2xl text-white font-light animate-fade-in">
          {stage === 'portal' && "Opening your mindfulness portal..."}
          {stage === 'expanding' && "Connecting to your inner peace..."}
          {stage === 'revealing' && "Welcome to your sacred space"}
          {stage === 'done' && "Find your center"}
        </p>
      </div>
    </div>
  );
}

function LanguageSwitcher({
  options,
  value,
  onChange
}: {
  options: LanguageOption[];
  value: string;
  onChange: (next: string) => void;
}) {
  if (!options.length) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="hidden md:flex bg-white/60 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-600/80 rounded-full p-1 shadow-sm">
        {options.map((option) => {
          const isActive = option.key === value;
          return (
            <button
              key={option.key}
              onClick={() => onChange(option.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 ${
                isActive
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/40'
              }`}
              title={option.translatorDirective || option.label}
              type="button"
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <select
        className="md:hidden rounded-xl px-3 py-2 border text-xs bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-slate-200 dark:border-slate-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all duration-300 text-slate-700 dark:text-slate-200"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((lang) => (
          <option key={lang.key} value={lang.key}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function EmotionRecapModal({ insights, onClose }: { insights: EmotionInsights; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-white/30 dark:border-slate-700/60">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/40 dark:border-slate-700/60">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Session insights</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Pulled from the latest emotion analysis</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            type="button"
          >
            ✕
          </button>
        </div>
        <div className="px-5 py-4 space-y-4 text-sm text-slate-700 dark:text-slate-200">
          <section>
            <h3 className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Primary emotion</h3>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base capitalize">{insights.emotion.label}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {(insights.emotion.confidence * 100).toFixed(0)}% confidence · intensity {(insights.emotion.intensity ?? 0).toFixed(2)}
              </span>
            </div>
          </section>
          <section>
            <h3 className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Strategy</h3>
            <p className="font-medium capitalize">{insights.strategy?.type || 'validate'}</p>
            {insights.strategy?.rationale && <p className="mt-1 text-sm opacity-80">{insights.strategy.rationale}</p>}
            {insights.strategy?.followUpQuestion && (
              <p className="mt-2 text-sm italic text-emerald-600 dark:text-emerald-300">
                {insights.strategy.followUpQuestion}
              </p>
            )}
          </section>
          {insights.needs?.length ? (
            <section>
              <h3 className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Needs to honour</h3>
              <div className="flex flex-wrap gap-2">
                {insights.needs.slice(0, 6).map((need) => (
                  <span
                    key={need}
                    className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200 text-xs"
                  >
                    {need}
                  </span>
                ))}
              </div>
            </section>
          ) : null}
          {insights.tone?.keywords?.length ? (
            <section>
              <h3 className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Tone anchors</h3>
              <div className="flex flex-wrap gap-2">
                {insights.tone.keywords.slice(0, 6).map((keyword) => (
                  <span
                    key={keyword}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs"
                  >
                    #{keyword}
                  </span>
                ))}
              </div>
            </section>
          ) : null}
        </div>
        <div className="px-5 py-3 border-t border-white/40 dark:border-slate-700/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition"
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MitraChatPage() {
  const { user, loading } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState("listener");
  const [languageOptions, setLanguageOptions] = useState<LanguageOption[]>(FALLBACK_LANGUAGES);
  const [language, setLanguage] = useState<string>(FALLBACK_LANGUAGES[0].key);
  const [includeJournalContext, setIncludeJournalContext] = useState(false);
  const [error, setError] = useState("");
  const [showAnimation, setShowAnimation] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [emotionalIntensity, setEmotionalIntensity] = useState<number>(0);
  const [voiceSupported, setVoiceSupported] = useState<boolean>(false);
  const [speechRecognitionAvailable, setSpeechRecognitionAvailable] = useState<boolean>(false);
  const [lastEmotion, setLastEmotion] = useState<{ label: string; confidence: number } | null>(null);
  const [lastEmotionInsights, setLastEmotionInsights] = useState<EmotionInsights | null>(null);
  const [voicePlaybackEnabled, setVoicePlaybackEnabled] = useState<boolean>(true);
  const [voicePlaybackPending, setVoicePlaybackPending] = useState<boolean>(false);
  const [showRecapModal, setShowRecapModal] = useState(false);
  const activeVoiceSessionRef = useRef<VoiceSessionSummary | null>(null);
  const lastVoiceStopResultRef = useRef<VoiceSessionStopResult | null>(null);
  const finalizeTimeoutRef = useRef<number | null>(null);
  const languagesFetchedRef = useRef(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const audioPlaybackRef = useRef<HTMLAudioElement | null>(null);

  const {
    start: startVoicePipeline,
    stop: stopVoicePipeline,
    isActive: pipelineActive,
    audioSupported: micSupported,
    level: voiceLevel,
    lastSummary: lastPipelineSummary,
    error: voicePipelineError,
  } = useVoicePipeline();

  const getLocaleForLanguage = useCallback(
    (code: string) => {
      const match = languageOptions.find((option) => option.key === code);
      if (match?.locale) {
        return match.locale;
      }
      const fallbackLocale = languageOptions[0]?.locale ?? FALLBACK_LANGUAGES[0].locale;
      return fallbackLocale;
    },
    [languageOptions]
  );

  const finalizeVoiceSession = useCallback(async (): Promise<VoiceSessionStopResult | null> => {
    const result = await stopVoicePipeline();
    if (finalizeTimeoutRef.current !== null) {
      window.clearTimeout(finalizeTimeoutRef.current);
      finalizeTimeoutRef.current = null;
    }
    if (result) {
      if (result.summary) {
        activeVoiceSessionRef.current = result.summary;
      }
      lastVoiceStopResultRef.current = result;
      return result;
    }

    if (lastVoiceStopResultRef.current) {
      const cached = lastVoiceStopResultRef.current;
      lastVoiceStopResultRef.current = null;
      return cached;
    }

    return null;
  }, [stopVoicePipeline]);

  useEffect(() => {
    if (loading || !user || languagesFetchedRef.current) return;

    let cancelled = false;

    const fetchLanguages = async () => {
      try {
        const token = await getIdToken();
        const res = await fetch(`${API_BASE}/api/mitra/languages`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const bodyText = await res.text();
          throw new Error(bodyText || `Failed to fetch languages (${res.status})`);
        }

        const data = await res.json();
        if (cancelled) return;

        const rawLanguages: any[] = Array.isArray(data?.languages) ? data.languages : [];
        const serverLanguages: LanguageOption[] = rawLanguages
          .filter((lang) => lang && typeof lang.key === 'string')
          .map((lang: any) => ({
            key: String(lang.key),
            label:
              typeof lang.label === 'string' && lang.label.trim()
                ? lang.label
                : String(lang.key),
            locale:
              typeof lang.locale === 'string' && lang.locale.trim()
                ? lang.locale
                : FALLBACK_LANGUAGES[0].locale,
            translatorDirective:
              typeof lang.translatorDirective === 'string'
                ? lang.translatorDirective
                : undefined,
          }));

        if (serverLanguages.length) {
          setLanguageOptions(serverLanguages);
          setLanguage((prev) => {
            if (serverLanguages.some((option) => option.key === prev)) {
              return prev;
            }
            return serverLanguages[0].key;
          });
        }
      } catch (err) {
        console.warn('Failed to load Mitra language options', err);
      }
    };

    languagesFetchedRef.current = true;
    void fetchLanguages();

    return () => {
      cancelled = true;
    };
  }, [loading, user, setLanguageOptions, setLanguage]);

  useEffect(() => {
    if (lastPipelineSummary) {
      activeVoiceSessionRef.current = lastPipelineSummary;
    }
  }, [lastPipelineSummary]);

  useEffect(() => {
    if (voicePipelineError) {
      setError(voicePipelineError);
    }
  }, [voicePipelineError]);

  useEffect(() => {
    setVoiceSupported(speechRecognitionAvailable && micSupported);
  }, [micSupported, speechRecognitionAvailable]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechRecognitionAvailable(false);
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    setSpeechRecognitionAvailable(true);

    if (!recognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;

      recognitionInstance.onstart = () => {
        setIsRecording(true);
        setEmotionalIntensity(0);
        setError("");
      };

      recognitionInstance.onend = () => {
        setIsRecording(false);
        setEmotionalIntensity(0);
        if (finalizeTimeoutRef.current === null) {
          finalizeTimeoutRef.current = window.setTimeout(() => {
            finalizeTimeoutRef.current = null;
            void finalizeVoiceSession();
          }, 400);
        }
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        void finalizeVoiceSession();
        let errorMessage = 'Voice recognition failed.';
        switch (event.error) {
          case 'network':
            errorMessage = 'Network error. Please check your connection.';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone access.';
            break;
          case 'no-speech':
            errorMessage = 'No speech detected. Please try again.';
            break;
          case 'aborted':
            errorMessage = 'Voice recognition was cancelled.';
            break;
          default:
            errorMessage = `Voice recognition error: ${event.error}`;
        }
        setError(errorMessage);
      };

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);

        const intensity = analyzeEmotionalIntensity(transcript);
        setEmotionalIntensity(intensity);

        (async () => {
          await handleVoiceMessage(transcript, intensity);
        })().catch((err) => {
          console.error('Voice message handling failed', err);
          setError('Voice message could not be processed.');
        });
      };

      recognitionInstance.lang = getLocaleForLanguage(language);
      setRecognition(recognitionInstance);
      return;
    }

    recognition.lang = getLocaleForLanguage(language);
  }, [language, recognition, finalizeVoiceSession, getLocaleForLanguage]);

  useEffect(() => {
    return () => {
      if (recognition) {
        try {
          recognition.abort();
        } catch (abortError) {
          console.warn('Speech recognition abort failed on cleanup', abortError);
        }
      }
      if (finalizeTimeoutRef.current !== null) {
        window.clearTimeout(finalizeTimeoutRef.current);
        finalizeTimeoutRef.current = null;
      }
    };
  }, [recognition]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => () => {
    if (audioPlaybackRef.current) {
      try {
        audioPlaybackRef.current.pause();
      } catch (err) {
        console.warn('Failed to pause audio playback during cleanup', err);
      }
      audioPlaybackRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!voicePlaybackEnabled && audioPlaybackRef.current) {
      try {
        audioPlaybackRef.current.pause();
      } catch (err) {
        console.warn('Failed to pause audio when disabling playback', err);
      }
      audioPlaybackRef.current = null;
      setVoicePlaybackPending(false);
    }
    if (!voicePlaybackEnabled) {
      setVoicePlaybackPending(false);
    }
  }, [voicePlaybackEnabled]);

  const blobToBase64 = useCallback((blob: Blob) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result === "string") {
          const base64 = result.includes(",") ? result.split(",").pop() || "" : result;
          resolve(base64);
        } else {
          reject(new Error("Failed to encode audio."));
        }
      };
      reader.onerror = () => reject(reader.error ?? new Error("Audio encoding failed."));
      reader.readAsDataURL(blob);
    });
  }, []);

  const transcribeVoice = useCallback(
    async (blob: Blob, mimeType?: string) => {
      const audioBase64 = await blobToBase64(blob);
      const token = await getIdToken();
      const res = await fetch(`${API_BASE}/api/mitra/transcribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          audioBase64,
          mimeType,
          language: getLocaleForLanguage(language),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Transcription failed");
      }
      return data as {
        transcript: string;
        confidence: number;
        languageCode: string;
        words: unknown[];
        meta?: Record<string, unknown>;
      };
    },
    [blobToBase64, language, getLocaleForLanguage]
  );

  // Analyze emotional intensity from speech text
  const analyzeEmotionalIntensity = (text: string): number => {
    const lowerText = text.toLowerCase();

    // Keywords indicating high emotional intensity
    const highIntensityWords = [
      'hate', 'angry', 'furious', 'rage', 'hate', 'despise', 'loath',
      'terrible', 'awful', 'horrible', 'worst', 'suck', 'hate',
      'depressed', 'anxious', 'panic', 'scared', 'terrified', 'fear',
      'overwhelmed', 'stressed', 'breakdown', 'crisis', 'emergency',
      'help', 'please', 'begging', 'desperate', 'urgent'
    ];

    // Keywords indicating medium emotional intensity
    const mediumIntensityWords = [
      'sad', 'upset', 'worried', 'concerned', 'frustrated', 'annoyed',
      'disappointed', 'tired', 'exhausted', 'overwhelmed', 'stressed',
      'confused', 'lost', 'unsure', 'doubt', 'question', 'wonder'
    ];

    // Check for exclamation marks and question marks (indicators of intensity)
    const punctuationCount = (text.match(/[!?]/g) || []).length;
    const wordCount = text.split(' ').length;

    let intensity = 0;

    // Count high intensity words
    highIntensityWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) intensity += matches.length * 3;
    });

    // Count medium intensity words
    mediumIntensityWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) intensity += matches.length * 1.5;
    });

    // Add intensity based on punctuation density
    intensity += (punctuationCount / wordCount) * 2;

    // Cap intensity at 10
    return Math.min(Math.max(intensity, 0), 10);
  };

  const sendConversationRequest = async ({
    messageText,
    intensity,
    source,
    voiceSummary,
    history,
    transcriptionMeta,
  }: {
    messageText: string;
    intensity: number;
    source: "text" | "voice";
    voiceSummary?: VoiceSessionSummary | null;
    history: { role: "user" | "assistant"; text: string }[];
    transcriptionMeta?: {
      transcript: string;
      confidence: number;
      languageCode: string;
      words?: unknown[];
    } | null;
  }): Promise<ConversationResult> => {
    const token = await getIdToken();
    const clientMetadata: Record<string, unknown> = {
      source,
      emotionalIntensity: intensity,
      voicePipelineVersion: VOICE_PIPELINE_VERSION,
      speechRecognitionAvailable,
      micSupported,
      pipelineActive,
      language,
      languageLocale: getLocaleForLanguage(language),
      mode,
      historyLength: history.length,
    };

    if (voiceSummary) {
      clientMetadata.voiceSession = voiceSummary;
    }

    if (transcriptionMeta) {
      clientMetadata.transcription = transcriptionMeta;
    }

    if (typeof window !== 'undefined') {
      clientMetadata.userAgent = navigator.userAgent;
      try {
        clientMetadata.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      } catch {
        clientMetadata.timezone = 'unknown';
      }
    }

    const res = await fetch(`${API_BASE}/api/mitra/conversation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: messageText,
        mode,
        language,
        history,
        includeJournalContext,
        metadata: {
          client: clientMetadata,
        },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Conversation failed");
    }
    return data as ConversationResult;
  };

  const speakAssistantResponse = useCallback(
    async (text: string, responseLanguage: string) => {
      if (!voicePlaybackEnabled) return;
      const trimmed = text?.trim();
      if (!trimmed) return;

      let audioInstance: HTMLAudioElement | null = null;
      setVoicePlaybackPending(true);

      try {
        const token = await getIdToken();
        const res = await fetch(`${API_BASE}/api/mitra/speak`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            text: trimmed,
            language: responseLanguage || language,
          }),
        });

        const payload = await res.json();
        if (!res.ok) {
          throw new Error(payload?.error || "Speech synthesis failed");
        }

        const mime = payload?.mimeType || "audio/mpeg";
        const audioBase64 = payload?.audioBase64;
        if (!audioBase64 || typeof audioBase64 !== "string") {
          throw new Error("Speech synthesis returned empty audio content");
        }

        const audioSrc = `data:${mime};base64,${audioBase64}`;
        audioInstance = new Audio(audioSrc);

        if (audioPlaybackRef.current) {
          try {
            audioPlaybackRef.current.pause();
          } catch (pauseError) {
            console.warn("Failed to pause previous audio", pauseError);
          }
        }

        audioPlaybackRef.current = audioInstance;

        audioInstance.onended = () => {
          if (audioPlaybackRef.current === audioInstance) {
            audioPlaybackRef.current = null;
          }
          setVoicePlaybackPending(false);
        };

        audioInstance.onerror = (event) => {
          console.error("Assistant audio playback error", event);
          if (audioPlaybackRef.current === audioInstance) {
            audioPlaybackRef.current = null;
          }
          setVoicePlaybackPending(false);
        };

        const playPromise = audioInstance.play();
        if (playPromise && typeof playPromise.then === "function") {
          await playPromise.catch((err) => {
            throw err || new Error("Audio playback interrupted");
          });
        }
      } catch (error) {
        console.error("Assistant speech playback failed", error);
        if (audioPlaybackRef.current === audioInstance) {
          audioPlaybackRef.current = null;
        }
        setVoicePlaybackPending(false);
        setError((prev) => prev || "Speech playback unavailable right now. Showing text only.");
      }
    },
    [voicePlaybackEnabled, language]
  );

  // Handle voice message with emotional context
  const handleVoiceMessage = async (transcript: string, intensity: number) => {
    setSending(true);
    setError("");

    let finalTranscript = transcript.trim();
    let transcriptionMeta: {
      transcript: string;
      confidence: number;
      languageCode: string;
      words?: unknown[];
    } | null = null;

    let stopResult: VoiceSessionStopResult | null = null;
    let voiceSummary: VoiceSessionSummary | null = null;

    try {
      stopResult = await finalizeVoiceSession();
      voiceSummary = stopResult?.summary ?? activeVoiceSessionRef.current ?? null;
      if (stopResult) {
        lastVoiceStopResultRef.current = null;
      }
    } catch (stopError) {
      console.error('Voice session finalization failed', stopError);
    }

    try {
      if (stopResult?.audioBlob) {
        const transcription = await transcribeVoice(stopResult.audioBlob, stopResult.mimeType);
        if (transcription?.transcript) {
          finalTranscript = transcription.transcript.trim() || finalTranscript;
        }
        transcriptionMeta = {
          transcript: transcription?.transcript ?? finalTranscript,
          confidence: transcription?.confidence ?? 0,
          languageCode: transcription?.languageCode ?? getLocaleForLanguage(language),
          words: transcription?.words,
        };
      }
    } catch (transcriptionError) {
      console.error('Transcription failed', transcriptionError);
      setError('Voice transcription encountered an issue. Using the captured transcript.');
    }

    if (!finalTranscript) {
      setSending(false);
      setEmotionalIntensity(0);
      setError('We could not capture your voice message. Please try again.');
      return;
    }

    const transcriptSource: "webSpeech" | "vertex" = transcriptionMeta ? "vertex" : "webSpeech";

    const userMessage: ChatMessage = {
      text: finalTranscript,
      role: "user",
      meta: {
        source: "voice",
        intensity,
        transcriptionConfidence: transcriptionMeta?.confidence,
        transcriptSource,
      },
    };

    const historyPayload = mapHistory([...messages, userMessage]);
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const conversation = await sendConversationRequest({
        messageText: appendEmotionalContext(finalTranscript, intensity),
        intensity,
        source: "voice",
        voiceSummary,
        history: historyPayload,
        transcriptionMeta,
      });

      const emotionAnalysis = conversation.meta?.emotionAnalysis as EmotionInsights | undefined;

      if (conversation.response?.text) {
        setMessages((prev) => [
          ...prev,
          {
            text: conversation.response.text,
            role: "assistant",
            meta: {
              emotion: conversation.emotion,
              strategy: emotionAnalysis?.strategy,
              sentiment: emotionAnalysis?.sentiment,
              needs: emotionAnalysis?.needs,
              toneKeywords: emotionAnalysis?.tone?.keywords,
              warnings: conversation.meta?.warnings,
              source: "voice",
            },
          },
        ]);
        void speakAssistantResponse(conversation.response.text, conversation.response?.language || language);
      }
      if (conversation.emotion) {
        setLastEmotion(conversation.emotion);
      }

      if (emotionAnalysis) {
        setLastEmotionInsights(emotionAnalysis);
      }

      if (conversation.meta?.warnings?.length) {
        console.warn('Conversation warnings:', conversation.meta.warnings);
      }
    } catch (e: unknown) {
      console.error('Voice conversation failed', e);
      setError(e instanceof Error ? e.message : "An error occurred while processing the voice message.");
    } finally {
      setSending(false);
      setEmotionalIntensity(0);
    }
  };

  // Start voice recording
  const startVoiceRecording = () => {
    if (!recognition) {
      setError('Voice recognition is not available in this browser.');
      return;
    }
    if (isRecording || sending) return;
    if (!micSupported) {
      setError('Microphone access is unavailable or denied.');
      return;
    }
    startVoicePipeline()
      .then((session) => {
        if (!session) {
          setError('Unable to start voice pipeline. Please check microphone permissions.');
          return;
        }
        activeVoiceSessionRef.current = session;
        try {
          recognition.start();
        } catch (error) {
          console.error('Failed to start voice recognition:', error);
          setError('Voice recognition could not start. Please try again.');
          void finalizeVoiceSession();
        }
      })
      .catch((error) => {
        console.error('Voice pipeline failed to start', error);
        setError('Microphone access failed. Please ensure permissions are granted.');
      });
  };

  // Stop voice recording
  const stopVoiceRecording = () => {
    if (recognition && (isRecording || pipelineActive)) {
      try {
        recognition.stop();
      } catch (error) {
        console.warn('Failed to stop recognition cleanly', error);
      }
    }
    if (finalizeTimeoutRef.current === null) {
      finalizeTimeoutRef.current = window.setTimeout(() => {
        finalizeTimeoutRef.current = null;
        void finalizeVoiceSession();
      }, 500);
    }
  };

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    setSending(true);
    setError("");
    const intensity = analyzeEmotionalIntensity(trimmed);
    const userMessage: ChatMessage = {
      text: trimmed,
      role: "user",
      meta: {
        source: "text",
        intensity,
      },
    };

    const historyPayload = mapHistory([...messages, userMessage]);
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const conversation = await sendConversationRequest({
        messageText: appendEmotionalContext(trimmed, intensity),
        intensity,
        source: "text",
        history: historyPayload,
      });

      const emotionAnalysis = conversation.meta?.emotionAnalysis as EmotionInsights | undefined;

      if (conversation.response?.text) {
        setMessages((prev) => [
          ...prev,
          {
            text: conversation.response.text,
            role: "assistant",
            meta: {
              emotion: conversation.emotion,
              strategy: emotionAnalysis?.strategy,
              sentiment: emotionAnalysis?.sentiment,
              needs: emotionAnalysis?.needs,
              toneKeywords: emotionAnalysis?.tone?.keywords,
              warnings: conversation.meta?.warnings,
              source: "text",
            },
          },
        ]);
        void speakAssistantResponse(conversation.response.text, conversation.response?.language || language);
      }
      if (conversation.emotion) {
        setLastEmotion(conversation.emotion);
      }
      if (emotionAnalysis) {
        setLastEmotionInsights(emotionAnalysis);
      }
      if (conversation.meta?.warnings?.length) {
        console.warn('Conversation warnings:', conversation.meta.warnings);
      }
    } catch (err: unknown) {
      console.error('Conversation request failed', err);
      setError(err instanceof Error ? err.message : "An error occurred while sending the message.");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please sign in to chat with Mitra.</div>;

  return (
    <>
      {showAnimation && (
        <ZenPortalAnimation onComplete={() => setShowAnimation(false)} />
      )}
      <div className="relative flex flex-col h-[100dvh] overflow-hidden bg-gradient-to-br from-slate-50 via-emerald-50/30 to-cyan-50/30 dark:from-slate-900 dark:via-emerald-950/30 dark:to-cyan-950/30">

        {/* Header */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 px-4 py-3 shadow bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-white/20 dark:border-gray-700/50">
          <div className="font-bold text-lg text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <span className="text-3xl">🧞‍♂️</span>
            <div>
              <span>Mitra</span>
              <span className="text-base text-slate-500 dark:text-slate-400">(मित्र)</span>
            </div>
          </div>
          <div className="flex gap-3 items-center flex-wrap justify-end">
            {/* Last assistant emotion indicator */}
            {lastEmotion && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-sky-100 to-indigo-100 dark:from-sky-900/30 dark:to-indigo-900/30 border border-sky-200 dark:border-sky-700/50">
                <span className="text-sm font-medium text-sky-700 dark:text-sky-300">
                  Tone: {lastEmotion.label}
                </span>
                <span className="text-xs text-sky-600 dark:text-sky-400">
                  {((lastEmotion.confidence ?? 0) * 100).toFixed(0)}%
                </span>
              </div>
            )}

            {lastEmotionInsights && (
              <button
                type="button"
                onClick={() => setShowRecapModal(true)}
                className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-violet-100 to-pink-100 dark:from-violet-900/30 dark:to-pink-900/30 border border-violet-200 dark:border-violet-700/40 text-xs md:text-sm text-violet-700 dark:text-violet-200 transition hover:shadow"
                title="Open session emotion recap"
              >
                <span className="font-semibold capitalize">{lastEmotionInsights.emotion.label}</span>
                <span className="hidden md:inline text-violet-600/80 dark:text-violet-200/80">
                  {lastEmotionInsights.strategy?.type || 'validate'}
                </span>
                <span className="text-[10px] md:text-xs text-violet-500 dark:text-violet-300">
                  {(lastEmotionInsights.emotion.confidence * 100).toFixed(0)}% · {(lastEmotionInsights.emotion.intensity ?? 0).toFixed(2)}
                </span>
              </button>
            )}

            {/* Emotional Intensity Indicator */}
            {emotionalIntensity > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700/50">
                <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                  Emotional Intensity: {emotionalIntensity.toFixed(1)}/10
                </span>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i < Math.round(emotionalIntensity / 2)
                          ? 'bg-red-500'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Recording Status */}
            {(isRecording || pipelineActive) && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 animate-pulse-gentle">
                <span className="text-sm font-medium text-red-700 dark:text-red-300">🎤 Listening...</span>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                </div>
                <div className="w-16 h-2 bg-white/60 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all duration-150"
                    style={{ width: `${Math.min(100, Math.max(0, voiceLevel * 100))}%` }}
                  />
                </div>
              </div>
            )}

            <LanguageSwitcher options={languageOptions} value={language} onChange={setLanguage} />

            <button
              type="button"
              onClick={() => setVoicePlaybackEnabled((prev) => !prev)}
              className={`px-3 py-1 rounded-full text-xs md:text-sm font-medium transition flex items-center gap-1 border ${
                voicePlaybackEnabled
                  ? 'bg-emerald-500 text-white border-emerald-600 shadow'
                  : 'bg-white/70 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'
              }`}
              title={voicePlaybackEnabled ? 'Click to disable assistant speech playback' : 'Click to enable assistant speech playback'}
            >
              {voicePlaybackEnabled ? '🔊 Auto-voice' : '🔇 Text only'}
              {voicePlaybackPending && (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="relative z-10 flex-1 overflow-y-auto px-4 py-6">
          {messages.length === 0 && (
            <div className="text-center text-slate-500 dark:text-slate-400 mt-16 animate-fade-in">
              <div className="text-6xl mb-4">🧞‍♂️</div>
              <p className="text-xl font-light mb-2">Your gentle AI companion awaits</p>
              <p className="text-sm font-light mb-4">Share what&apos;s in your heart - I&apos;m here to listen with compassion</p>
              {voiceSupported && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-700/50">
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-2">🎤 Voice Input Available</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    Click the microphone button to speak your thoughts. I&apos;ll route your audio through our new voice pipeline, detect emotional intensity, and respond through the upgraded conversation engine.
                  </p>
                </div>
              )}
              {!voiceSupported && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-700/50">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-2">🎤 Voice Input Not Available</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Voice input requires a compatible browser (Chrome, Edge, Safari). Please use text input or update your browser.
                  </p>
                </div>
              )}
            </div>
          )}
          {messages.map((msg, i) => (
            <MessageBubble key={i} text={msg.text} fromUser={msg.role === "user"} meta={msg.meta} />
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <form
          onSubmit={sendMessage}
          className="relative z-10 flex items-center gap-3 px-4 py-4 bg-white/90 dark:bg-slate-800/90 border-t border-white/20 dark:border-slate-700/50 backdrop-blur-sm"
        >
          <input
            type="text"
            className="flex-1 rounded-2xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/20 bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm border-slate-200 dark:border-slate-600 focus:border-emerald-400 transition-all duration-300 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
            placeholder="Share what's on your mind..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
            autoFocus
          />

          {/* Voice Recording Button */}
          {voiceSupported ? (
            <button
              type="button"
              onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
              className={`p-3 rounded-full transition-colors ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse-gentle shadow-lg shadow-red-500/50'
                  : 'bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/30'
              } text-white disabled:opacity-60`}
              disabled={sending || !voiceSupported}
              title={isRecording ? 'Stop recording and send message' : 'Start voice input'}
            >
              {isRecording ? (
                <div className="flex items-center gap-1">
                  <span className="text-lg">⏹️</span>
                </div>
              ) : (
                <span className="text-lg">🎤</span>
              )}
            </button>
          ) : (
            <div className="p-3 rounded-full bg-gray-400 text-white cursor-not-allowed" title="Voice input not supported in this browser">
              <span className="text-lg">🎤❌</span>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary disabled:opacity-60 transition-colors"
            disabled={sending || !input.trim()}
          >
            {sending ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                <span className="text-lg">✨</span>
                Send
              </span>
            )}
          </button>
        </form>

        {/* Floating Mode Toggle */}
        <div className="fixed bottom-28 right-4 z-20 flex flex-col gap-3">
          {MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`glass-card px-4 py-3 flex items-center gap-3 text-sm font-medium transition-colors border-2 ${
                mode === m.key
                ? "bg-emerald-500 text-white border-emerald-600 shadow-lg"
                : "bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-white/30 dark:border-slate-600/50 hover:bg-white/90 dark:hover:bg-slate-800/90"
            }`}
            style={{ minWidth: 140 }}
          >
              <span className="text-xl">{m.icon}</span>
              <span>{m.label}</span>
            </button>
          ))}
          
          {/* Journal Context Toggle */}
          <button
            onClick={() => setIncludeJournalContext(!includeJournalContext)}
            className={`glass-card px-4 py-3 flex items-center gap-3 text-sm font-medium transition-colors border-2 ${
              includeJournalContext
              ? "bg-indigo-500 text-white border-indigo-600 shadow-lg"
              : "bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-white/30 dark:border-slate-600/50 hover:bg-white/90 dark:hover:bg-slate-800/90"
          }`}
          style={{ minWidth: 140 }}
          title="Include your recent journal entries in the conversation context"
        >
            <span className="text-xl">📔</span>
            <span>Journal Memory</span>
          </button>
        </div>

        {error && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 glass-card bg-red-50/90 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-6 py-3 rounded-2xl shadow-lg border-red-200/50 dark:border-red-700/50 animate-fade-in-gentle">
            {error}
          </div>
        )}
        {showRecapModal && lastEmotionInsights && (
          <EmotionRecapModal insights={lastEmotionInsights} onClose={() => setShowRecapModal(false)} />
        )}
      </div>
    </>
  );
}
