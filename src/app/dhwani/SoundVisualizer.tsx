'use client';
import React, { useRef, useEffect } from 'react';
import { SoundscapeMode } from './useAdaptiveSoundscape';

interface SoundVisualizerProps {
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
  mode: SoundscapeMode;
  className?: string;
}

// Color schemes for different modes (more vibrant and soothing)
const MODE_COLORS: Record<SoundscapeMode, {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}> = {
  calm: {
    primary: 'rgba(34, 211, 238, 0.7)', // brighter cyan
    secondary: 'rgba(147, 197, 253, 0.5)', // blue
    accent: 'rgba(167, 243, 208, 0.6)', // green
    background: 'rgba(15, 23, 42, 0.2)', // more transparent dark blue
  },
  focus: {
    primary: 'rgba(251, 191, 36, 0.7)', // brighter amber
    secondary: 'rgba(251, 146, 60, 0.5)', // orange
    accent: 'rgba(252, 211, 77, 0.6)', // yellow
    background: 'rgba(30, 27, 75, 0.2)', // more transparent dark purple
  },
  sleep: {
    primary: 'rgba(167, 139, 250, 0.7)', // brighter purple
    secondary: 'rgba(196, 181, 253, 0.5)', // light purple
    accent: 'rgba(147, 197, 253, 0.6)', // blue
    background: 'rgba(17, 24, 39, 0.2)', // more transparent dark
  },
};

export default function SoundVisualizer({
  analyserNode,
  isPlaying,
  mode,
  className = '',
}: SoundVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    alpha: number;
  }>>([]);

  // Initialize particles (more particles for better effect)
  useEffect(() => {
    const particleCount = 50; // Increased from 30
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0003, // Slower for smoother motion
      vy: (Math.random() - 0.5) * 0.0003,
      radius: Math.random() * 2.5 + 0.5, // Smaller particles
      alpha: Math.random() * 0.4 + 0.4, // More visible
    }));
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize data array if we have an analyser
    if (analyserNode && !dataArrayRef.current) {
      dataArrayRef.current = new Uint8Array(analyserNode.frequencyBinCount);
    }

    const colors = MODE_COLORS[mode];
    let time = 0;

    const draw = () => {
      if (!canvas || !ctx) return;

      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;

      // Clear with smooth fade effect for trails
      ctx.fillStyle = colors.background;
      ctx.fillRect(0, 0, width, height);

      if (isPlaying && analyserNode && dataArrayRef.current) {
        // Get frequency data
        analyserNode.getByteFrequencyData(dataArrayRef.current);

        // Draw frequency bars with blur effect
        const barCount = 80; // More bars for smoother look
        const barWidth = width / barCount;
        const dataStep = Math.floor(dataArrayRef.current.length / barCount);

        ctx.shadowBlur = 15; // Add glow
        ctx.shadowColor = colors.primary;

        for (let i = 0; i < barCount; i++) {
          const dataIndex = i * dataStep;
          const value = dataArrayRef.current[dataIndex] / 255;
          const barHeight = value * height * 0.35; // Slightly shorter

          const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
          gradient.addColorStop(0, colors.primary);
          gradient.addColorStop(0.5, colors.secondary);
          gradient.addColorStop(1, colors.accent);

          ctx.fillStyle = gradient;
          ctx.fillRect(
            i * barWidth,
            height - barHeight,
            barWidth * 0.9, // Closer together
            barHeight
          );
        }

        ctx.shadowBlur = 0;

        // Draw waveform (center circle with breathing effect)
        const centerX = width / 2;
        const centerY = height / 2;
        const avgAmplitude = dataArrayRef.current.reduce((a, b) => a + b, 0) / dataArrayRef.current.length / 255;
        
        // Add breathing animation
        const breathe = Math.sin(time * 0.001) * 0.1 + 1;
        const baseRadius = Math.min(width, height) * 0.15 * breathe;
        const radius = baseRadius + avgAmplitude * 60;

        // Multiple glow layers for better effect
        for (let i = 0; i < 3; i++) {
          const glowGradient = ctx.createRadialGradient(
            centerX, centerY, radius * 0.3, 
            centerX, centerY, radius * (1.8 + i * 0.3)
          );
          glowGradient.addColorStop(0, colors.accent);
          glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.globalAlpha = 0.3 - i * 0.1;
          ctx.fillStyle = glowGradient;
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius * (1.8 + i * 0.3), 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalAlpha = 1;

        // Main circle with better gradient
        const circleGradient = ctx.createRadialGradient(
          centerX, centerY, 0, 
          centerX, centerY, radius
        );
        circleGradient.addColorStop(0, colors.accent);
        circleGradient.addColorStop(0.4, colors.secondary);
        circleGradient.addColorStop(1, colors.primary);
        ctx.fillStyle = circleGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw radial lines with smoother animation
        const lineCount = 48; // More lines
        ctx.lineWidth = 1.5;

        for (let i = 0; i < lineCount; i++) {
          const angle = (i / lineCount) * Math.PI * 2 + time * 0.0002; // Slow rotation
          const dataIndex = Math.floor((i / lineCount) * dataArrayRef.current.length);
          const value = dataArrayRef.current[dataIndex] / 255;
          
          const startX = centerX + Math.cos(angle) * radius;
          const startY = centerY + Math.sin(angle) * radius;
          const lineLength = value * 50 * breathe;
          const endX = centerX + Math.cos(angle) * (radius + lineLength);
          const endY = centerY + Math.sin(angle) * (radius + lineLength);

          const lineGradient = ctx.createLinearGradient(startX, startY, endX, endY);
          lineGradient.addColorStop(0, colors.primary);
          lineGradient.addColorStop(1, colors.accent);
          
          ctx.strokeStyle = lineGradient;
          ctx.globalAlpha = 0.7;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        // Update and draw particles with better glow
        particlesRef.current.forEach((particle) => {
          // Update position with slight influence from audio
          const audioInfluence = avgAmplitude * 0.0001;
          particle.x += particle.vx + audioInfluence;
          particle.y += particle.vy + audioInfluence;

          // Wrap around edges
          if (particle.x < 0) particle.x = 1;
          if (particle.x > 1) particle.x = 0;
          if (particle.y < 0) particle.y = 1;
          if (particle.y > 1) particle.y = 0;

          // Draw particle with enhanced glow
          const px = particle.x * width;
          const py = particle.y * height;

          // Multiple glow layers
          for (let g = 0; g < 2; g++) {
            const glowSize = particle.radius * (4 + g * 2);
            const particleGradient = ctx.createRadialGradient(px, py, 0, px, py, glowSize);
            particleGradient.addColorStop(0, colors.accent.replace(/[\d.]+\)/, `${particle.alpha * 0.6})`));
            particleGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = particleGradient;
            ctx.globalAlpha = 0.5 - g * 0.2;
            ctx.beginPath();
            ctx.arc(px, py, glowSize, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.globalAlpha = 1;

          // Particle core
          ctx.fillStyle = colors.primary.replace(/[\d.]+\)/, `${particle.alpha})`);
          ctx.beginPath();
          ctx.arc(px, py, particle.radius, 0, Math.PI * 2);
          ctx.fill();
        });
      } else {
        // Idle animation when not playing
        const centerX = width / 2;
        const centerY = height / 2;

        // Pulsing circle
        const pulseRadius = Math.min(width, height) * 0.1 + Math.sin(time * 0.02) * 10;
        
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseRadius);
        gradient.addColorStop(0, colors.secondary);
        gradient.addColorStop(1, colors.primary);
        
        ctx.fillStyle = gradient;
        ctx.globalAlpha = 0.5 + Math.sin(time * 0.02) * 0.2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Draw idle particles
        particlesRef.current.forEach((particle) => {
          particle.x += particle.vx * 0.5;
          particle.y += particle.vy * 0.5;

          if (particle.x < 0) particle.x = 1;
          if (particle.x > 1) particle.x = 0;
          if (particle.y < 0) particle.y = 1;
          if (particle.y > 1) particle.y = 0;

          const px = particle.x * width;
          const py = particle.y * height;

          ctx.fillStyle = colors.primary.replace('0.6', String(particle.alpha * 0.5));
          ctx.beginPath();
          ctx.arc(px, py, particle.radius, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      time++;
      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [analyserNode, isPlaying, mode]);

  return (
    <canvas
      ref={canvasRef}
      className={`${className} rounded-2xl`}
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)',
      }}
    />
  );
}
