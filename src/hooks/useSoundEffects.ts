import { useCallback, useRef } from 'react';

type SoundType = 'place' | 'move' | 'capture' | 'win' | 'lose' | 'select' | 'invalid';

// Create audio context lazily
const getAudioContext = (): AudioContext | null => {
  try {
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch {
    return null;
  }
};

export function useSoundEffects() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(true);

  const ensureAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = getAudioContext();
    }
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine', gain: number = 0.3) => {
    const ctx = ensureAudioContext();
    if (!ctx || !enabledRef.current) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    oscillator.type = type;

    gainNode.gain.setValueAtTime(gain, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }, [ensureAudioContext]);

  const playSound = useCallback((sound: SoundType) => {
    if (!enabledRef.current) return;

    switch (sound) {
      case 'place':
        // Soft placement sound - ascending notes
        playTone(440, 0.1, 'sine', 0.2);
        setTimeout(() => playTone(550, 0.1, 'sine', 0.15), 50);
        break;

      case 'move':
        // Quick slide sound
        playTone(330, 0.08, 'triangle', 0.2);
        setTimeout(() => playTone(440, 0.08, 'triangle', 0.15), 40);
        break;

      case 'capture':
        // Dramatic capture sound - descending with punch
        playTone(600, 0.15, 'sawtooth', 0.25);
        setTimeout(() => playTone(400, 0.1, 'sawtooth', 0.2), 80);
        setTimeout(() => playTone(200, 0.2, 'sawtooth', 0.15), 150);
        break;

      case 'select':
        // Short click sound
        playTone(800, 0.05, 'sine', 0.15);
        break;

      case 'win':
        // Victory fanfare - ascending major chord
        playTone(523, 0.3, 'sine', 0.2); // C5
        setTimeout(() => playTone(659, 0.3, 'sine', 0.2), 150); // E5
        setTimeout(() => playTone(784, 0.4, 'sine', 0.25), 300); // G5
        setTimeout(() => playTone(1047, 0.5, 'sine', 0.3), 450); // C6
        break;

      case 'lose':
        // Sad descending sound
        playTone(400, 0.3, 'sine', 0.2);
        setTimeout(() => playTone(350, 0.3, 'sine', 0.18), 200);
        setTimeout(() => playTone(300, 0.4, 'sine', 0.15), 400);
        break;

      case 'invalid':
        // Error buzz
        playTone(150, 0.15, 'square', 0.1);
        break;
    }
  }, [playTone]);

  const setEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled;
  }, []);

  return {
    playSound,
    setEnabled,
    isEnabled: () => enabledRef.current,
  };
}
