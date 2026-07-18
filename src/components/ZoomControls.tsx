import { memo } from 'react';
import { Plus, Minus, Maximize, Minimize, Magnet } from 'lucide-react';

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  snapEnabled: boolean;
  onToggleSnap: () => void;
  /** Compact sizing for the small mobile pitch */
  compact?: boolean;
  /** Where to pin the cluster inside the pitch container */
  placement: 'top' | 'bottom';
}

/**
 * ZoomControls — floating control cluster over the pitch:
 * zoom in/out, reset, snap-to-grid toggle and fullscreen.
 * Shared between the desktop and mobile layouts.
 */
function ZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  isFullscreen,
  onToggleFullscreen,
  snapEnabled,
  onToggleSnap,
  compact = false,
  placement,
}: ZoomControlsProps) {
  const size = isFullscreen ? 32 : compact ? 26 : 28;
  const iconSize = isFullscreen ? 16 : 14;
  const btnBase =
    'flex items-center justify-center rounded-lg transition-all duration-150 cursor-pointer active:scale-90 disabled:opacity-40 disabled:cursor-default';
  const btnNeutral = `${btnBase} bg-white/5 hover:bg-white/10 text-white/80 hover:text-white`;

  const clusterPos =
    placement === 'top'
      ? isFullscreen ? 'top-3 left-3' : 'top-2 left-2'
      : isFullscreen ? 'bottom-4 left-4' : 'bottom-2.5 left-2.5';

  const fsPos =
    placement === 'top'
      ? isFullscreen ? 'top-3 right-3 w-10 h-10' : 'top-2 right-2 w-8 h-8'
      : isFullscreen ? 'bottom-4 right-4 w-12 h-12' : 'bottom-2 right-2 w-8 h-8';

  return (
    <>
      <div
        className={`absolute z-30 flex flex-col gap-1.5 rounded-xl p-1
                   bg-black/50 border border-white/10 backdrop-blur-sm shadow-lg select-none ${clusterPos}`}
      >
        <button
          onClick={onZoomIn}
          className={btnNeutral}
          style={{ width: size, height: size }}
          disabled={zoom >= 4}
          title="Acercar (Zoom In)"
          aria-label="Acercar"
        >
          <Plus size={iconSize} strokeWidth={2.5} />
        </button>

        {zoom > 1 && (
          <button
            onClick={onResetZoom}
            className={`${btnBase} bg-accent-500/30 hover:bg-accent-500/50 text-accent-300 font-bold`}
            style={{ width: size, height: size, fontSize: isFullscreen ? 10 : 8 }}
            title="Restaurar Zoom (100%)"
            aria-label="Restaurar zoom"
          >
            1x
          </button>
        )}

        <button
          onClick={onZoomOut}
          className={btnNeutral}
          style={{ width: size, height: size }}
          disabled={zoom <= 1}
          title="Alejar (Zoom Out)"
          aria-label="Alejar"
        >
          <Minus size={iconSize} strokeWidth={2.5} />
        </button>

        <div className="h-px bg-white/10 mx-1" />

        <button
          onClick={onToggleSnap}
          className={
            snapEnabled
              ? `${btnBase} bg-accent-500/40 text-accent-200 hover:bg-accent-500/50`
              : btnNeutral
          }
          style={{ width: size, height: size }}
          title={snapEnabled ? 'Desactivar cuadrícula magnética' : 'Activar cuadrícula magnética'}
          aria-label="Cuadrícula magnética"
          aria-pressed={snapEnabled}
        >
          <Magnet size={iconSize} strokeWidth={2.5} />
        </button>
      </div>

      <button
        onClick={onToggleFullscreen}
        className={`absolute z-30 flex items-center justify-center rounded-lg
                   bg-black/50 hover:bg-black/70 text-white/80 hover:text-white
                   border border-white/10 hover:border-white/25
                   backdrop-blur-sm transition-all duration-200 cursor-pointer active:scale-90 ${fsPos}`}
        title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
        aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
      >
        {isFullscreen ? <Minimize size={placement === 'top' ? 18 : 20} /> : <Maximize size={14} />}
      </button>
    </>
  );
}

export default memo(ZoomControls);
