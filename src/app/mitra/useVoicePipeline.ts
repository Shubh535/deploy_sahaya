"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface VoiceSessionSummary {
  sessionId: string;
  durationMs: number;
  averageDecibels: number;
  peakDecibels: number;
  sampleCount: number;
  startedAt: number;
}

interface VoicePipelineOptions {
  onLevelChange?: (level: number) => void;
}

export interface VoiceSessionStopResult {
  summary: VoiceSessionSummary;
  audioBlob?: Blob | null;
  mimeType?: string;
}

interface VoicePipelineState {
  start: () => Promise<VoiceSessionSummary | null>;
  stop: () => Promise<VoiceSessionStopResult | null>;
  isActive: boolean;
  audioSupported: boolean;
  level: number;
  lastSummary: VoiceSessionSummary | null;
  error: string | null;
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

const MIN_DECIBEL = -90;
const MAX_DECIBEL = -10;

export function useVoicePipeline(options: VoicePipelineOptions = {}): VoicePipelineState {
  const { onLevelChange } = options;
  const [audioSupported, setAudioSupported] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastSummary, setLastSummary] = useState<VoiceSessionSummary | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaChunksRef = useRef<BlobPart[]>([]);
  const mimeTypeRef = useRef<string>('audio/webm');
  const rafRef = useRef<number | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const startTimestampRef = useRef<number>(0);
  const averageAccumulatorRef = useRef<number>(0);
  const peakRef = useRef<number>(-Infinity);
  const sampleCountRef = useRef<number>(0);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const supported = Boolean(navigator?.mediaDevices?.getUserMedia);
    setAudioSupported(supported);
    if (!supported) {
      setError("Microphone access is not supported in this environment.");
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => undefined);
        audioContextRef.current = null;
      }
    };
  }, []);

  const stopRafLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const calculateLevel = useCallback(() => {
  const analyser = analyserRef.current;
  const dataArray = dataArrayRef.current;
    if (!analyser || !dataArray) return;

  analyser.getByteTimeDomainData(dataArray);
    let sumSquares = 0;
    for (let i = 0; i < dataArray.length; i += 1) {
      const normalizedSample = (dataArray[i] - 128) / 128;
      const sample = Number.isFinite(normalizedSample) ? normalizedSample : 0;
      sumSquares += sample * sample;
    }
    const rms = Math.sqrt(sumSquares / dataArray.length) || 1e-8;
    const decibels = 20 * Math.log10(rms);

    averageAccumulatorRef.current += decibels;
    sampleCountRef.current += 1;
    if (decibels > peakRef.current) peakRef.current = decibels;

    const normalized = Math.min(
      1,
      Math.max(0, (decibels - MIN_DECIBEL) / (MAX_DECIBEL - MIN_DECIBEL))
    );

    setLevel(normalized);
    if (onLevelChange) onLevelChange(normalized);

    rafRef.current = requestAnimationFrame(calculateLevel);
  }, [onLevelChange]);

  const stopInternal = useCallback(async (): Promise<VoiceSessionStopResult | null> => {
    if (!isActive && !mediaRecorderRef.current) {
      return null;
    }

    stopRafLoop();

    const recorder = mediaRecorderRef.current;
    let recordedBlob: Blob | null = null;

    if (recorder) {
      mediaRecorderRef.current = null;
      recordedBlob = await new Promise<Blob | null>((resolve) => {
        const finalize = () => {
          recorder.removeEventListener("stop", handleStop);
          recorder.removeEventListener("error", handleError);
          const rawBlob = mediaChunksRef.current.length
            ? new Blob(mediaChunksRef.current, { type: mimeTypeRef.current })
            : null;
          const blob = rawBlob && rawBlob.size > 0 ? rawBlob : null;
          mediaChunksRef.current = [];
          resolve(blob);
        };

        const handleStop = () => finalize();
        const handleError = (event: Event) => {
          const recorderError = (event as { error?: DOMException }).error;
          if (recorderError) {
            console.error("[voicePipeline] media recorder error", recorderError);
          }
          finalize();
        };

        recorder.addEventListener("stop", handleStop);
        recorder.addEventListener("error", handleError);

        try {
          if (recorder.state !== "inactive") {
            recorder.stop();
          } else {
            finalize();
          }
        } catch (recorderError) {
          console.error("[voicePipeline] failed to stop recorder", recorderError);
          finalize();
        }
      });
    } else {
      mediaChunksRef.current = [];
    }

    const tracks = streamRef.current?.getTracks() ?? [];
    tracks.forEach((track) => track.stop());
    streamRef.current = null;

    if (audioContextRef.current) {
      try {
        if (audioContextRef.current.state !== "closed") {
          await audioContextRef.current.close();
        }
      } catch (closeError) {
        console.warn("[voicePipeline] audio context close failed", closeError);
      }
      audioContextRef.current = null;
    }

    const durationMs = Math.max(0, performance.now() - startTimestampRef.current);
    const averageDecibels = sampleCountRef.current
      ? averageAccumulatorRef.current / sampleCountRef.current
      : MIN_DECIBEL;

    const summary: VoiceSessionSummary = {
      sessionId: sessionIdRef.current || `voice-${Date.now()}`,
      durationMs,
      averageDecibels,
      peakDecibels: peakRef.current === -Infinity ? MIN_DECIBEL : peakRef.current,
      sampleCount: sampleCountRef.current,
      startedAt: startTimestampRef.current,
    };

    setIsActive(false);
    setLevel(0);
    setLastSummary(summary);
    sessionIdRef.current = null;
    startTimestampRef.current = 0;
    averageAccumulatorRef.current = 0;
    peakRef.current = -Infinity;
    sampleCountRef.current = 0;
    dataArrayRef.current = null;

    return {
      summary,
      audioBlob: recordedBlob,
      mimeType: recordedBlob ? mimeTypeRef.current : undefined,
    };
  }, [isActive, stopRafLoop]);

  const start = useCallback(async () => {
    if (!audioSupported) {
      setError("Microphone support unavailable.");
      return null;
    }
    if (isActive) return null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextCtor) {
        throw new Error("AudioContext is not supported in this browser.");
      }
      const audioContext = new AudioContextCtor();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
  const bufferLength = analyser.fftSize;
  const byteBuffer = new ArrayBuffer(bufferLength);
  const dataArray = new Uint8Array<ArrayBuffer>(byteBuffer);

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

  mediaChunksRef.current = [];
  mimeTypeRef.current = 'audio/webm';
  if (typeof window !== 'undefined' && typeof MediaRecorder !== 'undefined') {
        try {
          const supportedMimeTypes = [
            'audio/webm;codecs=opus',
            'audio/ogg;codecs=opus',
            'audio/mp4',
            'audio/webm',
          ];

          const chosenMimeType = supportedMimeTypes.find((candidate) => {
            try {
              return MediaRecorder.isTypeSupported(candidate);
            } catch {
              return false;
            }
          });

          const recorder = chosenMimeType
            ? new MediaRecorder(stream, { mimeType: chosenMimeType })
            : new MediaRecorder(stream);

          mimeTypeRef.current = recorder.mimeType || chosenMimeType || 'audio/webm';
          recorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              mediaChunksRef.current.push(event.data);
            }
          };
          recorder.onerror = (event) => {
            const recorderError = (event as unknown as { error?: DOMException }).error;
            if (recorderError) {
              console.error('[voicePipeline] recorder error', recorderError);
              setError(recorderError.message);
            }
          };
          recorder.start();
          mediaRecorderRef.current = recorder;
        } catch (recorderError) {
          console.warn('[voicePipeline] MediaRecorder not available', recorderError);
          mediaRecorderRef.current = null;
        }
      } else {
        console.warn('[voicePipeline] MediaRecorder API is not supported');
        mediaRecorderRef.current = null;
      }

      sessionIdRef.current = typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
  : `voice-${Date.now()}`;
      startTimestampRef.current = performance.now();
      dataArrayRef.current = dataArray;
      streamRef.current = stream;
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      setIsActive(true);
      setError(null);
      calculateLevel();

      return {
        sessionId: sessionIdRef.current,
        durationMs: 0,
        averageDecibels: MIN_DECIBEL,
        peakDecibels: MIN_DECIBEL,
        sampleCount: 0,
        startedAt: startTimestampRef.current,
      } satisfies VoiceSessionSummary;
    } catch (err) {
      console.error("[voicePipeline] Failed to start microphone", err);
      setError(
        err instanceof Error
          ? err.message
          : "Microphone access failed. Please check permissions."
      );
      await stopInternal();
      return null;
    }
  }, [audioSupported, calculateLevel, isActive, stopInternal]);

  const stop = useCallback(async () => stopInternal(), [stopInternal]);

  return useMemo(
    () => ({
      start,
      stop,
      isActive,
      audioSupported,
      level,
      lastSummary,
      error,
    }),
    [audioSupported, error, isActive, lastSummary, level, start, stop]
  );
}
