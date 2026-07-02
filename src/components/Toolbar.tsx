import { useState } from 'react';
import { Icon, Triangle, Minus, Type, Trash2, ChevronDown, Sparkles } from 'lucide-react';
import { soccerBall } from '@lucide/lab';
import type { ElementType } from '../types';

interface ToolbarProps {
  onAdd: (type: ElementType | 'arrow') => void;
  onClearExtras?: () => void;
  isMobile?: boolean;
}

export default function Toolbar({ onAdd, onClearExtras, isMobile = false }: ToolbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (type: ElementType | 'arrow') => {
    onAdd(type);
    setIsOpen(false);
  };

  const handleClear = () => {
    onClearExtras?.();
    setIsOpen(false);
  };

  // Standardized premium items
  const items = [
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

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95 ${
          isOpen
            ? 'bg-accent-500/20 text-accent-400 border-accent-500/30 shadow-[0_0_10px_rgba(99,102,241,0.15)]'
            : 'bg-surface-700/60 text-text-secondary hover:text-text-primary border-border hover:bg-surface-700'
        }`}
      >
        <Sparkles size={14} className="shrink-0 text-accent-400" />
        <span>Extras</span>
        <ChevronDown size={12} className={`transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop catcher at z-[90] */}
          <div className="fixed inset-0 z-[90]" onClick={() => setIsOpen(false)} />
          
          {/* Dropdown panel at z-[100] (guaranteed above field) */}
          <div
            className={`z-[100] border border-border bg-surface-700 p-2 shadow-2xl rounded-xl select-none ${
              isMobile
                ? 'popover-mobile animate-in fade-in slide-in-from-bottom-2 duration-150'
                : 'absolute left-1/2 -translate-x-1/2 mt-2 w-56 animate-in fade-in slide-in-from-top-1 duration-150'
            }`}
          >
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-text-secondary px-2.5 py-1.5 border-b border-white/5 mb-1.5">
              Elementos adicionales
            </h3>
            
            <div className="space-y-0.5">
              {items.map((item) => (
                <button
                  key={item.type}
                  onClick={() => handleSelect(item.type)}
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
                  onClick={handleClear}
                  className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left hover:bg-red-500/10 text-red-400 transition-colors cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-500/5 flex items-center justify-center border border-red-500/10 group-hover:border-red-500/20 shrink-0">
                    <Trash2 size={18} strokeWidth={2} className="text-red-400" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold leading-tight">Limpiar campo</span>
                    <span className="text-[9px] opacity-70 leading-tight">Borra todos los extras</span>
                  </div>
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
