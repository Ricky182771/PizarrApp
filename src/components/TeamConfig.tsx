import { memo } from 'react';
import { Plus, Minus, LayoutGrid } from 'lucide-react';
import type { Jugador } from '../types';

export type TeamSide = 'local' | 'visitante';

interface TeamPanelProps {
  side: TeamSide;
  label: string;
  labelColor: string;
  players: Jugador[];
  color: string;
  onFormationChange: (side: TeamSide, size: 7 | 9 | 11) => void;
  onColorPickerOpen: (side: TeamSide, rect: DOMRect) => void;
  onAddPlayer: (side: TeamSide) => void;
  onRemovePlayer: (side: TeamSide) => void;
}

/** One team's row: formation presets, jersey color and add/remove player. */
function TeamPanel({
  side,
  label,
  labelColor,
  players,
  color,
  onFormationChange,
  onColorPickerOpen,
  onAddPlayer,
  onRemovePlayer,
}: TeamPanelProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold ${labelColor} flex items-center gap-1.5`}>
          <span className="w-2.5 h-2.5 rounded-full border border-white/10" style={{ backgroundColor: color }} />
          {label}
        </span>
        <span className="text-[10px] text-text-muted font-medium">{players.length} jugadores</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        {/* Formation presets */}
        <div className="flex rounded-lg bg-surface-800 p-0.5 border border-border/50" role="group" aria-label={`Formación ${label}`}>
          {([7, 9, 11] as const).map((sz) => (
            <button
              key={`${side}-sz-${sz}`}
              onClick={() => onFormationChange(side, sz)}
              className="px-2 py-0.5 text-[10px] font-semibold rounded-md transition-all duration-150 cursor-pointer"
              style={{
                backgroundColor: players.length === sz ? 'var(--color-surface-600)' : 'transparent',
                color: players.length === sz ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              }}
              aria-pressed={players.length === sz}
            >
              F{sz}
            </button>
          ))}
        </div>

        {/* Jersey color */}
        <button
          onClick={(e) => onColorPickerOpen(side, e.currentTarget.getBoundingClientRect())}
          className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-surface-800 hover:bg-surface-600 border border-border transition-colors cursor-pointer"
          title={`Color de camiseta ${label.toLowerCase()}`}
          aria-label={`Color de camiseta ${label.toLowerCase()}`}
        >
          <svg viewBox="0 0 64 68" fill="none" className="w-4 h-4" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.25))' }}>
            <path
              d="M22 4 C24 2, 40 2, 42 4 L48 3 L56 14 L56 24 L48 21 L48 62 C48 64, 46 66, 44 66 L20 66 C18 66, 16 64, 16 62 L16 21 L8 24 L8 14 L16 3 Z"
              fill={color}
              stroke="rgba(255,255,255,0.5)"
              strokeWidth="1.5"
            />
          </svg>
        </button>

        {/* Add / remove player */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onAddPlayer(side)}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-600/20 transition-colors cursor-pointer"
            title={`Añadir jugador ${label.toLowerCase()}`}
            aria-label={`Añadir jugador ${label.toLowerCase()}`}
          >
            <Plus size={13} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => onRemovePlayer(side)}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-600/10 text-red-400 border border-red-500/20 hover:bg-red-600/20 transition-colors cursor-pointer disabled:opacity-40"
            title={`Eliminar último jugador ${label.toLowerCase()}`}
            aria-label={`Eliminar último jugador ${label.toLowerCase()}`}
            disabled={players.length === 0}
          >
            <Minus size={13} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

export interface TeamConfigProps {
  local: Jugador[];
  visitante: Jugador[];
  colorLocal: string;
  colorVisitante: string;
  mostrarMarcador: boolean;
  setMostrarMarcador: (show: boolean) => void;
  onFormationChange: (side: TeamSide, size: 7 | 9 | 11) => void;
  onColorPickerOpen: (side: TeamSide, rect: DOMRect) => void;
  onAddPlayer: (side: TeamSide) => void;
  onRemovePlayer: (side: TeamSide) => void;
  onAutoArrange: () => void;
}

/**
 * TeamConfig — shared "Alineaciones" panel content (desktop sidebar &
 * mobile floating menu): scoreboard toggle, both team panels and the
 * one-click auto-arrange action.
 */
function TeamConfig({
  local,
  visitante,
  colorLocal,
  colorVisitante,
  mostrarMarcador,
  setMostrarMarcador,
  onFormationChange,
  onColorPickerOpen,
  onAddPlayer,
  onRemovePlayer,
  onAutoArrange,
}: TeamConfigProps) {
  return (
    <div className="space-y-4">
      {/* Scoreboard toggle */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <span className="text-xs font-semibold text-text-primary">Mostrar marcador táctico</span>
        <label className="relative inline-flex items-center cursor-pointer select-none">
          <input
            type="checkbox"
            checked={mostrarMarcador}
            onChange={(e) => setMostrarMarcador(e.target.checked)}
            className="sr-only peer"
            aria-label="Mostrar marcador táctico"
          />
          <div className="w-8 h-4.5 bg-surface-600 rounded-full peer peer-focus:ring-1 peer-focus:ring-accent-500/30 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-accent-500"></div>
        </label>
      </div>

      <div className="pb-3 border-b border-white/5">
        <TeamPanel
          side="local"
          label="Local"
          labelColor="text-blue-400"
          players={local}
          color={colorLocal}
          onFormationChange={onFormationChange}
          onColorPickerOpen={onColorPickerOpen}
          onAddPlayer={onAddPlayer}
          onRemovePlayer={onRemovePlayer}
        />
      </div>

      <div className="pb-3 border-b border-white/5">
        <TeamPanel
          side="visitante"
          label="Visitante"
          labelColor="text-red-400"
          players={visitante}
          color={colorVisitante}
          onFormationChange={onFormationChange}
          onColorPickerOpen={onColorPickerOpen}
          onAddPlayer={onAddPlayer}
          onRemovePlayer={onRemovePlayer}
        />
      </div>

      {/* Auto-arrange both teams */}
      <button
        onClick={onAutoArrange}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg
                   bg-accent-500/5 hover:bg-accent-500/15 text-accent-400
                   border border-accent-500/15 hover:border-accent-500/25
                   transition-all cursor-pointer active:scale-[0.98] text-left"
        title="Redistribuir todos los jugadores en una formación ordenada"
      >
        <LayoutGrid size={14} strokeWidth={2} />
        <span className="text-[11px] font-semibold">Ordenar jugadores</span>
      </button>
    </div>
  );
}

export default memo(TeamConfig);
