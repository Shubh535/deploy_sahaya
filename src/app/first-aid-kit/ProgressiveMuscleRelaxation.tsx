"use client";
import { useState, useEffect, useRef } from 'react';

interface MuscleGroup {
  name: string;
  instruction: string;
  duration: number; // seconds
}

const MUSCLE_GROUPS: MuscleGroup[] = [
  { name: 'Hands & Forearms', instruction: 'Make tight fists with both hands. Hold the tension... Now release and feel the relaxation.', duration: 10 },
  { name: 'Upper Arms', instruction: 'Bend your elbows and tense your biceps. Feel the tension... Now let go and relax.', duration: 10 },
  { name: 'Shoulders', instruction: 'Raise your shoulders up towards your ears. Hold... Now drop them down and release.', duration: 10 },
  { name: 'Neck', instruction: 'Gently tilt your head back and feel tension in your neck. Hold... Now return to neutral and relax.', duration: 10 },
  { name: 'Face & Jaw', instruction: 'Scrunch up your face and clench your jaw. Hold the tension... Now let your face go soft.', duration: 10 },
  { name: 'Chest & Back', instruction: 'Take a deep breath and hold it while arching your back slightly. Hold... Now exhale and release.', duration: 10 },
  { name: 'Stomach', instruction: 'Tighten your stomach muscles as if bracing for impact. Hold... Now release completely.', duration: 10 },
  { name: 'Legs & Feet', instruction: 'Point your toes and tense your leg muscles. Feel the tension... Now release and let your legs go heavy.', duration: 10 }
];

export default function ProgressiveMuscleRelaxation() {
  const [isActive, setIsActive] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<'intro' | 'tense' | 'release' | 'rest' | 'complete'>('intro');
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(600); // 10 minutes default
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const currentGroup = MUSCLE_GROUPS[currentIndex];
  const progress = ((currentIndex + 1) / MUSCLE_GROUPS.length) * 100;

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85; // Slower, calming pace
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Try to find a calm voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.name.includes('Female') || 
        v.name.includes('Natural') || 
        v.name.includes('Samantha')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startSession = () => {
    setIsActive(true);
    setCurrentIndex(0);
    setPhase('intro');
    setTimeLeft(5);
    speak('Welcome to Progressive Muscle Relaxation. Find a comfortable position. We will work through eight muscle groups, tensing and releasing each one. Let\'s begin.');
  };

  const stopSession = () => {
    setIsActive(false);
    setPhase('intro');
    setCurrentIndex(0);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Move to next phase
          if (phase === 'intro') {
            setPhase('tense');
            speak(`Now, ${currentGroup.name}. ${currentGroup.instruction.split('.')[0]}.`);
            return 5; // 5 seconds to tense
          } else if (phase === 'tense') {
            setPhase('release');
            speak('Release. Feel the tension flowing away.');
            return 5; // 5 seconds to release
          } else if (phase === 'release') {
            setPhase('rest');
            speak('Notice the difference between tension and relaxation.');
            return 3; // 3 seconds to rest
          } else if (phase === 'rest') {
            // Move to next muscle group
            if (currentIndex < MUSCLE_GROUPS.length - 1) {
              setCurrentIndex(currentIndex + 1);
              setPhase('tense');
              const nextGroup = MUSCLE_GROUPS[currentIndex + 1];
              speak(`Next, ${nextGroup.name}. ${nextGroup.instruction.split('.')[0]}.`);
              return 5;
            } else {
              // Session complete
              setPhase('complete');
              speak('Wonderful. You have completed the full body relaxation. Take a moment to notice how calm and relaxed your body feels. When you are ready, slowly open your eyes.');
              setIsActive(false);
              return 0;
            }
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, phase, currentIndex, currentGroup]);

  // Load voices on component mount
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 shadow-lg border border-purple-100 animate-fadein">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-4xl">🧘‍♀️</span>
        <div>
          <div className="text-xl font-semibold text-purple-700">Progressive Muscle Relaxation</div>
          <div className="text-sm text-purple-600">Release tension through guided body awareness</div>
        </div>
      </div>

      {!isActive && phase !== 'complete' ? (
        <div className="text-center space-y-4 w-full max-w-md">
          <p className="text-sm text-slate-600">
            This 10-minute guided session will help you systematically tense and release 
            each muscle group, promoting deep physical and mental relaxation.
          </p>
          <div className="flex flex-col gap-2 text-xs text-slate-500 bg-white/60 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <span>✓</span>
              <span>Find a quiet, comfortable place to sit or lie down</span>
            </div>
            <div className="flex items-start gap-2">
              <span>✓</span>
              <span>Turn on your device volume for voice guidance</span>
            </div>
            <div className="flex items-start gap-2">
              <span>✓</span>
              <span>You'll work through 8 muscle groups</span>
            </div>
            <div className="flex items-start gap-2">
              <span>✓</span>
              <span>Tense for 5 seconds, then release for 5 seconds</span>
            </div>
          </div>
          <button
            onClick={startSession}
            className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            Start 10-Minute Session
          </button>
        </div>
      ) : phase === 'complete' ? (
        <div className="text-center space-y-4 animate-fade-in-gentle">
          <div className="text-6xl mb-4">✨</div>
          <div className="text-2xl font-semibold text-purple-700">Session Complete!</div>
          <p className="text-slate-600 max-w-md">
            You've successfully relaxed all major muscle groups. Notice how calm and 
            grounded you feel.
          </p>
          <button
            onClick={() => {
              setPhase('intro');
              setCurrentIndex(0);
            }}
            className="px-6 py-2 rounded-lg bg-purple-500 text-white font-semibold shadow hover:bg-purple-600 transition"
          >
            Start New Session
          </button>
        </div>
      ) : (
        <div className="w-full space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-purple-600">
              <span>Group {currentIndex + 1} of {MUSCLE_GROUPS.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-purple-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Current Muscle Group */}
          <div className="bg-white/80 backdrop-blur rounded-xl p-6 text-center space-y-3">
            <div className="text-2xl font-bold text-purple-700">
              {currentGroup.name}
            </div>
            <div className="text-3xl font-mono font-bold text-pink-600">
              {timeLeft}s
            </div>
            <div className="text-lg capitalize">
              {phase === 'tense' && '💪 Tense'}
              {phase === 'release' && '🌊 Release'}
              {phase === 'rest' && '😌 Rest'}
            </div>
            <p className="text-sm text-slate-600 max-w-sm mx-auto">
              {phase === 'tense' && 'Hold the tension...'}
              {phase === 'release' && 'Let go and feel the relaxation...'}
              {phase === 'rest' && 'Notice how relaxed this area feels...'}
            </p>
          </div>

          {/* Breathing Reminder */}
          <div className="text-center text-xs text-purple-600 animate-pulse">
            {phase === 'tense' ? '💨 Breathe in' : '💨 Breathe out slowly'}
          </div>

          {/* Stop Button */}
          <button
            onClick={stopSession}
            className="w-full px-4 py-2 rounded-lg bg-slate-300 hover:bg-slate-400 text-slate-700 font-semibold transition"
          >
            Stop Session
          </button>
        </div>
      )}

      <div className="text-xs text-slate-500 text-center max-w-md">
        💡 Tip: This technique is especially helpful before bed or during high-stress moments.
        Practice regularly for best results.
      </div>
    </div>
  );
}
