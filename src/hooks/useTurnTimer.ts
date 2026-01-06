import { useState, useEffect, useCallback, useRef } from 'react';

interface UseTurnTimerProps {
  enabled: boolean;
  seconds: number;
  currentTurn: 'tiger' | 'goat';
  gameOver: string | null;
  isConnected: boolean;
  isHost: boolean;
  onTimeUp: () => void;
  onSync: (value: number) => void;
}

interface UseTurnTimerReturn {
  timeLeft: number;
  isLow: boolean;
  resetTimer: () => void;
}

export function useTurnTimer({
  enabled,
  seconds,
  currentTurn,
  gameOver,
  isConnected,
  isHost,
  onTimeUp,
  onSync,
}: UseTurnTimerProps): UseTurnTimerReturn {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTurnRef = useRef(currentTurn);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    setTimeLeft(seconds);
  }, [seconds]);

  // Reset timer when turn changes
  useEffect(() => {
    if (currentTurn !== lastTurnRef.current) {
      lastTurnRef.current = currentTurn;
      setTimeLeft(seconds);
    }
  }, [currentTurn, seconds]);

  // Reset when seconds setting changes
  useEffect(() => {
    setTimeLeft(seconds);
  }, [seconds]);

  // Main countdown
  useEffect(() => {
    if (!enabled || gameOver || !isConnected) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onTimeUp();
          return seconds; // Reset for next turn
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, gameOver, isConnected, seconds, onTimeUp]);

  // Sync timer every 5 seconds (host only)
  useEffect(() => {
    if (!enabled || !isConnected || !isHost) {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      return;
    }

    syncIntervalRef.current = setInterval(() => {
      onSync(timeLeft);
    }, 5000);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    };
  }, [enabled, isConnected, isHost, timeLeft, onSync]);

  const isLow = enabled && timeLeft <= 5 && timeLeft > 0;

  return {
    timeLeft,
    isLow,
    resetTimer,
  };
}
