import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { JERSEY_COLORS } from '../constants/colors';

interface ColorPickerPortalProps {
  color: string;
  onChange: (color: string) => void;
  /** Anchor rect of the trigger button (desktop popover positioning) */
  rect: DOMRect;
  onClose: () => void;
}

/**
 * ColorPickerPortal — jersey color picker.
 * Mobile: bottom sheet. Desktop: anchored popover.
 * Escape or backdrop click closes it.
 */
export default function ColorPickerPortal({ color, onChange, rect, onClose }: ColorPickerPortalProps) {
  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const isMobileViewport = window.innerWidth <= 768;

  const swatches = (sizeClass: string) =>
    JERSEY_COLORS.map((c) => (
      <button
        key={c}
        onClick={() => {
          onChange(c);
          onClose();
        }}
        className={`${sizeClass} rounded-lg border-2 transition-all cursor-pointer hover:scale-110 active:scale-95`}
        style={{
          backgroundColor: c,
          borderColor: color.toLowerCase() === c.toLowerCase() ? '#ffffff' : 'rgba(255,255,255,0.1)',
          boxShadow: color.toLowerCase() === c.toLowerCase() ? '0 0 10px rgba(255,255,255,0.35)' : 'none',
        }}
        aria-label={`Color ${c}`}
        aria-pressed={color.toLowerCase() === c.toLowerCase()}
      />
    ));

  if (isMobileViewport) {
    // Mobile: bottom sheet
    return createPortal(
      <>
        <div
          className="color-picker-mobile-backdrop"
          onClick={onClose}
          onPointerDown={(e) => e.stopPropagation()}
        />
        <div
          className="color-picker-mobile-sheet"
          onPointerDown={(e) => e.stopPropagation()}
          role="dialog"
          aria-label="Color de camiseta"
        >
          <div className="flex justify-center mb-3">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          <div className="text-xs font-bold uppercase tracking-wider text-text-secondary px-1 border-b border-white/5 pb-2 mb-3">
            Color de camiseta
          </div>

          <div className="grid grid-cols-6 gap-2.5 mb-4">{swatches('w-11 h-11')}</div>

          <div className="h-px bg-white/5 mb-3" />

          <label className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-surface-800/80 hover:bg-surface-600/80 border border-white/5 transition-colors cursor-pointer text-sm font-semibold text-text-primary">
            <span>Personalizado...</span>
            <div className="w-8 h-8 rounded-lg border border-white/10 relative overflow-hidden" style={{ backgroundColor: color }}>
              <input
                type="color"
                value={color}
                onChange={(e) => onChange(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
                aria-label="Color personalizado"
              />
            </div>
          </label>
        </div>
      </>,
      document.body,
    );
  }

  // Desktop: positioned popover
  const popoverWidth = 200;
  const left = rect.left - popoverWidth - 10;
  const top = rect.top + rect.height / 2 - 90;

  const clampedLeft = Math.max(10, Math.min(window.innerWidth - popoverWidth - 10, left));
  const clampedTop = Math.max(10, Math.min(window.innerHeight - 220, top));

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[300]"
        onClick={onClose}
        onPointerDown={(e) => e.stopPropagation()}
      />
      <div
        className="fixed z-[301] p-3 rounded-2xl bg-surface-700 border border-white/10 shadow-2xl flex flex-col gap-2.5 animate-in fade-in zoom-in-95 duration-150 select-none"
        onPointerDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Color de camiseta"
        style={{
          width: `${popoverWidth}px`,
          left: `${clampedLeft}px`,
          top: `${clampedTop}px`,
        }}
      >
        <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary px-1 border-b border-white/5 pb-1.5">
          Color de camiseta
        </div>

        <div className="grid grid-cols-4 gap-1.5">{swatches('w-8 h-8')}</div>

        <div className="h-px bg-white/5 my-0.5" />

        <label className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-surface-800/80 hover:bg-surface-600/80 border border-white/5 transition-colors cursor-pointer text-[11px] font-semibold text-text-primary">
          <span>Personalizado...</span>
          <div className="w-5 h-5 rounded-md border border-white/10 relative overflow-hidden" style={{ backgroundColor: color }}>
            <input
              type="color"
              value={color}
              onChange={(e) => onChange(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
              aria-label="Color personalizado"
            />
          </div>
        </label>
      </div>
    </>,
    document.body,
  );
}
