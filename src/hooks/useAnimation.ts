import { useState, useRef, useCallback, useEffect } from 'react';
import type { Frame } from '../types';
import { interpolateFrames, type AnimatedState } from '../utils/animation';

export type PlaybackSpeed = 'slow' | 'normal' | 'fast';

/** Milliseconds spent traversing one segment (frame → next frame) per speed. */
const SPEED_MS: Record<PlaybackSpeed, number> = { slow: 1600, normal: 900, fast: 450 };

export interface Animation {
  isPlaying: boolean;
  /** Playhead in frame-index units (0 … frames.length-1) */
  progress: number;
  maxProgress: number;
  speed: PlaybackSpeed;
  /** Interpolated board while playing/scrubbing, else null (show live board) */
  override: AnimatedState | null;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (progress: number) => void;
  setSpeed: (s: PlaybackSpeed) => void;
  scrubStart: () => void;
  scrubEnd: () => void;
}

/**
 * useAnimation — drives play/pause/scrub over recorded key frames and produces
 * the interpolated board to render. Uses requestAnimationFrame (same batching
 * idea as usePercentDrag) and never mutates the live board, so playback creates
 * no autosave/history churn. The playhead is mirrored into a ref so the rAF
 * loop can advance it without re-subscribing to state each tick.
 */
export function useAnimation(frames: Frame[], live: AnimatedState): Animation {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>('normal');
  const [progress, setProgress] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const progressRef = useRef(0);

  const maxProgress = Math.max(0, frames.length - 1);

  const setProg = useCallback((p: number) => {
    progressRef.current = p;
    setProgress(p);
  }, []);

  // rAF playback loop — all setState happens inside the async rAF callback,
  // never synchronously in the effect body.
  useEffect(() => {
    if (!isPlaying) return;
    const segMs = SPEED_MS[speed];
    let raf = 0;
    let last = performance.now();
    const tick = (ts: number) => {
      const dt = ts - last;
      last = ts;
      const pos = progressRef.current + dt / segMs;
      if (pos >= maxProgress) {
        progressRef.current = maxProgress;
        setProgress(maxProgress);
        setIsPlaying(false);
        return;
      }
      progressRef.current = pos;
      setProgress(pos);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, speed, maxProgress]);

  const play = useCallback(() => {
    if (frames.length < 2) return;
    // Restart from the beginning if parked at (or past) the end.
    if (progressRef.current >= maxProgress) setProg(0);
    setIsPlaying(true);
  }, [frames.length, maxProgress, setProg]);

  const pause = useCallback(() => setIsPlaying(false), []);

  const stop = useCallback(() => {
    setIsPlaying(false);
    setProg(0);
  }, [setProg]);

  const seek = useCallback(
    (p: number) => setProg(Math.max(0, Math.min(maxProgress, p))),
    [maxProgress, setProg],
  );

  const scrubStart = useCallback(() => {
    setIsPlaying(false);
    setIsScrubbing(true);
  }, []);
  const scrubEnd = useCallback(() => setIsScrubbing(false), []);

  // Clamp for display so a shrunk frame list can't leave a stale over-range head.
  const safeProgress = Math.min(progress, maxProgress);
  const active = (isPlaying || isScrubbing) && frames.length >= 2;
  const override = active ? interpolateFrames(frames, safeProgress, live) : null;

  return {
    isPlaying,
    progress: safeProgress,
    maxProgress,
    speed,
    override,
    play,
    pause,
    stop,
    seek,
    setSpeed,
    scrubStart,
    scrubEnd,
  };
}
