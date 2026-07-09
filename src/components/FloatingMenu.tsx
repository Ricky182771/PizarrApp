import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Users, 
  Save, 
  RotateCcw, 
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
  Check
} from 'lucide-react';
import { soccerBall } from '@lucide/lab';
import type { ElementType } from '../types';

interface FloatingMenuProps {
  onAddTool: (type: ElementType | 'arrow') => void;
  onClearExtras?: () => void;
  onGuardar: () => void;
  onReiniciar: () => void;
  onExportPng: () => void;
  onExportPdf: () => void;
  generateShareLink: () => void;
  copyShareLink: () => void;
  shareUrl: string;
  isCopied: boolean;

  isTeamConfigOpen: boolean;
  setIsTeamConfigOpen: (open: boolean) => void;
  teamConfigContent: React.ReactNode;
}

export default function FloatingMenu({
  onAddTool,
  onClearExtras,
  onGuardar,
  onReiniciar,
  onExportPng,
  onExportPdf,
  generateShareLink,
  copyShareLink,
  shareUrl,
  isCopied,
  isTeamConfigOpen,
  setIsTeamConfigOpen,
  teamConfigContent
}: FloatingMenuProps) {
  const isMounted = true;
  const [isExpanded, setIsExpanded] = useState(() => typeof process !== 'undefined' && process.env.NODE_ENV === 'test');
  const [isExtrasOpen, setIsExtrasOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [position, setPosition] = useState(() => {
    // Center of the collapsed circle (w-14 h-14 -> width 56)
    const initialX = typeof window !== 'undefined' ? window.innerWidth - 80 + 28 : 0;
    const initialY = typeof window !== 'undefined' ? window.innerHeight - 150 + 28 : 0;
    return { x: initialX, y: initialY };
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const clickStartRef = useRef({ x: 0, y: 0 });
  const clickTimeRef = useRef(0);



  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        const width = containerRef.current?.offsetWidth || 56;
        const height = containerRef.current?.offsetHeight || 56;
        const minX = width / 2 + 8;
        const maxX = window.innerWidth - width / 2 - 8;
        const minY = height / 2 + 8;
        const maxY = window.innerHeight - height / 2 - 8;
        return {
          x: Math.max(minX, Math.min(maxX, prev.x)),
          y: Math.max(minY, Math.min(maxY, prev.y)),
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isMounted) return null;

  const closeAll = () => {
    setIsExtrasOpen(false);
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

    e.preventDefault();
    isDraggingRef.current = true;
    clickStartRef.current = { x: e.clientX, y: e.clientY };
    clickTimeRef.current = Date.now();
    dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };

    document.body.style.touchAction = 'none';

    if (containerRef.current) {
      containerRef.current.setPointerCapture(e.pointerId);
    }
    e.stopPropagation();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;

    const newX = e.clientX - dragStartRef.current.x;
    const newY = e.clientY - dragStartRef.current.y;

    // Clamp coordinates relative to center position
    const width = containerRef.current?.offsetWidth || 56;
    const height = containerRef.current?.offsetHeight || 56;
    
    const minX = width / 2 + 8;
    const maxX = window.innerWidth - width / 2 - 8;
    const minY = height / 2 + 8;
    const maxY = window.innerHeight - height / 2 - 8;

    setPosition({
      x: Math.max(minX, Math.min(maxX, newX)),
      y: Math.max(minY, Math.min(maxY, newY)),
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;

    isDraggingRef.current = false;
    document.body.style.touchAction = '';

    if (containerRef.current) {
      try {
        containerRef.current.releasePointerCapture(e.pointerId);
      } catch {
        // Ignored
      }
    }

    const duration = Date.now() - clickTimeRef.current;
    const dx = e.clientX - clickStartRef.current.x;
    const dy = e.clientY - clickStartRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If collapsed, clicking/tapping the container expands it.
    // Tapping allows minor drag/duration shifts common on mobile touches.
    if (!isExpanded) {
      if (distance < 15 || duration < 250) {
        setIsExpanded(true);
      }
    }
  };

  const handleTogglePanel = (panel: 'extras' | 'teams' | 'settings') => {
    if (panel === 'extras') {
      setIsExtrasOpen(!isExtrasOpen);
      setIsSettingsOpen(false);
      setIsTeamConfigOpen(false);
    } else if (panel === 'teams') {
      setIsTeamConfigOpen(!isTeamConfigOpen);
      setIsExtrasOpen(false);
      setIsSettingsOpen(false);
    } else if (panel === 'settings') {
      setIsSettingsOpen(!isSettingsOpen);
      setIsExtrasOpen(false);
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
  } ${
    isLeftHalf ? 'left-0' : 'right-0'
  }`;

  const extrasItems = [
    {
      type: 'ball' as const,
      label: 'Balón',
      desc: 'Añadir balón al campo',
      icon: <Icon iconNode={soccerBall} size={18} strokeWidth={2} className="text-emerald-400" />,
    },
    {
      type: 'cone' as const,
      label: 'Cono',
      desc: 'Cono de entrenamiento',
      icon: <Triangle size={18} strokeWidth={2} className="text-orange-400 fill-orange-400/20" />,
    },
    {
      type: 'arrow' as const,
      label: 'Línea',
      desc: 'Flecha táctica interactiva',
      icon: <Minus size={18} strokeWidth={2.5} className="text-yellow-400" />,
    },
    {
      type: 'text' as const,
      label: 'Texto',
      desc: 'Etiqueta de texto libre',
      icon: <Type size={18} strokeWidth={2} className="text-cyan-400" />,
    },
  ];

  const anyPanelOpen = isExtrasOpen || isTeamConfigOpen || isSettingsOpen;

  return (
    <>
      {/* Global backdrop click catcher when any panel is open */}
      {anyPanelOpen && (
        <div 
          className="fixed inset-0 z-[80]" 
          onClick={closeAll} 
        />
      )}

      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          left: 0,
          top: 0,
          transform: `translate3d(calc(${position.x}px - 50%), calc(${position.y}px - 50%), 0)`,
          touchAction: 'none',
        }}
        className={`fixed z-[95] transition-shadow duration-200 select-none ${
          isExpanded 
            ? 'p-2 rounded-2xl bg-surface-800/90 border border-border backdrop-blur-md shadow-2xl flex items-center gap-2' 
            : 'w-14 h-14 rounded-full bg-gradient-to-br from-accent-500 to-accent-600 border border-accent-400/30 shadow-[0_4px_20px_rgba(99,102,241,0.4)] flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-105 active:scale-95 transition-all duration-150'
        }`}
      >
        {!isExpanded ? (
          <div className="pointer-events-none flex items-center justify-center">
            <Icon iconNode={soccerBall} size={28} strokeWidth={2} className="text-white animate-pulse" />
          </div>
        ) : (
          <>
            {/* Grip handle for dragging */}
            <div className="flex items-center justify-center px-1 py-2 cursor-grab active:cursor-grabbing text-text-muted hover:text-text-secondary shrink-0">
              <GripVertical size={16} />
            </div>

            {/* Quick Collapse Button */}
            <button
              onClick={() => { setIsExpanded(false); closeAll(); }}
              className="flex items-center justify-center w-8 h-8 rounded-xl bg-surface-700/60 text-text-secondary hover:text-text-primary border border-border cursor-pointer transition-colors"
              title="Colapsar menú"
            >
              <Icon iconNode={soccerBall} size={18} strokeWidth={2} className="text-accent-400" />
            </button>

            {/* divider */}
            <div className="w-px h-6 bg-white/10 shrink-0" />

            {/* Actions list */}
            <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 duration-150">
              {/* Extras menu */}
              <div className="relative">
                <button
                  onClick={() => handleTogglePanel('extras')}
                  className={`flex items-center justify-center w-9 h-9 rounded-xl border transition-all cursor-pointer active:scale-90 ${
                    isExtrasOpen
                      ? 'bg-accent-500/20 text-accent-400 border-accent-500/30 font-semibold'
                      : 'bg-surface-700/60 text-text-secondary border-border hover:bg-surface-700 hover:text-text-primary'
                  }`}
                  title="Extras"
                >
                  <Sparkles size={16} className={isExtrasOpen ? 'text-accent-400' : 'text-text-secondary'} />
                </button>
                
                {isExtrasOpen && (
                  <div className={`z-[100] border border-border bg-surface-700 p-2 shadow-2xl rounded-xl animate-in fade-in duration-150 md:absolute md:w-56 ${popoverPositionClass} popover-mobile`}>
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
                          <div className="w-8 h-8 rounded-lg bg-surface-800 flex items-center justify-center border border-border group-hover:border-white/10 shrink-0">
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
                  className={`flex items-center justify-center w-9 h-9 rounded-xl border transition-all cursor-pointer active:scale-90 ${
                    isTeamConfigOpen
                      ? 'bg-accent-500/20 text-accent-400 border-accent-500/30'
                      : 'bg-surface-700/60 text-text-secondary border-border hover:bg-surface-700 hover:text-text-primary'
                  }`}
                  title="Configurar alineación y uniformes"
                >
                  <Users size={16} />
                </button>
                {isTeamConfigOpen && (
                  <div className={`z-[100] rounded-xl border border-border bg-surface-700 p-4 shadow-2xl animate-in fade-in duration-150 md:absolute md:w-[320px] ${popoverPositionClass} popover-mobile`}>
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-3 flex items-center gap-1.5">
                      <Users size={12} /> Alineaciones y Equipos
                    </h3>
                    {teamConfigContent}
                  </div>
                )}
              </div>

              {/* Settings & Board actions (Guardar, Reiniciar, Exportar, Compartir) */}
              <div className="relative">
                <button
                  onClick={() => handleTogglePanel('settings')}
                  className={`flex items-center justify-center w-9 h-9 rounded-xl border transition-all cursor-pointer active:scale-90 ${
                    isSettingsOpen
                      ? 'bg-accent-500/20 text-accent-400 border-accent-500/30 font-semibold'
                      : 'bg-surface-700/60 text-text-secondary border-border hover:bg-surface-700 hover:text-text-primary'
                  }`}
                  title="Configuración y Archivo"
                >
                  <Settings size={16} />
                </button>
                {isSettingsOpen && (
                  <div className={`z-[100] rounded-xl border border-border bg-surface-700 p-4 shadow-2xl animate-in fade-in duration-150 md:absolute md:w-[300px] ${popoverPositionClass} popover-mobile`}>
                    <div className="space-y-4">
                      {/* Board Actions */}
                      <div>
                        <h4 className="text-[9px] font-bold uppercase tracking-wider text-text-muted mb-2 px-1">Pizarra</h4>
                        <div className="space-y-1">
                          <button 
                            onClick={() => { closeAll(); onGuardar(); }} 
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-surface-600 transition-colors group cursor-pointer"
                          >
                            <div className="w-7 h-7 rounded bg-accent-500/10 text-accent-400 flex items-center justify-center border border-accent-500/20 shrink-0">
                              <Save size={14} />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-semibold text-text-primary leading-tight">Guardar Táctica</span>
                              <span className="text-[9px] text-text-muted leading-tight">Guarda el progreso localmente</span>
                            </div>
                          </button>

                          <button 
                            onClick={() => { closeAll(); onReiniciar(); }} 
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-red-500/10 text-red-400 transition-colors group cursor-pointer"
                          >
                            <div className="w-7 h-7 rounded bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20 shrink-0">
                              <RotateCcw size={14} />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-semibold leading-tight">Reiniciar Cancha</span>
                              <span className="text-[9px] opacity-70 leading-tight">Limpia y resetea las fichas</span>
                            </div>
                          </button>
                        </div>
                      </div>

                      <div className="h-px bg-white/5" />

                      {/* Export Actions */}
                      <div>
                        <h4 className="text-[9px] font-bold uppercase tracking-wider text-text-muted mb-2 px-1">Exportar</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={() => { closeAll(); onExportPng(); }} 
                            className="flex items-center justify-center gap-2 py-2 px-2.5 rounded-lg bg-surface-800 hover:bg-surface-600 border border-border hover:border-white/10 transition-colors group cursor-pointer"
                            title="Exportar como imagen PNG"
                          >
                            <Image size={14} className="text-emerald-400" />
                            <span className="text-xs font-semibold text-text-primary">Imagen PNG</span>
                          </button>
                          <button 
                            onClick={() => { closeAll(); onExportPdf(); }} 
                            className="flex items-center justify-center gap-2 py-2 px-2.5 rounded-lg bg-surface-800 hover:bg-surface-600 border border-border hover:border-white/10 transition-colors group cursor-pointer"
                            title="Descargar en PDF A4"
                          >
                            <FileText size={14} className="text-rose-400" />
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
                                className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-surface-900/80 text-[10px] text-text-secondary border border-border font-mono truncate outline-none focus:ring-1 focus:ring-emerald-500/30" 
                              />
                              <button 
                                onClick={copyShareLink}
                                className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-150 cursor-pointer active:scale-90 shrink-0 ${
                                  isCopied ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-surface-600 text-text-secondary hover:text-text-primary border-border hover:bg-surface-500'
                                }`} 
                                title="Copiar enlace"
                              >
                                {isCopied ? <Check size={14} /> : <Copy size={14} />}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={generateShareLink} 
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-emerald-500/10 text-emerald-400 transition-colors group cursor-pointer"
                          >
                            <div className="w-7 h-7 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
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
