import React, { useState } from 'react';
import {
  Users,
  Link2,
  Triangle,
  Minus,
  Type,
  Trash2,
  Image,
  FileText,
  Copy,
  Check,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Icon,
  FolderOpen,
  Goal,
  Shield,
  Shapes,
  Download,
  Circle,
} from 'lucide-react';
import { soccerBall } from '@lucide/lab';
import type { ElementType } from '../types';
import TacticSlots from './TacticSlots';

interface DesktopSidebarProps {
  onAddTool: (type: ElementType | 'arrow') => void;
  onClearExtras?: () => void;
  onExportPng: () => void;
  onExportPdf: () => void;
  generateShareLink: () => void;
  copyShareLink: () => void;
  shareUrl: string;
  isCopied: boolean;
  teamConfigContent: React.ReactNode;
  mostrarMarcador: boolean;
  setMostrarMarcador: (show: boolean) => void;
  slotNames: [string, string, string];
  onSaveSlot: (slotIndex: number) => void;
  onLoadSlot: (slotIndex: number) => void;
  onDeleteSlot: (slotIndex: number) => void;
}

/* ── Collapsible section wrapper ─────────────────────────────────────── */
function Section({
  title,
  icon,
  open,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-white/5 last:border-b-0">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="flex items-center justify-between w-full px-4 py-2.5 cursor-pointer select-none
                   text-text-secondary hover:text-text-primary transition-colors group"
      >
        <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
          {icon}
          {title}
        </span>
        {open ? (
          <ChevronDown size={14} className="text-text-muted group-hover:text-text-secondary transition-transform" />
        ) : (
          <ChevronRight size={14} className="text-text-muted group-hover:text-text-secondary transition-transform" />
        )}
      </button>
      <div
        className="overflow-hidden transition-all duration-200 ease-in-out"
        style={{
          maxHeight: open ? '600px' : '0px',
          opacity: open ? 1 : 0,
        }}
      >
        <div className="px-4 pb-3">{children}</div>
      </div>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────────── */
export default function DesktopSidebar({
  onAddTool,
  onClearExtras,
  onExportPng,
  onExportPdf,
  generateShareLink,
  copyShareLink,
  shareUrl,
  isCopied,
  teamConfigContent,
  mostrarMarcador,
  setMostrarMarcador,
  slotNames,
  onSaveSlot,
  onLoadSlot,
  onDeleteSlot,
}: DesktopSidebarProps) {
  const [extrasOpen, setExtrasOpen] = useState(true);
  const [teamsOpen, setTeamsOpen] = useState(true);
  const [tacticsOpen, setTacticsOpen] = useState(true);
  const [exportOpen, setExportOpen] = useState(true);
  const [shareOpen, setShareOpen] = useState(true);

  const extrasItems = [
    { type: 'ball' as const, label: 'Balón', icon: <Icon iconNode={soccerBall} size={18} strokeWidth={2} /> },
    { type: 'cone' as const, label: 'Cono', icon: <Triangle size={18} strokeWidth={2} /> },
    { type: 'arrow' as const, label: 'Línea', icon: <Minus size={18} strokeWidth={2.5} /> },
    { type: 'text' as const, label: 'Texto', icon: <Type size={18} strokeWidth={2} /> },
    { type: 'goal' as const, label: 'Portería', icon: <Goal size={18} strokeWidth={2} /> },
    { type: 'dummy' as const, label: 'Barrera', icon: <Shield size={18} strokeWidth={2} /> },
    { type: 'zone' as const, label: 'Zona', icon: <Circle size={18} strokeWidth={2} /> },
  ];

  return (
    <aside
      className="fixed top-0 right-0 h-full w-[260px] z-[90]
                 bg-surface-800/85 backdrop-blur-xl border-l border-border
                 flex flex-col shadow-[-8px_0_30px_rgba(0,0,0,0.25)]
                 animate-in slide-in-from-right-4 fade-in duration-300"
      aria-label="Panel de herramientas"
    >
      {/* ── Branding ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 px-4 pt-4 pb-3 border-b border-white/5 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center shadow-lg shadow-accent-500/25 shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4 text-white"
          >
            <path d="M12 19l7-7 3 3-7 7-3-3z" />
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
            <path d="M2 2l7.586 7.586" />
            <circle cx="11" cy="11" r="2" />
          </svg>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold text-text-primary tracking-tight">PizarrApp</span>
          <span className="text-[9px] text-text-muted font-medium">Panel de herramientas</span>
        </div>
      </div>

      {/* ── Scrollable content ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-clip scrollbar-thin">
        {/* ── Scoreboard Toggle ─────────────────────────────────────── */}
        <div className="px-4 py-3 border-b border-white/5">
          <button
            onClick={() => setMostrarMarcador(!mostrarMarcador)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-200 cursor-pointer active:scale-[0.98] ${
              mostrarMarcador
                ? 'bg-accent-500/15 text-accent-400 border-accent-500/25'
                : 'bg-surface-700/50 text-text-secondary hover:text-text-primary border-border hover:bg-surface-700'
            }`}
            aria-pressed={mostrarMarcador}
          >
            {mostrarMarcador ? <EyeOff size={16} /> : <Eye size={16} />}
            <span className="text-xs font-semibold">Marcador Táctico</span>
            <div className="ml-auto">
              <div
                className={`w-8 h-[18px] rounded-full relative transition-colors duration-200 ${
                  mostrarMarcador ? 'bg-accent-500' : 'bg-surface-600'
                }`}
              >
                <div
                  className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    mostrarMarcador ? 'translate-x-[16px]' : 'translate-x-[2px]'
                  }`}
                />
              </div>
            </div>
          </button>
        </div>

        {/* ── Extras Section ───────────────────────────────────────── */}
        <Section
          title="Elementos"
          icon={<Shapes size={12} />}
          open={extrasOpen}
          onToggle={() => setExtrasOpen(!extrasOpen)}
        >
          <div className="grid grid-cols-2 gap-2">
            {extrasItems.map((item) => (
              <button
                key={item.type}
                onClick={() => onAddTool(item.type)}
                className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-lg
                           bg-surface-700/40 border border-border
                           hover:bg-surface-700 hover:border-border-hover
                           transition-all duration-150 cursor-pointer active:scale-95 group"
                title={`Añadir ${item.label.toLowerCase()}`}
              >
                <div className="w-8 h-8 rounded-lg bg-surface-800/80 flex items-center justify-center border border-white/5 text-text-secondary group-hover:text-accent-400 transition-colors">
                  {item.icon}
                </div>
                <span className="text-[10px] font-semibold text-text-secondary group-hover:text-text-primary transition-colors">{item.label}</span>
              </button>
            ))}
          </div>
          {onClearExtras && (
            <button
              onClick={onClearExtras}
              className="w-full mt-2 flex items-center gap-2.5 px-3 py-2 rounded-lg
                         bg-red-500/5 hover:bg-red-500/10 text-red-400/80 hover:text-red-400
                         border border-red-500/10 hover:border-red-500/20
                         transition-all cursor-pointer active:scale-[0.98] text-left"
            >
              <Trash2 size={14} strokeWidth={2} />
              <span className="text-[11px] font-semibold">Limpiar campo</span>
            </button>
          )}
        </Section>

        {/* ── Teams Section ────────────────────────────────────────── */}
        <Section
          title="Alineaciones"
          icon={<Users size={12} />}
          open={teamsOpen}
          onToggle={() => setTeamsOpen(!teamsOpen)}
        >
          {teamConfigContent}
        </Section>

        {/* ── Tactic Slots Section ──────────────────────────────────── */}
        <Section
          title="Tácticas"
          icon={<FolderOpen size={12} />}
          open={tacticsOpen}
          onToggle={() => setTacticsOpen(!tacticsOpen)}
        >
          <TacticSlots
            slotNames={slotNames}
            onSaveSlot={onSaveSlot}
            onLoadSlot={onLoadSlot}
            onDeleteSlot={onDeleteSlot}
          />
        </Section>

        {/* ── Export Section ────────────────────────────────────────── */}
        <Section
          title="Exportar"
          icon={<Download size={12} />}
          open={exportOpen}
          onToggle={() => setExportOpen(!exportOpen)}
        >
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onExportPng}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg
                         bg-surface-700/40 hover:bg-surface-700 border border-border hover:border-border-hover
                         transition-all cursor-pointer active:scale-95 group"
              title="Exportar como imagen PNG"
            >
              <Image size={15} className="text-text-secondary group-hover:text-accent-400 transition-colors" />
              <span className="text-[11px] font-semibold text-text-primary">PNG</span>
            </button>
            <button
              onClick={onExportPdf}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg
                         bg-surface-700/40 hover:bg-surface-700 border border-border hover:border-border-hover
                         transition-all cursor-pointer active:scale-95 group"
              title="Descargar en PDF A4"
            >
              <FileText size={15} className="text-text-secondary group-hover:text-accent-400 transition-colors" />
              <span className="text-[11px] font-semibold text-text-primary">PDF A4</span>
            </button>
          </div>
        </Section>

        {/* ── Share Section ────────────────────────────────────────── */}
        <Section
          title="Compartir"
          icon={<Link2 size={12} />}
          open={shareOpen}
          onToggle={() => setShareOpen(!shareOpen)}
        >
          {shareUrl ? (
            <div className="space-y-2">
              <p className="text-[9px] text-text-muted leading-relaxed">
                Copia este enlace para compartir tu táctica:
              </p>
              <div className="flex items-center gap-1.5">
                <input
                  readOnly
                  value={shareUrl}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-surface-900/80 text-[10px] text-text-secondary
                             border border-border font-mono truncate outline-none
                             focus:ring-1 focus:ring-accent-500/30"
                  aria-label="Enlace para compartir"
                />
                <button
                  onClick={copyShareLink}
                  className={`flex items-center justify-center w-8 h-8 rounded-lg border
                             transition-all duration-150 cursor-pointer active:scale-90 shrink-0 ${
                    isCopied
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-surface-600 text-text-secondary hover:text-text-primary border-border hover:bg-surface-500'
                  }`}
                  title="Copiar enlace"
                  aria-label="Copiar enlace"
                >
                  {isCopied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={generateShareLink}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left
                         bg-surface-700/40 hover:bg-surface-700 text-text-secondary hover:text-text-primary
                         border border-border hover:border-border-hover
                         transition-all cursor-pointer group active:scale-[0.98]"
            >
              <div className="w-8 h-8 rounded-lg bg-surface-800/80 flex items-center justify-center border border-white/5 shrink-0 text-text-secondary group-hover:text-accent-400 transition-colors">
                <Link2 size={15} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold leading-tight">Generar Enlace</span>
                <span className="text-[9px] opacity-60 leading-tight">Crea un enlace para compartir</span>
              </div>
            </button>
          )}
        </Section>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <div className="px-4 py-2.5 border-t border-white/5 shrink-0">
        <p className="text-[9px] text-text-muted text-center select-none">
          Junior y TeacherdhApps · PizarrApp ® 2026
        </p>
      </div>
    </aside>
  );
}
