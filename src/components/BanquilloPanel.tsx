import { memo, useState } from 'react';
import { LogIn, GripVertical } from 'lucide-react';
import type { Jugador } from '../types';
import type { TeamSide } from './TeamConfig';

interface BanquilloPanelProps {
  side: TeamSide;
  label: string;
  /** Benched players for this team */
  players: Jugador[];
  color: string;
  onSendToField: (side: TeamSide, numero: number) => void;
  onNameChange: (side: TeamSide, numero: number, name: string) => void;
  onNumberChange: (side: TeamSide, oldNumero: number, newNumero: number) => void;
}

/**
 * One benched player row: number + name editable inline (like FichaJugador),
 * a "send to field" button, and native HTML5 drag to the pitch.
 */
function BenchChip({
  side,
  player,
  color,
  onSendToField,
  onNameChange,
  onNumberChange,
}: {
  side: TeamSide;
  player: Jugador;
  color: string;
  onSendToField: (side: TeamSide, numero: number) => void;
  onNameChange: (side: TeamSide, numero: number, name: string) => void;
  onNumberChange: (side: TeamSide, oldNumero: number, newNumero: number) => void;
}) {
  const [nombre, setNombre] = useState(player.nombre);
  const [numero, setNumero] = useState(player.numero.toString());

  const commitName = () => {
    const trimmed = nombre.trim();
    if (trimmed && trimmed !== player.nombre) onNameChange(side, player.numero, trimmed);
  };
  const commitNumber = () => {
    const parsed = parseInt(numero, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed !== player.numero) {
      onNumberChange(side, player.numero, parsed);
    }
  };

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(
          'application/x-pizarra-sub',
          JSON.stringify({ team: side, numero: player.numero }),
        );
        e.dataTransfer.effectAllowed = 'move';
      }}
      className="flex items-center gap-1.5 px-1.5 py-1 rounded-lg bg-surface-700/50 border border-border cursor-grab active:cursor-grabbing"
      title="Arrastra al campo para sustituir"
    >
      <GripVertical size={12} className="text-text-muted shrink-0" aria-hidden="true" />
      <span
        className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold text-white shrink-0 border border-white/10"
        style={{ backgroundColor: color }}
      >
        {numero}
      </span>
      <input
        value={numero}
        onChange={(e) => setNumero(e.target.value)}
        onBlur={commitNumber}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        inputMode="numeric"
        className="w-8 px-1 py-0.5 rounded bg-surface-900/70 text-text-primary text-[11px] text-center border border-border outline-none focus:ring-1 focus:ring-accent-500/30"
        aria-label="Número"
      />
      <input
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        onBlur={commitName}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        className="flex-1 min-w-0 px-1.5 py-0.5 rounded bg-surface-900/70 text-text-primary text-[11px] border border-border outline-none focus:ring-1 focus:ring-accent-500/30"
        aria-label="Nombre"
      />
      <button
        onClick={() => onSendToField(side, player.numero)}
        className="w-6 h-6 flex items-center justify-center rounded-md bg-emerald-600/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-600/25 transition-colors cursor-pointer shrink-0"
        title="Enviar al campo"
        aria-label="Enviar al campo"
      >
        <LogIn size={12} strokeWidth={2.5} />
      </button>
    </div>
  );
}

function BanquilloPanel({
  side,
  label,
  players,
  color,
  onSendToField,
  onNameChange,
  onNumberChange,
}: BanquilloPanelProps) {
  return (
    <div
      data-bench-dropzone={side}
      className="mt-2 rounded-lg border border-dashed border-border bg-surface-800/40 p-2"
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
          Banquillo {label}
        </span>
        <span className="text-[10px] text-text-muted">{players.length}</span>
      </div>
      {players.length === 0 ? (
        <p className="text-[10px] text-text-muted/70 italic px-1 py-1">
          Arrastra una ficha aquí para sentarla.
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {players.map((p) => (
            <BenchChip
              key={`${side}-bench-${p.numero}`}
              side={side}
              player={p}
              color={color}
              onSendToField={onSendToField}
              onNameChange={onNameChange}
              onNumberChange={onNumberChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(BanquilloPanel);
