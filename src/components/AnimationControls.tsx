import { memo } from 'react';
import {
  Camera,
  Play,
  Pause,
  Square,
  Trash2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import type { Frame } from '../types';
import type { PlaybackSpeed } from '../hooks/useAnimation';

interface AnimationControlsProps {
  frames: Frame[];
  isPlaying: boolean;
  progress: number;
  maxProgress: number;
  speed: PlaybackSpeed;
  onCaptureFrame: () => void;
  onDeleteFrame: (id: string) => void;
  onMoveFrame: (id: string, dir: -1 | 1) => void;
  onClearFrames: () => void;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeek: (progress: number) => void;
  onSpeedChange: (s: PlaybackSpeed) => void;
  onScrubStart: () => void;
  onScrubEnd: () => void;
}

const SPEEDS: { value: PlaybackSpeed; label: string }[] = [
  { value: 'slow', label: 'Lento' },
  { value: 'normal', label: 'Normal' },
  { value: 'fast', label: 'Rápido' },
];

function AnimationControls({
  frames,
  isPlaying,
  progress,
  maxProgress,
  speed,
  onCaptureFrame,
  onDeleteFrame,
  onMoveFrame,
  onClearFrames,
  onPlay,
  onPause,
  onStop,
  onSeek,
  onSpeedChange,
  onScrubStart,
  onScrubEnd,
}: AnimationControlsProps) {
  const canPlay = frames.length >= 2;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] text-text-muted leading-relaxed">
        Captura posiciones clave y reprodúcelas como una jugada animada.
      </p>

      {/* Capture */}
      <button
        onClick={onCaptureFrame}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg
                   bg-accent-500/15 hover:bg-accent-500/25 text-accent-300
                   border border-accent-500/25 transition-all cursor-pointer active:scale-[0.98]"
      >
        <Camera size={15} strokeWidth={2} />
        <span className="text-xs font-semibold">Capturar frame ({frames.length})</span>
      </button>

      {/* Frame list */}
      {frames.length > 0 && (
        <div className="flex flex-col gap-1 max-h-[160px] overflow-y-auto scrollbar-thin">
          {frames.map((f, idx) => {
            const isCurrent = Math.round(progress) === idx;
            return (
              <div
                key={f.id}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs transition-colors ${
                  isCurrent
                    ? 'bg-accent-500/15 border-accent-500/30 text-accent-200'
                    : 'bg-surface-700/40 border-border text-text-secondary'
                }`}
              >
                <button
                  onClick={() => onSeek(idx)}
                  className="flex-1 text-left font-semibold cursor-pointer"
                  title="Ir a este frame"
                >
                  Frame {idx + 1}
                </button>
                <button
                  onClick={() => onMoveFrame(f.id, -1)}
                  disabled={idx === 0}
                  className="p-0.5 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-default cursor-pointer"
                  title="Mover arriba"
                  aria-label="Mover frame arriba"
                >
                  <ChevronUp size={13} />
                </button>
                <button
                  onClick={() => onMoveFrame(f.id, 1)}
                  disabled={idx === frames.length - 1}
                  className="p-0.5 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-default cursor-pointer"
                  title="Mover abajo"
                  aria-label="Mover frame abajo"
                >
                  <ChevronDown size={13} />
                </button>
                <button
                  onClick={() => onDeleteFrame(f.id)}
                  className="p-0.5 rounded hover:bg-red-500/20 text-red-400/80 hover:text-red-400 cursor-pointer"
                  title="Eliminar frame"
                  aria-label="Eliminar frame"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Playback controls */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={isPlaying ? onPause : onPlay}
          disabled={!canPlay}
          className="flex items-center justify-center w-9 h-9 rounded-lg
                     bg-accent-500 hover:bg-accent-400 text-white
                     disabled:opacity-40 disabled:cursor-default
                     transition-all cursor-pointer active:scale-90 shrink-0"
          title={isPlaying ? 'Pausar' : 'Reproducir'}
          aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button
          onClick={onStop}
          disabled={!canPlay}
          className="flex items-center justify-center w-9 h-9 rounded-lg
                     bg-surface-700 hover:bg-surface-600 text-text-secondary hover:text-text-primary
                     border border-border disabled:opacity-40 disabled:cursor-default
                     transition-all cursor-pointer active:scale-90 shrink-0"
          title="Detener y volver al inicio"
          aria-label="Detener"
        >
          <Square size={14} />
        </button>

        {/* Scrubber */}
        <input
          type="range"
          min={0}
          max={maxProgress || 1}
          step={0.01}
          value={progress}
          disabled={!canPlay}
          onPointerDown={onScrubStart}
          onPointerUp={onScrubEnd}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="flex-1 accent-accent-500 cursor-pointer disabled:opacity-40"
          aria-label="Progreso de la animación"
        />
      </div>

      {/* Speed selector */}
      <div className="flex items-center gap-1">
        {SPEEDS.map((s) => (
          <button
            key={s.value}
            onClick={() => onSpeedChange(s.value)}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
              speed === s.value
                ? 'bg-accent-500/20 text-accent-300 border-accent-500/30'
                : 'bg-surface-700/40 text-text-secondary border-border hover:text-text-primary'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {frames.length > 0 && (
        <button
          onClick={onClearFrames}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg
                     bg-red-500/5 hover:bg-red-500/10 text-red-400/80 hover:text-red-400
                     border border-red-500/10 hover:border-red-500/20
                     transition-all cursor-pointer active:scale-[0.98]"
        >
          <Trash2 size={13} strokeWidth={2} />
          <span className="text-[11px] font-semibold">Borrar animación</span>
        </button>
      )}
    </div>
  );
}

export default memo(AnimationControls);
