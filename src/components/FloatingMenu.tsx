import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Link2,
  GripVertical,
  Triangle,
  Minus,
  Type,
  Trash2,
  Icon,
  Settings,
  Image,
  FileText,
  Copy,
  Check,
  Eye,
  EyeOff,
  Goal,
  Shield,
  Shapes,
  Circle,
  Film,
} from 'lucide-react';
import { soccerBall } from '@lucide/lab';
import type { ElementType } from '../types';
import TacticSlots from './TacticSlots';

interface FloatingMenuProps {
  onAddTool: (type: ElementType | 'arrow') => void;
  onClearExtras?: () => void;
  onExportPng: () => void;
  onExportPdf: () => void;
  generateShareLink: () => void;
  copyShareLink: () => void;
  shareUrl: string;
  isCopied: boolean;

  isTeamConfigOpen: boolean;
  setIsTeamConfigOpen: (open: boolean) => void;
  teamConfigContent: React.ReactNode;
  animationContent: React.ReactNode;

  mostrarMarcador: boolean;
  setMostrarMarcador: (show: boolean) => void;

  slotNames: [string, string, string];
  onSaveSlot: (slotIndex: number) => void;
  onLoadSlot: (slotIndex: number) => void;
  onDeleteSlot: (slotIndex: number) => void;
}

export default function FloatingMenu({
  onAddTool,
  onClearExtras,
  onExportPng,
  onExportPdf,
  generateShareLink,
  copyShareLink,
  shareUrl,
  isCopied,
  isTeamConfigOpen,
  setIsTeamConfigOpen,
  teamConfigContent,
  animationContent,
  mostrarMarcador,
  setMostrarMarcador,
  slotNames,
  onSaveSlot,
  onLoadSlot,
  onDeleteSlot,
}: FloatingMenuProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExtrasOpen, setIsExtrasOpen] = useState(false);
  const [isAnimationOpen, setIsAnimationOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // Initial position: bottom left of the window (client-only app, window always exists)
  const [position, setPosition] = useState(() => ({ x: 16, y: window.innerHeight - 150 }));

  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const clickStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        const maxX = window.innerWidth - 72;
        const maxY = window.innerHeight - 72;
        return {
          x: Math.max(16, Math.min(maxX, prev.x)),
          y: Math.max(16, Math.min(maxY, prev.y)),
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Escape closes any open panel
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExtrasOpen(false);
        setIsAnimationOpen(false);
        setIsSettingsOpen(false);
        setIsTeamConfigOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [setIsTeamConfigOpen]);

  const closeAll = () => {
    setIsExtrasOpen(false);
    setIsAnimationOpen(false);
    setIsSettingsOpen(false);
    setIsTeamConfigOpen(false);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Left click only

    const target = e.target as HTMLElement;
    // Don't drag if clicking buttons, inputs, labels, etc.
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('select') ||
      target.closest('label') ||
      target.closest('a')
    ) {
      return;
    }

    isDraggingRef.current = true;
    clickStartRef.current = { x: e.clientX, y: e.clientY };
    dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };

    if (containerRef.current && typeof containerRef.current.setPointerCapture === 'function') {
      containerRef.current.setPointerCapture(e.pointerId);
    }
    e.stopPropagation();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;

    const newX = e.clientX - dragStartRef.current.x;
    const newY = e.clientY - dragStartRef.current.y;

    // Clamp coordinates to screen dimensions
    const width = containerRef.current?.offsetWidth || 56;
    const height = containerRef.current?.offsetHeight || 56;

    const maxX = window.innerWidth - width - 16;
    const maxY = window.innerHeight - height - 16;

    setPosition({
      x: Math.max(16, Math.min(maxX, newX)),
      y: Math.max(16, Math.min(maxY, newY)),
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;

    isDraggingRef.current = false;
    if (containerRef.current && typeof containerRef.current.releasePointerCapture === 'function') {
      try {
        containerRef.current.releasePointerCapture(e.pointerId);
      } catch {
        // Ignored
      }
    }

    const dx = e.clientX - clickStartRef.current.x;
    const dy = e.clientY - clickStartRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If dragged less than 6px, treat it as a click toggle
    if (distance < 6) {
      setIsExpanded((prev) => !prev);
      if (isExpanded) {
        closeAll();
      }
    }
  };

  const handleTogglePanel = (panel: 'extras' | 'teams' | 'animation' | 'settings') => {
    if (panel === 'extras') {
      setIsExtrasOpen(!isExtrasOpen);
      setIsAnimationOpen(false);
      setIsSettingsOpen(false);
      setIsTeamConfigOpen(false);
    } else if (panel === 'teams') {
      setIsTeamConfigOpen(!isTeamConfigOpen);
      setIsExtrasOpen(false);
      setIsAnimationOpen(false);
      setIsSettingsOpen(false);
    } else if (panel === 'animation') {
      setIsAnimationOpen(!isAnimationOpen);
      setIsExtrasOpen(false);
      setIsSettingsOpen(false);
      setIsTeamConfigOpen(false);
    } else if (panel === 'settings') {
      setIsSettingsOpen(!isSettingsOpen);
      setIsExtrasOpen(false);
      setIsAnimationOpen(false);
      setIsTeamConfigOpen(false);
    }
  };

  const handleSelectExtra = (type: ElementType | 'arrow') => {
    onAddTool(type);
    setIsExtrasOpen(false);
  };

  const handleClearExtras = () => {
    onClearExtras?.();
    setIsExtrasOpen(false);
  };

  const isTopHalf = position.y < window.innerHeight / 2;
  const isLeftHalf = position.x < window.innerWidth / 2;

  const popoverPositionClass = `${
    isTopHalf ? 'top-[calc(100%+12px)]' : 'bottom-[calc(100%+12px)]'
  } ${isLeftHalf ? 'left-0' : 'right-0'}`;

  const extrasItems = [
    {
      type: 'ball' as const,
      label: 'Balón',
      desc: 'Añadir balón al campo',
      icon: <Icon iconNode={soccerBall} size={18} strokeWidth={2} />,
    },
    {
      type: 'cone' as const,
      label: 'Cono',
      desc: 'Cono de entrenamiento',
      icon: <Triangle size={18} strokeWidth={2} />,
    },
    {
      type: 'arrow' as const,
      label: 'Línea',
      desc: 'Flecha táctica interactiva',
      icon: <Minus size={18} strokeWidth={2.5} />,
    },
    {
      type: 'text' as const,
      label: 'Texto',
      desc: 'Etiqueta de texto libre',
      icon: <Type size={18} strokeWidth={2} />,
    },
    {
      type: 'goal' as const,
      label: 'Portería',
      desc: 'Portería pop-up de práctica',
      icon: <Goal size={18} strokeWidth={2} />,
    },
    {
      type: 'dummy' as const,
      label: 'Barrera',
      desc: 'Barrera de entrenamiento',
      icon: <Shield size={18} strokeWidth={2} />,
    },
    {
      type: 'zone' as const,
      label: 'Zona',
      desc: 'Área resaltada (presión / fuera de juego)',
      icon: <Circle size={18} strokeWidth={2} />,
    },
  ];

  const anyPanelOpen = isExtrasOpen || isTeamConfigOpen || isAnimationOpen || isSettingsOpen;

  const panelBtnClass = (active: boolean) =>
    `flex items-center justify-center w-9 h-9 rounded-xl border transition-all cursor-pointer active:scale-90 ${
      active
        ? 'bg-accent-500/20 text-accent-400 border-accent-500/30'
        : 'bg-surface-700/60 text-text-secondary border-border hover:bg-surface-700 hover:text-text-primary'
    }`;

  return (
    <>
      {/* Global backdrop click catcher when any panel is open */}
      {anyPanelOpen && <div className="fixed inset-0 z-[80]" onClick={closeAll} />}

      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        role="button"
        title={isExpanded ? 'Colapsar menú' : 'Expandir menú'}
        aria-label={isExpanded ? 'Colapsar menú' : 'Expandir menú de herramientas'}
        style={{
          left: position.x,
          top: position.y,
          touchAction: 'none',
        }}
        className={`fixed z-[95] transition-shadow duration-200 select-none ${
          isExpanded
            ? 'p-2 rounded-2xl bg-surface-800/90 border border-border backdrop-blur-md shadow-2xl flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150'
            : 'w-14 h-14 bg-transparent flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-105 active:scale-95 transition-all duration-150'
        }`}
      >
        {!isExpanded ? (
          <div className="pointer-events-none flex items-center justify-center text-[44px] select-none filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.45)]">
            ⚽
          </div>
        ) : (
          <>
            {/* Grip handle for dragging */}
            <div className="flex items-center justify-center px-1 py-2 cursor-grab active:cursor-grabbing text-text-muted hover:text-text-secondary shrink-0">
              <GripVertical size={16} />
            </div>

            {/* Quick Collapse Button */}
            <button
              onClick={() => {
                setIsExpanded(false);
                closeAll();
              }}
              className="flex items-center justify-center w-8 h-8 rounded-xl bg-surface-700/60 text-text-secondary hover:text-text-primary border border-border cursor-pointer transition-colors"
              title="Colapsar menú"
              aria-label="Colapsar menú"
            >
              <Icon iconNode={soccerBall} size={18} strokeWidth={2} className="text-accent-400" />
            </button>

            {/* divider */}
            <div className="w-px h-6 bg-white/10 shrink-0" />

            {/* Actions list */}
            <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 duration-150">
              {/* Marcador Toggle */}
              <button
                onClick={() => {
                  setMostrarMarcador(!mostrarMarcador);
                  closeAll();
                }}
                className={panelBtnClass(mostrarMarcador)}
                title={mostrarMarcador ? 'Ocultar Marcador' : 'Mostrar Marcador'}
                aria-label={mostrarMarcador ? 'Ocultar marcador' : 'Mostrar marcador'}
                aria-pressed={mostrarMarcador}
              >
                {mostrarMarcador ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>

              {/* Extras menu */}
              <div className="relative">
                <button
                  onClick={() => handleTogglePanel('extras')}
                  className={panelBtnClass(isExtrasOpen)}
                  title="Elementos"
                  aria-label="Elementos adicionales"
                  aria-expanded={isExtrasOpen}
                >
                  <Shapes size={16} />
                </button>

                {isExtrasOpen && (
                  <div
                    className={`z-[100] border border-border bg-surface-700 p-2 shadow-2xl rounded-xl animate-in fade-in duration-150 md:absolute md:w-56 ${popoverPositionClass} popover-mobile`}
                  >
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-text-secondary px-2.5 py-1.5 border-b border-white/5 mb-1.5">
                      Elementos adicionales
                    </h3>
                    <div className="space-y-0.5">
                      {extrasItems.map((item) => (
                        <button
                          key={item.type}
                          onClick={() => handleSelectExtra(item.type)}
                          className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left hover:bg-surface-600 transition-colors cursor-pointer group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-surface-800 flex items-center justify-center border border-border group-hover:border-white/10 shrink-0 text-text-secondary group-hover:text-accent-400 transition-colors">
                            {item.icon}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-text-primary leading-tight">{item.label}</span>
                            <span className="text-[9px] text-text-muted leading-tight truncate">{item.desc}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                    {onClearExtras && (
                      <>
                        <div className="h-px bg-white/5 my-1.5" />
                        <button
                          onClick={handleClearExtras}
                          className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left hover:bg-red-500/10 text-red-400 transition-colors cursor-pointer group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-red-500/5 flex items-center justify-center border border-red-500/10 group-hover:border-red-500/20 shrink-0">
                            <Trash2 size={16} strokeWidth={2} className="text-red-400" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold leading-tight">Limpiar campo</span>
                            <span className="text-[9px] opacity-70 leading-tight">Borra todos los extras</span>
                          </div>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Alineaciones (Teams) */}
              <div className="relative">
                <button
                  onClick={() => handleTogglePanel('teams')}
                  className={panelBtnClass(isTeamConfigOpen)}
                  title="Alineaciones"
                  aria-label="Alineaciones y equipos"
                  aria-expanded={isTeamConfigOpen}
                >
                  <Users size={16} />
                </button>
                {isTeamConfigOpen && (
                  <div
                    className={`z-[100] rounded-xl border border-border bg-surface-700 p-4 shadow-2xl animate-in fade-in duration-150 md:absolute md:w-[320px] ${popoverPositionClass} popover-mobile`}
                  >
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-3 flex items-center gap-1.5">
                      <Users size={12} /> Alineaciones y Equipos
                    </h3>
                    {teamConfigContent}
                  </div>
                )}
              </div>

              {/* Animación (key frames + playback) */}
              <div className="relative">
                <button
                  onClick={() => handleTogglePanel('animation')}
                  className={panelBtnClass(isAnimationOpen)}
                  title="Animación de jugadas"
                  aria-label="Animación de jugadas"
                  aria-expanded={isAnimationOpen}
                >
                  <Film size={16} />
                </button>
                {isAnimationOpen && (
                  <div
                    className={`z-[100] rounded-xl border border-border bg-surface-700 p-4 shadow-2xl animate-in fade-in duration-150 md:absolute md:w-[300px] ${popoverPositionClass} popover-mobile`}
                  >
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-3 flex items-center gap-1.5">
                      <Film size={12} /> Animación de Jugadas
                    </h3>
                    {animationContent}
                  </div>
                )}
              </div>

              {/* Settings & Board actions (Guardar, Exportar, Compartir) */}
              <div className="relative">
                <button
                  onClick={() => handleTogglePanel('settings')}
                  className={panelBtnClass(isSettingsOpen)}
                  title="Configuración y Archivo"
                  aria-label="Configuración y archivo"
                  aria-expanded={isSettingsOpen}
                >
                  <Settings size={16} />
                </button>
                {isSettingsOpen && (
                  <div
                    className={`z-[100] rounded-xl border border-border bg-surface-700 p-4 shadow-2xl animate-in fade-in duration-150 md:absolute md:w-[300px] ${popoverPositionClass} popover-mobile`}
                  >
                    <div className="space-y-4">
                      {/* Tactic Slots */}
                      <div>
                        <h4 className="text-[9px] font-bold uppercase tracking-wider text-text-muted mb-2 px-1">
                          Tácticas Guardadas
                        </h4>
                        <TacticSlots
                          compact
                          slotNames={slotNames}
                          onSaveSlot={onSaveSlot}
                          onLoadSlot={(idx) => {
                            closeAll();
                            onLoadSlot(idx);
                          }}
                          onDeleteSlot={onDeleteSlot}
                        />
                      </div>

                      <div className="h-px bg-white/5" />

                      {/* Export Actions */}
                      <div>
                        <h4 className="text-[9px] font-bold uppercase tracking-wider text-text-muted mb-2 px-1">Exportar</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              closeAll();
                              onExportPng();
                            }}
                            className="flex items-center justify-center gap-2 py-2 px-2.5 rounded-lg bg-surface-800 hover:bg-surface-600 border border-border hover:border-white/10 transition-colors group cursor-pointer"
                            title="Exportar como imagen PNG"
                          >
                            <Image size={14} className="text-text-secondary group-hover:text-accent-400 transition-colors" />
                            <span className="text-xs font-semibold text-text-primary">Imagen PNG</span>
                          </button>
                          <button
                            onClick={() => {
                              closeAll();
                              onExportPdf();
                            }}
                            className="flex items-center justify-center gap-2 py-2 px-2.5 rounded-lg bg-surface-800 hover:bg-surface-600 border border-border hover:border-white/10 transition-colors group cursor-pointer"
                            title="Descargar en PDF A4"
                          >
                            <FileText size={14} className="text-text-secondary group-hover:text-accent-400 transition-colors" />
                            <span className="text-xs font-semibold text-text-primary">PDF A4</span>
                          </button>
                        </div>
                      </div>

                      <div className="h-px bg-white/5" />

                      {/* Share Actions */}
                      <div>
                        <h4 className="text-[9px] font-bold uppercase tracking-wider text-text-muted mb-2 px-1">Compartir</h4>
                        {shareUrl ? (
                          <div className="space-y-2">
                            <p className="text-[9px] text-text-muted leading-tight px-1">
                              Copia este enlace de abajo para compartir tu táctica:
                            </p>
                            <div className="flex items-center gap-1.5">
                              <input
                                readOnly
                                value={shareUrl}
                                onClick={(e) => (e.target as HTMLInputElement).select()}
                                className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-surface-900/80 text-[10px] text-text-secondary border border-border font-mono truncate outline-none focus:ring-1 focus:ring-accent-500/30"
                                aria-label="Enlace para compartir"
                              />
                              <button
                                onClick={copyShareLink}
                                className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-150 cursor-pointer active:scale-90 shrink-0 ${
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
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-surface-600 text-text-secondary hover:text-text-primary transition-colors group cursor-pointer"
                          >
                            <div className="w-7 h-7 rounded bg-surface-800 flex items-center justify-center border border-border shrink-0 group-hover:text-accent-400 transition-colors">
                              <Link2 size={14} />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-semibold leading-tight">Generar Enlace</span>
                              <span className="text-[9px] opacity-70 leading-tight">Crea un enlace para compartir</span>
                            </div>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
