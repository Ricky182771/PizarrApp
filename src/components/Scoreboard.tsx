import { memo } from 'react';

interface ScoreboardProps {
  nombreLocal: string;
  nombreVisitante: string;
  colorLocal: string;
  colorVisitante: string;
  golesLocal: number;
  golesVisitante: number;
  onNombreLocalChange: (name: string) => void;
  onNombreVisitanteChange: (name: string) => void;
  onGolesLocalChange: (updater: (prev: number) => number) => void;
  onGolesVisitanteChange: (updater: (prev: number) => number) => void;
}

/** One clickable score box: click adds, right-click subtracts. */
function ScoreBox({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (updater: (prev: number) => number) => void;
  label: string;
}) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onChange((prev) => (prev + 1) % 100);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        onChange((prev) => (prev - 1 + 100) % 100);
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className="digital-score-box"
      role="spinbutton"
      aria-valuenow={value}
      aria-label={label}
      title="Sumar (Click) / Restar (Click derecho)"
    >
      <span className="digital-score-value">{value.toString()}</span>
    </div>
  );
}

/**
 * Scoreboard — traditional stadium scoreboard pinned to the top of the app.
 * Team names are editable inline; scores respond to click / right-click.
 */
function Scoreboard({
  nombreLocal,
  nombreVisitante,
  colorLocal,
  colorVisitante,
  golesLocal,
  golesVisitante,
  onNombreLocalChange,
  onNombreVisitanteChange,
  onGolesLocalChange,
  onGolesVisitanteChange,
}: ScoreboardProps) {
  const inputClass =
    'text-xs font-black uppercase tracking-wider text-white bg-black/20 border border-white/10 outline-none focus:bg-black/40 focus:ring-1 focus:ring-white/20 px-1.5 py-0.5 rounded flex-1 min-w-0 font-sans truncate';

  return (
    <div className="digital-scoreboard-fixed select-none">
      <div className="stadium-scoreboard">
        {/* Left Team (Local) Banner */}
        <div
          className="scoreboard-team-local"
          style={{ background: `linear-gradient(135deg, ${colorLocal} 0%, rgba(12, 12, 16, 0.4) 100%)` }}
        >
          <span
            className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0 shadow-sm"
            style={{ backgroundColor: colorLocal }}
          />
          <input
            type="text"
            value={nombreLocal}
            onChange={(e) => onNombreLocalChange(e.target.value)}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className={`${inputClass} text-right`}
            aria-label="Nombre del equipo local"
            title="Local"
          />
        </div>

        <div className="scoreboard-score-local-container">
          <ScoreBox value={golesLocal} onChange={onGolesLocalChange} label="Goles del equipo local" />
        </div>

        <div className="scoreboard-vs-badge">VS</div>

        <div className="scoreboard-colon-container">
          <span>:</span>
        </div>

        <div className="scoreboard-score-visitante-container">
          <ScoreBox value={golesVisitante} onChange={onGolesVisitanteChange} label="Goles del equipo visitante" />
        </div>

        {/* Right Team (Visitante) Banner */}
        <div
          className="scoreboard-team-visitante"
          style={{ background: `linear-gradient(135deg, ${colorVisitante} 0%, rgba(12, 12, 16, 0.4) 100%)` }}
        >
          <input
            type="text"
            value={nombreVisitante}
            onChange={(e) => onNombreVisitanteChange(e.target.value)}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className={`${inputClass} text-left`}
            aria-label="Nombre del equipo visitante"
            title="Visitante"
          />
          <span
            className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0 shadow-sm"
            style={{ backgroundColor: colorVisitante }}
          />
        </div>
      </div>
    </div>
  );
}

export default memo(Scoreboard);
