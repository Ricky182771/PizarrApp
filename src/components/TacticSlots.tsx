import { memo } from 'react';
import { Save, RotateCcw, Trash2 } from 'lucide-react';

export interface TacticSlotsProps {
  slotNames: string[];
  onSaveSlot: (slotIndex: number) => void;
  onLoadSlot: (slotIndex: number) => void;
  onDeleteSlot: (slotIndex: number) => void;
  /** Slightly smaller buttons for the mobile popover */
  compact?: boolean;
}

/**
 * TacticSlots — the named save slots (count driven by `slotNames`).
 * Shared between the desktop sidebar and the mobile floating menu.
 */
function TacticSlots({ slotNames, onSaveSlot, onLoadSlot, onDeleteSlot, compact = false }: TacticSlotsProps) {
  const btnSize = compact ? 'w-7 h-7' : 'w-8 h-8';
  const btnBase = `shrink-0 ${btnSize} flex items-center justify-center rounded-lg border transition-all cursor-pointer active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed`;
  const iconSize = compact ? 12 : 13;

  return (
    <div className={`${compact ? 'space-y-1.5' : 'space-y-2'} max-h-[220px] overflow-y-auto scrollbar-thin`}>
      {slotNames.map((name, slotIdx) => {
        const isEmpty = !name;
        return (
          <div key={`slot-${slotIdx}`} className="flex items-center gap-1.5">
            <div className={`flex-1 min-w-0 px-2.5 rounded-lg bg-surface-700/40 border border-border ${compact ? 'py-1.5' : 'py-2'}`}>
              <span
                className={`text-[10px] font-semibold leading-tight block truncate ${
                  isEmpty ? 'text-text-muted italic' : 'text-text-primary'
                }`}
              >
                {isEmpty ? `Táctica ${slotIdx + 1} · vacía` : name}
              </span>
            </div>
            <button
              onClick={() => onSaveSlot(slotIdx)}
              className={`${btnBase} bg-accent-500/10 text-accent-400 border-accent-500/15 hover:bg-accent-500/20 hover:border-accent-500/25`}
              title={`Guardar en Táctica ${slotIdx + 1}`}
              aria-label={`Guardar en Táctica ${slotIdx + 1}`}
            >
              <Save size={iconSize} />
            </button>
            <button
              onClick={() => onLoadSlot(slotIdx)}
              disabled={isEmpty}
              className={`${btnBase} bg-emerald-500/10 text-emerald-400 border-emerald-500/15 hover:bg-emerald-500/20 hover:border-emerald-500/25`}
              title={`Cargar Táctica ${slotIdx + 1}`}
              aria-label={`Cargar Táctica ${slotIdx + 1}`}
            >
              <RotateCcw size={iconSize} />
            </button>
            {!isEmpty && (
              <button
                onClick={() => onDeleteSlot(slotIdx)}
                className={`${btnBase} bg-red-500/10 text-red-400 border-red-500/15 hover:bg-red-500/20 hover:border-red-500/25`}
                title={`Borrar Táctica ${slotIdx + 1}`}
                aria-label={`Borrar Táctica ${slotIdx + 1}`}
              >
                <Trash2 size={iconSize} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default memo(TacticSlots);
