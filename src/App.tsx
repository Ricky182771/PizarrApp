import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Cancha from './components/Cancha'
import FichaJugador from './components/FichaJugador'
import FloatingMenu from './components/FloatingMenu'
import DesktopSidebar from './components/DesktopSidebar'
import DraggableElement from './components/DraggableElement'
import InteractiveArrow from './components/InteractiveArrow'
import { uid, isValidTacticaGuardada } from './types'
import type { Jugador, FieldElement, ArrowItem, TacticaGuardada, ElementType } from './types'
import { Plus, Minus, Pencil, Maximize, Minimize } from 'lucide-react'

const LS_KEY = 'pizarra-tactica'

/* ── Default formations ───────────────────────────────────────────────── */
const formacionLocal: Jugador[] = [
  { numero: 1,  nombre: 'GK',       x: 6,   y: 50 },
  { numero: 4,  nombre: 'Ramos',    x: 18,  y: 20 },
  { numero: 3,  nombre: 'Piqué',    x: 18,  y: 42 },
  { numero: 15, nombre: 'Valverde', x: 18,  y: 62 },
  { numero: 2,  nombre: 'Carvajal', x: 18,  y: 82 },
  { numero: 8,  nombre: 'Kroos',    x: 35,  y: 35 },
  { numero: 11, nombre: 'Modric',   x: 35,  y: 65 },
  { numero: 22, nombre: 'Isco',     x: 42,  y: 50 },
  { numero: 7,  nombre: 'Mbappé',   x: 44,  y: 18 },
  { numero: 9,  nombre: 'Benzema',  x: 48,  y: 50 },
  { numero: 10, nombre: 'Vini Jr',  x: 44,  y: 82 },
]

const formacionVisitante: Jugador[] = [
  { numero: 1,  nombre: 'GK',       x: 94,  y: 50 },
  { numero: 5,  nombre: 'Stones',   x: 82,  y: 20 },
  { numero: 6,  nombre: 'Dias',     x: 82,  y: 42 },
  { numero: 3,  nombre: 'Aké',      x: 82,  y: 62 },
  { numero: 2,  nombre: 'Walker',   x: 82,  y: 82 },
  { numero: 16, nombre: 'Rodrigo',  x: 68,  y: 50 },
  { numero: 17, nombre: 'De Bruyne',x: 62,  y: 30 },
  { numero: 20, nombre: 'B. Silva', x: 62,  y: 70 },
  { numero: 47, nombre: 'Foden',    x: 56,  y: 18 },
  { numero: 9,  nombre: 'Haaland',  x: 52,  y: 50 },
  { numero: 11, nombre: 'Grealish', x: 56,  y: 82 },
]

const formacion7Local: Jugador[] = [
  { numero: 1,  nombre: 'GK',       x: 6,   y: 50 },
  { numero: 3,  nombre: 'Piqué',    x: 18,  y: 30 },
  { numero: 4,  nombre: 'Ramos',    x: 18,  y: 70 },
  { numero: 8,  nombre: 'Kroos',    x: 35,  y: 50 },
  { numero: 11, nombre: 'Modric',   x: 42,  y: 25 },
  { numero: 22, nombre: 'Isco',     x: 42,  y: 75 },
  { numero: 9,  nombre: 'Benzema',  x: 48,  y: 50 },
]

const formacion7Visitante: Jugador[] = [
  { numero: 1,  nombre: 'GK',       x: 94,  y: 50 },
  { numero: 6,  nombre: 'Dias',     x: 82,  y: 30 },
  { numero: 5,  nombre: 'Stones',   x: 82,  y: 70 },
  { numero: 16, nombre: 'Rodrigo',  x: 65,  y: 50 },
  { numero: 17, nombre: 'De Bruyne',x: 58,  y: 25 },
  { numero: 20, nombre: 'B. Silva', x: 58,  y: 75 },
  { numero: 9,  nombre: 'Haaland',  x: 52,  y: 50 },
]

const formacion9Local: Jugador[] = [
  { numero: 1,  nombre: 'GK',       x: 6,   y: 50 },
  { numero: 3,  nombre: 'Piqué',    x: 18,  y: 25 },
  { numero: 4,  nombre: 'Ramos',    x: 18,  y: 50 },
  { numero: 15, nombre: 'Valverde', x: 18,  y: 75 },
  { numero: 8,  nombre: 'Kroos',    x: 35,  y: 30 },
  { numero: 11, nombre: 'Modric',   x: 35,  y: 70 },
  { numero: 22, nombre: 'Isco',     x: 42,  y: 50 },
  { numero: 7,  nombre: 'Mbappé',   x: 46,  y: 25 },
  { numero: 9,  nombre: 'Benzema',  x: 48,  y: 75 },
]

const formacion9Visitante: Jugador[] = [
  { numero: 1,  nombre: 'GK',       x: 94,  y: 50 },
  { numero: 6,  nombre: 'Dias',     x: 82,  y: 25 },
  { numero: 5,  nombre: 'Stones',   x: 82,  y: 50 },
  { numero: 3,  nombre: 'Aké',      x: 82,  y: 75 },
  { numero: 16, nombre: 'Rodrigo',  x: 65,  y: 30 },
  { numero: 17, nombre: 'De Bruyne',x: 65,  y: 70 },
  { numero: 20, nombre: 'B. Silva', x: 58,  y: 50 },
  { numero: 47, nombre: 'Foden',    x: 54,  y: 25 },
  { numero: 9,  nombre: 'Haaland',  x: 52,  y: 75 },
]

/* ── Helpers ──────────────────────────────────────────────────────────── */
function loadFromLS(): TacticaGuardada | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    const data: unknown = JSON.parse(raw)
    return isValidTacticaGuardada(data) ? data : null
  } catch {
    return null
  }
}

/* ── Tactic Slot helpers (3 local slots) ─────────────────────────────── */
const LS_SLOT_KEYS = [
  'pizarra-tactica-slot-1',
  'pizarra-tactica-slot-2',
  'pizarra-tactica-slot-3',
] as const

function loadSlot(slotIndex: number): TacticaGuardada | null {
  try {
    const key = LS_SLOT_KEYS[slotIndex]
    if (!key) return null
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const data: unknown = JSON.parse(raw)
    return isValidTacticaGuardada(data) ? data : null
  } catch {
    return null
  }
}

function getSlotName(slotIndex: number): string {
  try {
    const key = LS_SLOT_KEYS[slotIndex]
    if (!key) return ''
    const raw = localStorage.getItem(key)
    if (!raw) return ''
    const data = JSON.parse(raw) as Record<string, unknown>
    return (data.tacticName as string) || `Táctica ${slotIndex + 1}`
  } catch {
    return ''
  }
}

function deepClone<T>(arr: T[]): T[] {
  return arr.map((item) => ({ ...item }))
}

function getNextUnusedNumber(players: Jugador[]): number {
  const numbers = new Set(players.map((p) => p.numero))
  let num = 1
  while (numbers.has(num)) {
    num++
  }
  return num
}

function changeFormation(currentPlayers: Jugador[], targetPreset: Jugador[]): Jugador[] {
  const sz = targetPreset.length
  const result: Jugador[] = []
  for (let i = 0; i < sz; i++) {
    if (i < currentPlayers.length) {
      result.push({
        ...currentPlayers[i],
        x: targetPreset[i].x,
        y: targetPreset[i].y,
      })
    } else {
      result.push({
        ...targetPreset[i]
      })
    }
  }
  return result
}

/* ── URL-safe compression (for shareable links) ──────────────────────── */
async function compressToUrlSafe(json: string): Promise<string> {
  const stream = new Blob([json]).stream().pipeThrough(new CompressionStream('deflate-raw'))
  const buffer = await new Response(stream).arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function decompressFromUrlSafe(encoded: string): Promise<string | null> {
  try {
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
    while (base64.length % 4) base64 += '='
    const binary = atob(base64)
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
    return await new Response(stream).text()
  } catch {
    return null
  }
}

/* ── Component ────────────────────────────────────────────────────────── */
function App() {
  const canchaRef = useRef<HTMLDivElement>(null)

  // Try to hydrate from LocalStorage on first render
  const [initialData] = useState(() => {
    const saved = loadFromLS()
    return {
      local: saved ? deepClone(saved.local) : deepClone(formacionLocal),
      visitante: saved ? deepClone(saved.visitante) : deepClone(formacionVisitante),
      colorLocal: saved?.colorLocal ?? '#2563eb',
      colorVisitante: saved?.colorVisitante ?? '#dc2626',
      elements: saved?.elements ? deepClone(saved.elements) : [],
      arrows: saved?.arrows ? deepClone(saved.arrows) : [],
      nombreLocal: saved?.nombreLocal ?? 'Local',
      nombreVisitante: saved?.nombreVisitante ?? 'Visitante',
      golesLocal: saved?.golesLocal ?? 0,
      golesVisitante: saved?.golesVisitante ?? 0,
      mostrarMarcador: saved?.mostrarMarcador ?? false,
      marcadorX: saved?.marcadorX ?? 50,
      marcadorY: saved?.marcadorY ?? 7,
    }
  })

  const [local, setLocal] = useState<Jugador[]>(initialData.local)
  const [visitante, setVisitante] = useState<Jugador[]>(initialData.visitante)
  const [colorLocal, setColorLocal] = useState(initialData.colorLocal)
  const [colorVisitante, setColorVisitante] = useState(initialData.colorVisitante)
  const [elements, setElements] = useState<FieldElement[]>(initialData.elements)
  const [arrows, setArrows] = useState<ArrowItem[]>(initialData.arrows)
  const [nombreLocal, setNombreLocal] = useState(initialData.nombreLocal)
  const [nombreVisitante, setNombreVisitante] = useState(initialData.nombreVisitante)
  const [golesLocal, setGolesLocal] = useState(initialData.golesLocal)
  const [golesVisitante, setGolesVisitante] = useState(initialData.golesVisitante)
  const [mostrarMarcador, setMostrarMarcador] = useState(initialData.mostrarMarcador)
  const [marcadorX, setMarcadorX] = useState(initialData.marcadorX)
  const [marcadorY, setMarcadorY] = useState(initialData.marcadorY)

  const [tacticName, setTacticName] = useState(() => {
    const saved = loadFromLS()
    return saved?.tacticName ?? 'Pizarra de Tácticas'
  })

  /*
   * resetKey — Incrementing this forces React to unmount and remount every
   * FichaJugador/element/arrow, resetting Framer Motion's internal drag offsets.
   */
  const [resetKey, setResetKey] = useState(0)

  // Alignment configuration popup state
  const [isTeamConfigOpen, setIsTeamConfigOpen] = useState(false)

  const [activeColorPicker, setActiveColorPicker] = useState<{
    team: 'local' | 'visitante';
    rect: DOMRect;
  } | null>(null);

  // Share link state
  const [shareUrl, setShareUrl] = useState('')
  const [isCopied, setIsCopied] = useState(false)

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false)
  const fieldContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.title = `${tacticName.slice(0, 100)} - PizarrApp Táctica`
  }, [tacticName])

  // Telegram Mini App initialisation
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      
      try {
        tg.setHeaderColor(tg.themeParams.secondary_bg_color || '#12121a');
        tg.setBackgroundColor(tg.themeParams.bg_color || '#0a0a0f');
      } catch (e) {
        console.warn('Could not set Telegram header/background colors:', e);
      }
    }
  }, [])

  /* ── Fullscreen API ───────────────────────────────────────────────── */
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await fieldContainerRef.current?.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch {
      showToast('⚠ Pantalla completa no disponible')
    }
  }

  /* ── Mobile detection ────────────────────────────────────────────── */
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  /* Feedback toast state */
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(null)

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(null), 2000)
  }, [])

  /* ── Load tactic from shareable URL hash on mount ─────────────────── */
  useEffect(() => {
    const loadFromHash = async () => {
      const hash = window.location.hash
      if (!hash.startsWith('#t=')) return
      const encoded = hash.slice(3)
      const json = await decompressFromUrlSafe(encoded)
      if (!json) return
      try {
        const parsed: unknown = JSON.parse(json)
        if (!isValidTacticaGuardada(parsed)) return
        setLocal(deepClone(parsed.local))
        setVisitante(deepClone(parsed.visitante))
        setColorLocal(parsed.colorLocal)
        setColorVisitante(parsed.colorVisitante)
        setElements(deepClone(parsed.elements))
        setArrows(deepClone(parsed.arrows))
        if (parsed.tacticName) setTacticName(parsed.tacticName)
        if (parsed.nombreLocal) setNombreLocal(parsed.nombreLocal)
        if (parsed.nombreVisitante) setNombreVisitante(parsed.nombreVisitante)
        if (parsed.golesLocal !== undefined) setGolesLocal(parsed.golesLocal)
        if (parsed.golesVisitante !== undefined) setGolesVisitante(parsed.golesVisitante)
        if (parsed.mostrarMarcador !== undefined) setMostrarMarcador(parsed.mostrarMarcador)
        if (parsed.marcadorX !== undefined) setMarcadorX(parsed.marcadorX)
        if (parsed.marcadorY !== undefined) setMarcadorY(parsed.marcadorY)
        setResetKey((k) => k + 1)
        window.history.replaceState(null, '', window.location.pathname)
        showToast('✓ Táctica cargada desde enlace')
      } catch { /* ignore malformed data */ }
    }
    loadFromHash()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── Prevent mobile browser pull-to-refresh and history swipe navigation ── */
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        // Prevent multi-touch pinch zoom
        if (e.cancelable) e.preventDefault()
      }

      const touch = e.touches[0]
      const edgeThreshold = 25
      const isNearEdge = touch.clientX < edgeThreshold || touch.clientX > window.innerWidth - edgeThreshold

      if (isNearEdge) {
        const target = e.target as HTMLElement
        const isInteractive =
          target.closest('button') ||
          target.closest('input') ||
          target.closest('select') ||
          target.closest('textarea') ||
          target.closest('.cursor-grab') ||
          target.closest('.cursor-pointer') ||
          target.closest('[role="button"]')

        if (!isInteractive && e.cancelable) {
          e.preventDefault()
        }
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement
      const isInteractive =
        target.closest('button') ||
        target.closest('input') ||
        target.closest('select') ||
        target.closest('textarea') ||
        target.closest('a')

      if (!isInteractive && e.cancelable) {
        e.preventDefault()
      }
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: false })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
    }
  }, [])

  /* ── Share link helpers ───────────────────────────────────────────── */
  const generateShareLink = async () => {
    const data: TacticaGuardada = {
      local, visitante, colorLocal, colorVisitante, elements, arrows, tacticName,
      nombreLocal, nombreVisitante, golesLocal, golesVisitante, mostrarMarcador,
      marcadorX, marcadorY,
    }
    const json = JSON.stringify(data)
    const compressed = await compressToUrlSafe(json)
    const url = `${window.location.origin}${window.location.pathname}#t=${compressed}`
    setShareUrl(url)
    setIsCopied(false)
  }

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = shareUrl
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setIsCopied(true)
    showToast('✓ Enlace copiado')
    setTimeout(() => setIsCopied(false), 2000)
  }

  /* ── Drag handlers ────────────────────────────────────────────────── */
  const handleLocalDragEnd = useCallback(
    (numero: number) => (x: number, y: number) => {
      setLocal((prev) =>
        prev.map((j) => (j.numero === numero ? { ...j, x, y } : j)),
      )
    },
    [],
  )

  const handleVisitanteDragEnd = useCallback(
    (numero: number) => (x: number, y: number) => {
      setVisitante((prev) =>
        prev.map((j) => (j.numero === numero ? { ...j, x, y } : j)),
      )
    },
    [],
  )

  /* ── Player Delete & Name Change ──────────────────────────────────── */
  const handleDeleteLocalPlayer = useCallback(
    (numero: number) => {
      setLocal((prev) => prev.filter((j) => j.numero !== numero))
      showToast('Jugador eliminado')
    },
    [],
  )

  const handleDeleteVisitantePlayer = useCallback(
    (numero: number) => {
      setVisitante((prev) => prev.filter((j) => j.numero !== numero))
      showToast('Jugador eliminado')
    },
    [],
  )

  const handleLocalNameChange = useCallback(
    (numero: number, newName: string) => {
      setLocal((prev) =>
        prev.map((j) => (j.numero === numero ? { ...j, nombre: newName } : j)),
      )
    },
    [],
  )

  const handleVisitanteNameChange = useCallback(
    (numero: number, newName: string) => {
      setVisitante((prev) =>
        prev.map((j) => (j.numero === numero ? { ...j, nombre: newName } : j)),
      )
    },
    [],
  )

  const handleLocalNumberChange = useCallback(
    (oldNumero: number, newNumero: number) => {
      const isTaken = local.some((j) => j.numero === newNumero)
      if (isTaken) {
        showToast(`El número ${newNumero} ya está ocupado`)
        return
      }
      setLocal((prev) =>
        prev.map((j) => (j.numero === oldNumero ? { ...j, numero: newNumero } : j)),
      )
    },
    [local, showToast],
  )

  const handleVisitanteNumberChange = useCallback(
    (oldNumero: number, newNumero: number) => {
      const isTaken = visitante.some((j) => j.numero === newNumero)
      if (isTaken) {
        showToast(`El número ${newNumero} ya está ocupado`)
        return
      }
      setVisitante((prev) =>
        prev.map((j) => (j.numero === oldNumero ? { ...j, numero: newNumero } : j)),
      )
    },
    [visitante, showToast],
  )

  /* ── Element Add & Update Handlers ────────────────────────────────── */
  const handleAddTool = (type: ElementType | 'arrow') => {
    if (type === 'arrow') {
      const newArrow: ArrowItem = {
        id: uid(),
        x1: 45,
        y1: 45,
        x2: 55,
        y2: 55,
      }
      setArrows((prev) => [...prev, newArrow])
      showToast('+ Línea añadida')
    } else {
      const newElement: FieldElement = {
        id: uid(),
        type,
        x: 50,
        y: 50,
        text: type === 'text' ? 'Texto' : undefined,
      }
      setElements((prev) => [...prev, newElement])
      const names: Record<ElementType, string> = {
        ball: 'Balón',
        cone: 'Cono',
        text: 'Texto',
        goal: 'Portería',
        dummy: 'Barrera',
      }
      showToast(`+ ${names[type] || 'Elemento'} añadido`)
    }
  }

  const handleElementDragEnd = (id: string, x: number, y: number) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, x, y } : el)),
    )
  }

  const handleElementDelete = (id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id))
    showToast('Elemento eliminado')
  }

  const handleElementTextChange = (id: string, text: string) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, text } : el)),
    )
  }

  const handleArrowUpdate = (id: string, updates: Partial<ArrowItem>) => {
    setArrows((prev) =>
      prev.map((arr) => (arr.id === id ? { ...arr, ...updates } : arr)),
    )
  }

  const handleArrowDelete = (id: string) => {
    setArrows((prev) => prev.filter((arr) => arr.id !== id))
    showToast('Línea eliminada')
  }

  const handleElementScaleChange = (id: string, scale: number) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, scale } : el)),
    )
  }

  const handleElementRotationChange = (id: string, rotation: number) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, rotation } : el)),
    )
  }

  const handleArrowScaleChange = (id: string, scale: number) => {
    setArrows((prev) =>
      prev.map((arr) => (arr.id === id ? { ...arr, scale } : arr)),
    )
  }

  /* ── Clear all extras (balls, cones, lines, text) ────────────────── */
  const clearExtras = () => {
    setElements([])
    setArrows([])
    setResetKey((k) => k + 1)
    showToast('🗑 Extras eliminados')
  }

  /* ── Save to LocalStorage ─────────────────────────────────────────── */
  const guardarTactica = () => {
    const data: TacticaGuardada = {
      local,
      visitante,
      colorLocal,
      colorVisitante,
      elements,
      arrows,
      tacticName,
      nombreLocal,
      nombreVisitante,
      golesLocal,
      golesVisitante,
      mostrarMarcador,
      marcadorX,
      marcadorY,
    }
    localStorage.setItem(LS_KEY, JSON.stringify(data))
    showToast('✓ Táctica guardada')
  }

  /* ── Tactic Slots (save/load 3 tactics) ──────────────────────────── */
  const [slotNames, setSlotNames] = useState<[string, string, string]>(() => [
    getSlotName(0),
    getSlotName(1),
    getSlotName(2),
  ])

  const refreshSlotNames = useCallback(() => {
    setSlotNames([getSlotName(0), getSlotName(1), getSlotName(2)])
  }, [])

  const getCurrentTacticData = useCallback((): TacticaGuardada => ({
    local, visitante, colorLocal, colorVisitante, elements, arrows, tacticName,
    nombreLocal, nombreVisitante, golesLocal, golesVisitante, mostrarMarcador,
    marcadorX, marcadorY,
  }), [local, visitante, colorLocal, colorVisitante, elements, arrows, tacticName,
    nombreLocal, nombreVisitante, golesLocal, golesVisitante, mostrarMarcador,
    marcadorX, marcadorY])

  const guardarEnSlot = useCallback((slotIndex: number) => {
    const key = LS_SLOT_KEYS[slotIndex]
    if (!key) return
    const data = getCurrentTacticData()
    localStorage.setItem(key, JSON.stringify(data))
    refreshSlotNames()
    showToast(`✓ Guardada en Táctica ${slotIndex + 1}`)
  }, [getCurrentTacticData, refreshSlotNames, showToast])

  const cargarDesdeSlot = useCallback((slotIndex: number) => {
    const saved = loadSlot(slotIndex)
    if (!saved) {
      showToast(`⚠ Táctica ${slotIndex + 1} está vacía`)
      return
    }
    setLocal(deepClone(saved.local))
    setVisitante(deepClone(saved.visitante))
    setColorLocal(saved.colorLocal)
    setColorVisitante(saved.colorVisitante)
    setElements(deepClone(saved.elements))
    setArrows(deepClone(saved.arrows))
    if (saved.tacticName) setTacticName(saved.tacticName)
    if (saved.nombreLocal) setNombreLocal(saved.nombreLocal)
    if (saved.nombreVisitante) setNombreVisitante(saved.nombreVisitante)
    if (saved.golesLocal !== undefined) setGolesLocal(saved.golesLocal)
    if (saved.golesVisitante !== undefined) setGolesVisitante(saved.golesVisitante)
    if (saved.mostrarMarcador !== undefined) setMostrarMarcador(saved.mostrarMarcador)
    if (saved.marcadorX !== undefined) setMarcadorX(saved.marcadorX)
    if (saved.marcadorY !== undefined) setMarcadorY(saved.marcadorY)
    setResetKey((k) => k + 1)
    showToast(`✓ Táctica ${slotIndex + 1} cargada`)
  }, [showToast])

  const borrarSlot = useCallback((slotIndex: number) => {
    const key = LS_SLOT_KEYS[slotIndex]
    if (!key) return
    localStorage.removeItem(key)
    refreshSlotNames()
    showToast(`🗑 Táctica ${slotIndex + 1} borrada`)
  }, [refreshSlotNames, showToast])

  /* ── Reset to initial formation ───────────────────────────────────── */
  const reiniciar = () => {
    setLocal(deepClone(formacionLocal))
    setVisitante(deepClone(formacionVisitante))
    setColorLocal('#2563eb')
    setColorVisitante('#dc2626')
    setNombreLocal('Local')
    setNombreVisitante('Visitante')
    setGolesLocal(0)
    setGolesVisitante(0)
    setMostrarMarcador(false)
    setMarcadorX(50)
    setMarcadorY(7)
    setElements([])
    setArrows([])
    localStorage.removeItem(LS_KEY)
    setResetKey((k) => k + 1)    // force re-mount to clear drag offsets
    showToast('↺ Formación reiniciada')
  }

  /* ── Render tactic to canvas (shared by PNG & PDF exports) ────────── */
  const renderTacticToCanvas = (): HTMLCanvasElement | null => {
    const canvas = document.createElement('canvas')
    if (isMobile) {
      canvas.width = 900
      canvas.height = 1600
    } else {
      canvas.width = 1600
      canvas.height = 900
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const w = canvas.width
    const h = canvas.height

    // 1. Grass background gradient
    const grad = ctx.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0, '#2d8a4e')
    grad.addColorStop(0.3, '#1b7a3a')
    grad.addColorStop(0.55, '#28924a')
    grad.addColorStop(0.8, '#1c6e38')
    grad.addColorStop(1, '#2d8a4e')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    // 2. Mowing stripes (12 stripes)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)'
    if (isMobile) {
      const stripeHeight = h / 12
      for (let i = 0; i < 12; i += 2) {
        ctx.fillRect(0, i * stripeHeight, w, stripeHeight)
      }
    } else {
      const stripeWidth = w / 12
      for (let i = 0; i < 12; i += 2) {
        ctx.fillRect(i * stripeWidth, 0, stripeWidth, h)
      }
    }

    // 3. Pitch lines styling
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)'
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Boundaries (4% margin)
    const padX = w * 0.04
    const padY = h * 0.04
    const fieldW = w * 0.92
    const fieldH = h * 0.92

    // Outer border
    ctx.strokeRect(padX, padY, fieldW, fieldH)

    if (isMobile) {
      // ═══════════════════════════════════════════════════════════
      // PORTRAIT FIELD LINES DRAWING
      // ═══════════════════════════════════════════════════════════
      // Center line (horizontal)
      ctx.beginPath()
      ctx.moveTo(padX, h / 2)
      ctx.lineTo(padX + fieldW, h / 2)
      ctx.stroke()

      // Center circle
      const centerRadius = fieldW * 0.18
      ctx.beginPath()
      ctx.arc(w / 2, h / 2, centerRadius, 0, Math.PI * 2)
      ctx.stroke()

      // Center spot
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.beginPath()
      ctx.arc(w / 2, h / 2, w * 0.006, 0, Math.PI * 2)
      ctx.fill()

      // Top Penalty Area
      const penAreaW = fieldW * 0.5929
      const penAreaH = fieldH * 0.1571
      const penAreaX = padX + fieldW * 0.2035
      ctx.strokeRect(penAreaX, padY, penAreaW, penAreaH)

      // Top Goal Area
      const goalAreaW = fieldW * 0.2694
      const goalAreaH = fieldH * 0.0524
      const goalAreaX = padX + fieldW * 0.3653
      ctx.strokeRect(goalAreaX, padY, goalAreaW, goalAreaH)

      // Top Penalty Spot
      const topPenSpotY = padY + fieldH * 0.1048
      ctx.beginPath()
      ctx.arc(w / 2, topPenSpotY, w * 0.005, 0, Math.PI * 2)
      ctx.fill()

      // Top Penalty Arc (the "D")
      const penArcRadius = fieldH * 0.0871
      ctx.save()
      ctx.beginPath()
      ctx.rect(padX, padY + penAreaH, fieldW, h)
      ctx.clip()
      ctx.beginPath()
      ctx.arc(w / 2, topPenSpotY, penArcRadius, 0, Math.PI)
      ctx.stroke()
      ctx.restore()

      // Bottom Penalty Area
      ctx.strokeRect(penAreaX, padY + fieldH - penAreaH, penAreaW, penAreaH)

      // Bottom Goal Area
      ctx.strokeRect(goalAreaX, padY + fieldH - goalAreaH, goalAreaW, goalAreaH)

      // Bottom Penalty Spot
      const bottomPenSpotY = padY + fieldH - fieldH * 0.1048
      ctx.beginPath()
      ctx.arc(w / 2, bottomPenSpotY, w * 0.005, 0, Math.PI * 2)
      ctx.fill()

      // Bottom Penalty Arc (the "D")
      ctx.save()
      ctx.beginPath()
      ctx.rect(padX, padY, fieldW, fieldH - penAreaH)
      ctx.clip()
      ctx.beginPath()
      ctx.arc(w / 2, bottomPenSpotY, penArcRadius, Math.PI, 0)
      ctx.stroke()
      ctx.restore()
    } else {
      // ═══════════════════════════════════════════════════════════
      // LANDSCAPE FIELD LINES DRAWING
      // ═══════════════════════════════════════════════════════════
      // Center line
      ctx.beginPath()
      ctx.moveTo(w / 2, padY)
      ctx.lineTo(w / 2, padY + fieldH)
      ctx.stroke()

      // Center circle
      const centerRadius = fieldH * 0.18
      ctx.beginPath()
      ctx.arc(w / 2, h / 2, centerRadius, 0, Math.PI * 2)
      ctx.stroke()

      // Center spot
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.beginPath()
      ctx.arc(w / 2, h / 2, w * 0.004, 0, Math.PI * 2)
      ctx.fill()

      // Left Penalty Area
      const penAreaW = fieldW * 0.1571
      const penAreaH = fieldH * 0.5929
      const penAreaY = padY + fieldH * 0.2035
      ctx.strokeRect(padX, penAreaY, penAreaW, penAreaH)

      // Left Goal Area
      const goalAreaW = fieldW * 0.0524
      const goalAreaH = fieldH * 0.2694
      const goalAreaY = padY + fieldH * 0.3653
      ctx.strokeRect(padX, goalAreaY, goalAreaW, goalAreaH)

      // Left Penalty Spot
      const leftPenSpotX = padX + fieldW * 0.1048
      ctx.beginPath()
      ctx.arc(leftPenSpotX, h / 2, w * 0.003, 0, Math.PI * 2)
      ctx.fill()

      // Left Penalty Arc (the "D")
      const penArcRadius = fieldW * 0.0871
      ctx.save()
      ctx.beginPath()
      ctx.rect(padX + penAreaW, padY, w, fieldH)
      ctx.clip()
      ctx.beginPath()
      ctx.arc(leftPenSpotX, h / 2, penArcRadius, -Math.PI / 2, Math.PI / 2)
      ctx.stroke()
      ctx.restore()

      // Right Penalty Area
      ctx.strokeRect(padX + fieldW - penAreaW, penAreaY, penAreaW, penAreaH)

      // Right Goal Area
      ctx.strokeRect(padX + fieldW - goalAreaW, goalAreaY, goalAreaW, goalAreaH)

      // Right Penalty Spot
      const rightPenSpotX = padX + fieldW - fieldW * 0.1048
      ctx.beginPath()
      ctx.arc(rightPenSpotX, h / 2, w * 0.003, 0, Math.PI * 2)
      ctx.fill()

      // Right Penalty Arc (the "D")
      ctx.save()
      ctx.beginPath()
      ctx.rect(0, padY, padX + fieldW - penAreaW, fieldH)
      ctx.clip()
      ctx.beginPath()
      ctx.arc(rightPenSpotX, h / 2, penArcRadius, Math.PI / 2, -Math.PI / 2)
      ctx.stroke()
      ctx.restore()
    }

    // Corner Arcs
    const cornerRadius = (isMobile ? fieldW : fieldH) * 0.025
    ctx.beginPath()
    ctx.arc(padX, padY, cornerRadius, 0, Math.PI / 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(padX, padY + fieldH, cornerRadius, -Math.PI / 2, 0)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(padX + fieldW, padY, cornerRadius, Math.PI / 2, Math.PI)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(padX + fieldW, padY + fieldH, cornerRadius, Math.PI, -Math.PI / 2)
    ctx.stroke()

    // 4. Draw lines (arrows)
    arrows.forEach((arr) => {
      const scale = arr.scale ?? 1
      ctx.strokeStyle = '#facc15'
      ctx.lineWidth = 4.5 * scale

      const x1 = isMobile ? arr.y1 : arr.x1
      const y1 = isMobile ? 100 - arr.x1 : arr.y1
      const x2 = isMobile ? arr.y2 : arr.x2
      const y2 = isMobile ? 100 - arr.x2 : arr.y2

      ctx.beginPath()
      ctx.moveTo((x1 / 100) * w, (y1 / 100) * h)
      ctx.lineTo((x2 / 100) * w, (y2 / 100) * h)
      ctx.stroke()

      ctx.fillStyle = '#facc15'
      ctx.beginPath()
      ctx.arc((x1 / 100) * w, (y1 / 100) * h, Math.max(5, 6 * scale), 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc((x2 / 100) * w, (y2 / 100) * h, Math.max(5, 6 * scale), 0, Math.PI * 2)
      ctx.fill()
    })

    // 5. Draw elements
    elements.forEach((el) => {
      const scale = el.scale ?? 1
      const elX = isMobile ? (el.y / 100) * w : (el.x / 100) * w
      const elY = isMobile ? ((100 - el.x) / 100) * h : (el.y / 100) * h

      if (el.type === 'ball') {
        ctx.save()
        ctx.translate(elX, elY)
        if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180)
        ctx.font = `${Math.round(28 * scale)}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('⚽', 0, 0)
        ctx.restore()
      } else if (el.type === 'cone') {
        const coneW = 36 * scale
        const coneH = 24 * scale
        ctx.save()
        ctx.translate(elX, elY)
        if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180)
        ctx.fillStyle = '#ea580c'
        ctx.beginPath()
        ctx.ellipse(0, coneH / 2 - 2 * scale, coneW / 2, 4 * scale, 0, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = '#f97316'
        ctx.beginPath()
        ctx.moveTo(-coneW * 0.4, coneH / 2 - 2 * scale)
        ctx.lineTo(-coneW * 0.2, -coneH / 2 + 6 * scale)
        ctx.lineTo(coneW * 0.2, -coneH / 2 + 6 * scale)
        ctx.lineTo(coneW * 0.4, coneH / 2 - 2 * scale)
        ctx.closePath()
        ctx.fill()

        ctx.fillStyle = '#fb923c'
        ctx.beginPath()
        ctx.ellipse(0, -coneH / 2 + 6 * scale, coneW * 0.2, 2.5 * scale, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      } else if (el.type === 'goal') {
        const goalW = 54 * scale
        const goalH = 34 * scale
        ctx.save()
        ctx.translate(elX, elY)
        if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'
        ctx.beginPath()
        ctx.ellipse(0, goalH * 0.35, goalW * 0.45, 4 * scale, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'
        ctx.fillRect(-goalW * 0.25, -goalH * 0.2, goalW * 0.5, goalH * 0.5)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
        ctx.lineWidth = 1 * scale
        ctx.strokeRect(-goalW * 0.25, -goalH * 0.2, goalW * 0.5, goalH * 0.5)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
        ctx.beginPath()
        ctx.moveTo(-goalW * 0.5, -goalH * 0.3)
        ctx.lineTo(-goalW * 0.25, -goalH * 0.2)
        ctx.lineTo(-goalW * 0.25, goalH * 0.3)
        ctx.lineTo(-goalW * 0.5, goalH * 0.3)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(goalW * 0.5, -goalH * 0.3)
        ctx.lineTo(goalW * 0.25, -goalH * 0.2)
        ctx.lineTo(goalW * 0.25, goalH * 0.3)
        ctx.lineTo(goalW * 0.5, goalH * 0.3)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(-goalW * 0.5, -goalH * 0.3)
        ctx.lineTo(goalW * 0.5, -goalH * 0.3)
        ctx.lineTo(goalW * 0.25, -goalH * 0.2)
        ctx.lineTo(-goalW * 0.25, -goalH * 0.2)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 3 * scale
        ctx.lineCap = 'square'
        ctx.beginPath()
        ctx.moveTo(-goalW * 0.5, goalH * 0.3)
        ctx.lineTo(-goalW * 0.5, -goalH * 0.3)
        ctx.lineTo(goalW * 0.5, -goalH * 0.3)
        ctx.lineTo(goalW * 0.5, goalH * 0.3)
        ctx.stroke()
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
        ctx.lineWidth = 0.8 * scale
        for (let i = -1; i <= 1; i += 2) {
          ctx.beginPath()
          ctx.moveTo(goalW * 0.12 * i, -goalH * 0.2)
          ctx.lineTo(goalW * 0.12 * i, goalH * 0.3)
          ctx.stroke()
        }
        ctx.beginPath()
        ctx.moveTo(-goalW * 0.25, -goalH * 0.04)
        ctx.lineTo(goalW * 0.25, -goalH * 0.04)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(-goalW * 0.25, goalH * 0.12)
        ctx.lineTo(goalW * 0.25, goalH * 0.12)
        ctx.stroke()
        ctx.restore()
      } else if (el.type === 'dummy') {
        const dummyW = 34 * scale
        const dummyH = 40 * scale
        ctx.save()
        ctx.translate(elX, elY)
        if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
        ctx.beginPath()
        ctx.ellipse(0, dummyH / 2, dummyW * 0.4, 3 * scale, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#475569'
        ctx.lineWidth = 2.5 * scale
        ctx.beginPath()
        ctx.moveTo(0, dummyH / 2)
        ctx.lineTo(0, dummyH * 0.1)
        ctx.stroke()
        ctx.fillStyle = '#a3e635'
        ctx.strokeStyle = '#84cc16'
        ctx.lineWidth = 1.5 * scale
        ctx.beginPath()
        ctx.roundRect(-dummyW * 0.22, -dummyH * 0.15, dummyW * 0.44, dummyH * 0.5, 3 * scale)
        ctx.fill()
        ctx.stroke()
        ctx.strokeStyle = '#4d7c0f'
        ctx.lineWidth = 1.5 * scale
        for (let i = -1; i <= 1; i++) {
          const yOff = dummyH * 0.1 * i + dummyH * 0.08
          ctx.beginPath()
          ctx.moveTo(-dummyW * 0.18, yOff)
          ctx.lineTo(dummyW * 0.18, yOff)
          ctx.stroke()
        }
        ctx.beginPath()
        ctx.arc(0, -dummyH * 0.3, dummyW * 0.18, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
        ctx.restore()
      } else if (el.type === 'text') {
        ctx.save()
        ctx.translate(elX, elY)
        if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180)
        ctx.font = `bold ${Math.round(14 * scale)}px system-ui, sans-serif`
        const textVal = el.text ?? 'Texto'
        const textMetrics = ctx.measureText(textVal)
        const textW = textMetrics.width
        const textH = 18 * scale

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
        ctx.lineWidth = 1
        const boxW = textW + 16 * scale
        const boxH = textH + 10 * scale

        ctx.beginPath()
        ctx.roundRect(-boxW / 2, -boxH / 2, boxW, boxH, 6 * scale)
        ctx.fill()
        ctx.stroke()

        ctx.fillStyle = '#ffffff'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(textVal, 0, 0)
        ctx.restore()
      }
    })

    // 6. Draw players
    const drawPlayersOnCanvas = (playersList: typeof local, jerseyColor: string) => {
      playersList.forEach((j) => {
        const pX = isMobile ? (j.y / 100) * w : (j.x / 100) * w
        const pY = isMobile ? ((100 - j.x) / 100) * h : (j.y / 100) * h

        // Draw t-shirt SVG silhouette path
        ctx.save()
        ctx.translate(pX, pY - 14)
        const jerseyScale = isMobile ? 1.25 : 1.0
        ctx.scale(jerseyScale, jerseyScale)
        ctx.translate(-32, -34)

        ctx.fillStyle = jerseyColor
        ctx.strokeStyle = 'rgba(255,255,255,0.45)'
        ctx.lineWidth = 1.5

        ctx.beginPath()
        ctx.moveTo(22, 4)
        ctx.bezierCurveTo(24, 2, 40, 2, 42, 4)
        ctx.lineTo(48, 3)
        ctx.lineTo(56, 14)
        ctx.lineTo(56, 24)
        ctx.lineTo(48, 21)
        ctx.lineTo(48, 62)
        ctx.bezierCurveTo(48, 64, 46, 66, 44, 66)
        ctx.lineTo(20, 66)
        ctx.bezierCurveTo(18, 66, 16, 64, 16, 62)
        ctx.lineTo(16, 21)
        ctx.lineTo(8, 24)
        ctx.lineTo(8, 14)
        ctx.lineTo(16, 3)
        ctx.lineTo(16, 3)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()

        // Collar
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(24, 4)
        ctx.bezierCurveTo(28, 7, 36, 7, 40, 4)
        ctx.stroke()

        // Shading
        ctx.fillStyle = 'rgba(0,0,0,0.08)'
        ctx.beginPath()
        ctx.moveTo(16, 21)
        ctx.lineTo(16, 62)
        ctx.bezierCurveTo(16, 64, 18, 66, 20, 66)
        ctx.lineTo(24, 66)
        ctx.lineTo(24, 21)
        ctx.closePath()
        ctx.fill()

        // Sleeve lines
        ctx.strokeStyle = 'rgba(255,255,255,0.18)'
        ctx.lineWidth = 0.8
        ctx.beginPath()
        ctx.moveTo(16, 21)
        ctx.lineTo(22, 5)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(48, 21)
        ctx.lineTo(42, 5)
        ctx.stroke()

        // Number on shirt
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 28px system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(j.numero.toString(), 32, 44)
        ctx.restore()

        // Draw name label pill underneath
        ctx.font = 'bold 16px system-ui, sans-serif'
        const nameText = j.nombre
        const nameW = ctx.measureText(nameText).width + 14
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)'
        ctx.beginPath()
        const nameY = pY + 26
        ctx.roundRect(pX - nameW / 2, nameY, nameW, 22, 6)
        ctx.fill()

        ctx.fillStyle = '#ffffff'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillText(nameText, pX, nameY + 3)
      })
    }

    drawPlayersOnCanvas(local, colorLocal)
    drawPlayersOnCanvas(visitante, colorVisitante)

    return canvas
  }

  /* ── Export as Image (PNG) ─────────────────────────────────────────── */
  const exportWhiteboardAsImage = () => {
    const canvas = renderTacticToCanvas()
    if (!canvas) return

    const safeName = tacticName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') || 'pizarra-tactica'
    const fileName = `${safeName}-${Date.now()}.png`

    // Try sharing via Web Share API if on mobile and supported
    if (isMobile && navigator.share && navigator.canShare) {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          fallbackImageDownload(canvas, fileName)
          return
        }
        const file = new File([blob], fileName, { type: 'image/png' })
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: tacticName || 'Táctica',
              text: 'Compartir mi táctica creada en PizarrApp'
            })
            showToast('✓ Táctica compartida')
            return
          } catch (err) {
            console.error('Error sharing image', err)
          }
        }
        fallbackImageDownload(canvas, fileName)
      }, 'image/png')
    } else {
      fallbackImageDownload(canvas, fileName)
    }
  }

  const fallbackImageDownload = (canvas: HTMLCanvasElement, fileName: string) => {
    const dataUrl = canvas.toDataURL('image/png')
    
    // On iOS Safari / WebViews, opening in new tab is much more reliable
    if (isMobile) {
      const newTab = window.open()
      if (newTab) {
        newTab.document.write(`
          <html>
            <head>
              <title>PizarrApp - Exportar</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body {
                  margin: 0;
                  background: #111827;
                  color: #f3f4f6;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  font-family: system-ui, sans-serif;
                  padding: 16px;
                  min-height: 100vh;
                  box-sizing: border-box;
                }
                img {
                  max-width: 100%;
                  max-height: 75vh;
                  border-radius: 12px;
                  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);
                  margin-bottom: 20px;
                }
                p {
                  font-size: 14px;
                  text-align: center;
                  color: #9ca3af;
                }
              </style>
            </head>
            <body>
              <img src="${dataUrl}" alt="Táctica" />
              <p>Mantén presionada la imagen para guardarla o compartirla en tu móvil.</p>
            </body>
          </html>
        `)
        newTab.document.close()
        showToast('✓ Táctica abierta para guardar')
        return
      }
    }

    const link = document.createElement('a')
    link.download = fileName
    link.href = dataUrl
    link.click()
    showToast('✓ Imagen PNG descargada')
  }

  /* ── Export as PDF ─────────────────────────────────────────────────── */
  const exportWhiteboardAsPdf = async () => {
    const canvas = renderTacticToCanvas()
    if (!canvas) return

    const { jsPDF } = await import('jspdf')
    const imgData = canvas.toDataURL('image/png')

    if (isMobile) {
      // A4 portrait: 210 mm × 297 mm
      const pageW = 210
      const pageH = 297
      let finalW = pageW
      let finalH = (pageW * 16) / 9 // canvas is 9:16
      if (finalH > pageH) {
        finalH = pageH
        finalW = (pageH * 9) / 16
      }
      const offsetX = (pageW - finalW) / 2
      const offsetY = (pageH - finalH) / 2

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      pdf.addImage(imgData, 'PNG', offsetX, offsetY, finalW, finalH)
      const safeName = tacticName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') || 'pizarra-tactica'
      pdf.save(`${safeName}-${Date.now()}.pdf`)
    } else {
      // A4 landscape: 297 mm × 210 mm
      const pageW = 297
      const pageH = 210
      const imgH = (pageW * 9) / 16
      const offsetY = (pageH - imgH) / 2

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      pdf.addImage(imgData, 'PNG', 0, offsetY, pageW, imgH)
      const safeName = tacticName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') || 'pizarra-tactica'
      pdf.save(`${safeName}-${Date.now()}.pdf`)
    }
    showToast('✓ PDF descargado')
  }

  const newScoreboard = mostrarMarcador && (
    <div className="digital-scoreboard-fixed select-none">
      <div className="stadium-scoreboard">
        {/* Left Team (Local) Banner */}
        <div 
          className="scoreboard-team-local" 
          style={{ background: `linear-gradient(135deg, ${colorLocal} 0%, rgba(12, 12, 16, 0.4) 100%)` }}
        >
          <span className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0 shadow-sm" style={{ backgroundColor: colorLocal }} />
          <input
            type="text"
            value={nombreLocal}
            onChange={(e) => setNombreLocal(e.target.value)}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="text-xs font-black uppercase tracking-wider text-white bg-black/20 border border-white/10 outline-none focus:bg-black/40 focus:ring-1 focus:ring-white/20 px-1.5 py-0.5 rounded flex-1 min-w-0 text-right font-sans truncate"
            title="Local"
          />
        </div>

        {/* Local Score */}
        <div className="scoreboard-score-local-container">
          <div 
            onClick={(e) => {
              e.stopPropagation()
              setGolesLocal((prev) => (prev + 1) % 100)
            }}
            onContextMenu={(e) => {
              e.preventDefault()
              setGolesLocal((prev) => (prev - 1 + 100) % 100)
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="digital-score-box"
            title="Sumar (Click) / Restar (Click derecho)"
          >
            <span className="digital-score-value">
              {golesLocal.toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* VS Divider / Badge */}
        <div className="scoreboard-vs-badge">VS</div>

        {/* Colon separator */}
        <div className="scoreboard-colon-container">
          <span className="animate-pulse">:</span>
        </div>

        {/* Visitante Score */}
        <div className="scoreboard-score-visitante-container">
          <div 
            onClick={(e) => {
              e.stopPropagation()
              setGolesVisitante((prev) => (prev + 1) % 100)
            }}
            onContextMenu={(e) => {
              e.preventDefault()
              setGolesVisitante((prev) => (prev - 1 + 100) % 100)
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="digital-score-box"
            title="Sumar (Click) / Restar (Click derecho)"
          >
            <span className="digital-score-value">
              {golesVisitante.toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Right Team (Visitante) Banner */}
        <div 
          className="scoreboard-team-visitante" 
          style={{ background: `linear-gradient(135deg, ${colorVisitante} 0%, rgba(12, 12, 16, 0.4) 100%)` }}
        >
          <input
            type="text"
            value={nombreVisitante}
            onChange={(e) => setNombreVisitante(e.target.value)}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="text-xs font-black uppercase tracking-wider text-white bg-black/20 border border-white/10 outline-none focus:bg-black/40 focus:ring-1 focus:ring-white/20 px-1.5 py-0.5 rounded flex-1 min-w-0 text-left font-sans truncate"
            title="Visitante"
          />
          <span className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0 shadow-sm" style={{ backgroundColor: colorVisitante }} />
        </div>
      </div>
    </div>
  )


  const fieldContent = (
    <Cancha ref={canchaRef} isVertical={isMobile}>
      {arrows.map((arr) => {
        const mappedArrow = isMobile
          ? {
              ...arr,
              x1: arr.y1,
              y1: 100 - arr.x1,
              x2: arr.y2,
              y2: 100 - arr.x2,
            }
          : arr
        return (
          <InteractiveArrow
            key={`arrow-${arr.id}-${resetKey}`}
            arrow={mappedArrow}
            constraintsRef={canchaRef}
            onUpdate={(id, updates) => {
              if (isMobile) {
                const mappedUpdates: Partial<ArrowItem> = {}
                if (updates.x1 !== undefined) mappedUpdates.y1 = updates.x1
                if (updates.y1 !== undefined) mappedUpdates.x1 = 100 - updates.y1
                if (updates.x2 !== undefined) mappedUpdates.y2 = updates.x2
                if (updates.y2 !== undefined) mappedUpdates.x2 = 100 - updates.y2
                handleArrowUpdate(id, mappedUpdates)
              } else {
                handleArrowUpdate(id, updates)
              }
            }}
            onDelete={handleArrowDelete}
            onScaleChange={handleArrowScaleChange}
          />
        )
      })}
      {elements.map((el) => {
        const mappedEl = isMobile ? { ...el, x: el.y, y: 100 - el.x } : el
        return (
          <DraggableElement
            key={`element-${el.id}-${resetKey}`}
            element={mappedEl}
            constraintsRef={canchaRef}
            onDragEnd={(id, nx, ny) => {
              if (isMobile) {
                handleElementDragEnd(id, 100 - ny, nx)
              } else {
                handleElementDragEnd(id, nx, ny)
              }
            }}
            onDelete={handleElementDelete}
            onTextChange={handleElementTextChange}
            onScaleChange={handleElementScaleChange}
            onRotationChange={handleElementRotationChange}
          />
        )
      })}
      {local.map((j) => {
        const px = isMobile ? j.y : j.x
        const py = isMobile ? 100 - j.x : j.y
        return (
          <FichaJugador
            key={`local-${j.numero}-${resetKey}`}
            numero={j.numero}
            nombre={j.nombre}
            color={colorLocal}
            x={px}
            y={py}
            constraintsRef={canchaRef}
            onDragEnd={(nx, ny) => {
              if (isMobile) {
                handleLocalDragEnd(j.numero)(100 - ny, nx)
              } else {
                handleLocalDragEnd(j.numero)(nx, ny)
              }
            }}
            onDelete={handleDeleteLocalPlayer}
            onNameChange={(newName) => handleLocalNameChange(j.numero, newName)}
            onNumberChange={(newNum) => handleLocalNumberChange(j.numero, newNum)}
            isMobile={isMobile}
          />
        )
      })}
      {visitante.map((j) => {
        const px = isMobile ? j.y : j.x
        const py = isMobile ? 100 - j.x : j.y
        return (
          <FichaJugador
            key={`visit-${j.numero}-${resetKey}`}
            numero={j.numero}
            nombre={j.nombre}
            color={colorVisitante}
            x={px}
            y={py}
            constraintsRef={canchaRef}
            onDragEnd={(nx, ny) => {
              if (isMobile) {
                handleVisitanteDragEnd(j.numero)(100 - ny, nx)
              } else {
                handleVisitanteDragEnd(j.numero)(nx, ny)
              }
            }}
            onDelete={handleDeleteVisitantePlayer}
            onNameChange={(newName) => handleVisitanteNameChange(j.numero, newName)}
            onNumberChange={(newNum) => handleVisitanteNumberChange(j.numero, newNum)}
            isMobile={isMobile}
          />
        )
      })}
    </Cancha>
  )

  /* ── Shared team-config popover content ─────────────────────────── */
  const teamConfigContent = (
    <div className="space-y-4">
      {/* SCOREBOARD TOGGLE */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <span className="text-xs font-semibold text-text-primary">Mostrar marcador táctico</span>
        <label className="relative inline-flex items-center cursor-pointer select-none">
          <input
            type="checkbox"
            checked={mostrarMarcador}
            onChange={(e) => setMostrarMarcador(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-8 h-4.5 bg-surface-600 rounded-full peer peer-focus:ring-1 peer-focus:ring-accent-500/30 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-accent-500"></div>
        </label>
      </div>

      {/* LOCAL TEAM PANEL */}
      <div className="space-y-2 pb-3 border-b border-white/5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-white/10" style={{ backgroundColor: colorLocal }} />
            Local
          </span>
          <span className="text-[10px] text-text-muted font-medium">{local.length} jugadores</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex rounded-lg bg-surface-800 p-0.5 border border-border/50">
            {([7, 9, 11] as const).map((sz) => (
              <button
                key={`local-sz-${sz}`}
                onClick={() => {
                  const targetPreset = sz === 7 ? formacion7Local : sz === 9 ? formacion9Local : formacionLocal
                  setLocal(changeFormation(local, targetPreset))
                  setResetKey((k) => k + 1)
                  showToast(`Local: Fútbol ${sz}`)
                }}
                className="px-2 py-0.5 text-[10px] font-semibold rounded-md transition-all duration-150 cursor-pointer"
                style={{
                  backgroundColor: local.length === sz ? 'var(--color-surface-600)' : 'transparent',
                  color: local.length === sz ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'
                }}
              >
                F{sz}
              </button>
            ))}
          </div>
          <button
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setActiveColorPicker({ team: 'local', rect });
            }}
            className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-surface-800 hover:bg-surface-600 border border-border transition-colors cursor-pointer"
            title="Color de camiseta local"
          >
            <svg viewBox="0 0 64 68" fill="none" className="w-4 h-4" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.25))' }}>
              <path d="M22 4 C24 2, 40 2, 42 4 L48 3 L56 14 L56 24 L48 21 L48 62 C48 64, 46 66, 44 66 L20 66 C18 66, 16 64, 16 62 L16 21 L8 24 L8 14 L16 3 Z" fill={colorLocal} stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
            </svg>
          </button>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => {
                const num = getNextUnusedNumber(local)
                setLocal((prev) => [...prev, { numero: num, nombre: `Jugador ${num}`, x: 25, y: 50 }])
                showToast(`+ Jugador local ${num}`)
              }}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600/20 transition-colors cursor-pointer"
              title="Añadir jugador local"
            >
              <Plus size={13} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => {
                if (local.length > 0) {
                  const lastPlayer = local[local.length - 1]
                  setLocal((prev) => prev.filter((p) => p.numero !== lastPlayer.numero))
                  showToast(`- Jugador local ${lastPlayer.numero}`)
                }
              }}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-600/10 text-red-400 border border-red-500/20 hover:bg-red-600/20 transition-colors cursor-pointer disabled:opacity-40"
              title="Eliminar último jugador local" disabled={local.length === 0}
            >
              <Minus size={13} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
      {/* VISITANTE TEAM PANEL */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-white/10" style={{ backgroundColor: colorVisitante }} />
            Visitante
          </span>
          <span className="text-[10px] text-text-muted font-medium">{visitante.length} jugadores</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex rounded-lg bg-surface-800 p-0.5 border border-border/50">
            {([7, 9, 11] as const).map((sz) => (
              <button
                key={`visitante-sz-${sz}`}
                onClick={() => {
                  const targetPreset = sz === 7 ? formacion7Visitante : sz === 9 ? formacion9Visitante : formacionVisitante
                  setVisitante(changeFormation(visitante, targetPreset))
                  setResetKey((k) => k + 1)
                  showToast(`Visitante: Fútbol ${sz}`)
                }}
                className="px-2 py-0.5 text-[10px] font-semibold rounded-md transition-all duration-150 cursor-pointer"
                style={{
                  backgroundColor: visitante.length === sz ? 'var(--color-surface-600)' : 'transparent',
                  color: visitante.length === sz ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'
                }}
              >
                F{sz}
              </button>
            ))}
          </div>
          <button
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setActiveColorPicker({ team: 'visitante', rect });
            }}
            className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-surface-800 hover:bg-surface-600 border border-border transition-colors cursor-pointer"
            title="Color de camiseta visitante"
          >
            <svg viewBox="0 0 64 68" fill="none" className="w-4 h-4" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.25))' }}>
              <path d="M22 4 C24 2, 40 2, 42 4 L48 3 L56 14 L56 24 L48 21 L48 62 C48 64, 46 66, 44 66 L20 66 C18 66, 16 64, 16 62 L16 21 L8 24 L8 14 L16 3 Z" fill={colorVisitante} stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
            </svg>
          </button>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => {
                const num = getNextUnusedNumber(visitante)
                setVisitante((prev) => [...prev, { numero: num, nombre: `Jugador ${num}`, x: 75, y: 50 }])
                showToast(`+ Jugador visitante ${num}`)
              }}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600/20 transition-colors cursor-pointer"
              title="Añadir jugador visitante"
            >
              <Plus size={13} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => {
                if (visitante.length > 0) {
                  const lastPlayer = visitante[visitante.length - 1]
                  setVisitante((prev) => prev.filter((p) => p.numero !== lastPlayer.numero))
                  showToast(`- Jugador visitante ${lastPlayer.numero}`)
                }
              }}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-600/10 text-red-400 border border-red-500/20 hover:bg-red-600/20 transition-colors cursor-pointer disabled:opacity-40"
              title="Eliminar último jugador visitante" disabled={visitante.length === 0}
            >
              <Minus size={13} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  // exportContent and shareContent are now rendered directly inside FloatingMenu

  if (isMobile) {
    return (
      <div className="flex flex-col h-dvh overflow-hidden bg-surface-900">
        {newScoreboard}
        <main className="flex-1 flex items-center justify-center p-2 overflow-hidden">
          <div
            ref={fieldContainerRef}
            className={`relative rounded-xl overflow-hidden border border-border shadow-2xl shadow-black/40 ${
              isFullscreen ? 'w-full h-full' : 'pitch-container-mobile'
            }`}
          >
            {fieldContent}
            <button
              onClick={toggleFullscreen}
              className={`absolute z-30 flex items-center justify-center rounded-lg
                         bg-black/50 hover:bg-black/70 text-white/80 hover:text-white
                         border border-white/10 hover:border-white/25
                         backdrop-blur-sm transition-all duration-200 cursor-pointer active:scale-90 ${
                           isFullscreen ? 'top-3 right-3 w-10 h-10' : 'top-2 right-2 w-8 h-8'
                         }`}
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={14} />}
            </button>
          </div>
        </main>
        <footer className="text-center py-3 text-[10px] text-text-muted shrink-0 border-t border-white/5 bg-surface-800/40 safe-area-pb select-none" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
          Junior y TeacherdhApps por nuestro amor al futbol. PizarrApp ® 2026.
        </footer>
        <FloatingMenu
          onAddTool={handleAddTool}
          onClearExtras={clearExtras}
          onGuardar={guardarTactica}
          onReiniciar={reiniciar}
          onExportPng={exportWhiteboardAsImage}
          onExportPdf={exportWhiteboardAsPdf}
          generateShareLink={generateShareLink}
          copyShareLink={copyShareLink}
          shareUrl={shareUrl}
          isCopied={isCopied}
          isTeamConfigOpen={isTeamConfigOpen}
          setIsTeamConfigOpen={setIsTeamConfigOpen}
          teamConfigContent={teamConfigContent}
          mostrarMarcador={mostrarMarcador}
          setMostrarMarcador={setMostrarMarcador}
          slotNames={slotNames}
          onSaveSlot={guardarEnSlot}
          onLoadSlot={cargarDesdeSlot}
          onDeleteSlot={borrarSlot}
        />
        <div
          className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50
                      px-4 py-2 rounded-xl text-sm font-medium
                      bg-surface-700/95 text-text-primary border border-border
                      shadow-xl backdrop-blur-sm transition-all duration-300
                      ${toast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        >
          {toast}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-dvh">
      {newScoreboard}
      <header className="sticky top-0 z-[100] flex items-center justify-between gap-4 px-6 py-2.5 mr-[260px] bg-surface-800/60 backdrop-blur-md border-b border-white/5 shadow-[0_2px_15px_rgba(0,0,0,0.2)] select-none animate-in fade-in duration-300">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center shadow-lg shadow-accent-500/25 shrink-0">
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
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={tacticName}
                onChange={(e) => {
                  const newName = e.target.value;
                  setTacticName(newName);
                  localStorage.setItem('pizarra_tactica_name', newName);
                }}
                className="text-sm font-semibold text-text-primary bg-transparent border-none outline-none focus:bg-surface-700/60 focus:ring-1 focus:ring-accent-500/30 px-1.5 py-0.5 rounded-md max-w-[300px] transition-all"
                title="Editar nombre de táctica"
              />
              <Pencil size={12} className="text-text-muted hover:text-text-secondary cursor-pointer shrink-0" />
            </div>
            <span className="text-[9px] text-emerald-400/80 font-medium px-1.5 flex items-center gap-1 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Autoguardado
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-muted select-none">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            16 : 9 · Campo de fútbol
          </span>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 mr-[260px]">
        <div className="relative w-full max-w-6xl">
          <div
            ref={fieldContainerRef}
            className={`relative w-full rounded-2xl overflow-hidden border border-border shadow-2xl shadow-black/40 ${
              isFullscreen ? 'flex items-center justify-center bg-surface-900' : 'aspect-video'
            }`}
          >
            <div className={isFullscreen ? 'w-full h-full' : 'contents'}>
              {fieldContent}
            </div>
            <button
              onClick={toggleFullscreen}
              className={`absolute z-30 flex items-center justify-center rounded-lg
                         bg-black/50 hover:bg-black/70 text-white/80 hover:text-white
                         border border-white/10 hover:border-white/25
                         backdrop-blur-sm transition-all duration-200 cursor-pointer active:scale-90 ${
                           isFullscreen
                             ? 'bottom-4 right-4 w-12 h-12'
                             : 'bottom-2 right-2 w-8 h-8'
                         }`}
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            >
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={14} />}
            </button>
          </div>
        </div>
      </main>

      {/* ── Toast notification ─────────────────────────────────────────── */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-[calc(50%+130px)] z-[100]
                    px-4 py-2 rounded-xl text-sm font-medium
                    bg-surface-700/95 text-text-primary border border-border
                    shadow-xl backdrop-blur-sm transition-all duration-300
                    ${toast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
      >
        {toast}
      </div>

      {/* ── Desktop Sidebar ──────────────────────────────────────────── */}
      <DesktopSidebar
        onAddTool={handleAddTool}
        onClearExtras={clearExtras}
        onGuardar={guardarTactica}
        onReiniciar={reiniciar}
        onExportPng={exportWhiteboardAsImage}
        onExportPdf={exportWhiteboardAsPdf}
        generateShareLink={generateShareLink}
        copyShareLink={copyShareLink}
        shareUrl={shareUrl}
        isCopied={isCopied}
        isTeamConfigOpen={isTeamConfigOpen}
        setIsTeamConfigOpen={setIsTeamConfigOpen}
        teamConfigContent={teamConfigContent}
        mostrarMarcador={mostrarMarcador}
        setMostrarMarcador={setMostrarMarcador}
        slotNames={slotNames}
        onSaveSlot={guardarEnSlot}
        onLoadSlot={cargarDesdeSlot}
        onDeleteSlot={borrarSlot}
      />

      {activeColorPicker && (
        <ColorPickerPortal
          color={activeColorPicker.team === 'local' ? colorLocal : colorVisitante}
          onChange={(c) => {
            if (activeColorPicker.team === 'local') {
              setColorLocal(c);
            } else {
              setColorVisitante(c);
            }
          }}
          rect={activeColorPicker.rect}
          onClose={() => setActiveColorPicker(null)}
        />
      )}
    </div>
  )
}

function ColorPickerPortal({
  color,
  onChange,
  rect,
  onClose,
}: {
  color: string;
  onChange: (color: string) => void;
  rect: DOMRect;
  onClose: () => void;
}) {
  const colors = [
    '#2563eb', // Royal Blue
    '#dc2626', // Red
    '#16a34a', // Green
    '#eab308', // Yellow
    '#ea580c', // Orange
    '#9333ea', // Purple
    '#06b6d4', // Cyan
    '#f43f5e', // Rose
    '#ffffff', // White
    '#64748b', // Slate
    '#1e293b', // Dark Slate
    '#0f172a', // Black
  ];

  // Position the popover to the left of the trigger button
  const popoverWidth = 200;
  
  // Calculate top & left based on the button position
  const left = rect.left - popoverWidth - 10;
  const top = rect.top + rect.height / 2 - 90; // center vertically

  return createPortal(
    <>
      {/* Backdrop catcher */}
      <div 
        className="fixed inset-0 z-[300]" 
        onClick={onClose} 
        onPointerDown={(e) => e.stopPropagation()}
      />
      
      {/* Popover Card */}
      <div
        className="fixed z-[301] p-3 rounded-2xl bg-surface-700 border border-white/10 shadow-2xl flex flex-col gap-2.5 animate-in fade-in zoom-in-95 duration-150 select-none"
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          width: `${popoverWidth}px`,
          left: `${Math.max(10, left)}px`,
          top: `${Math.max(10, top)}px`,
        }}
      >
        <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary px-1 border-b border-white/5 pb-1.5">
          Color de camiseta
        </div>
        
        {/* Color grid */}
        <div className="grid grid-cols-4 gap-1.5">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => {
                onChange(c);
                onClose();
              }}
              className="w-8 h-8 rounded-lg border transition-all cursor-pointer hover:scale-110 active:scale-95"
              style={{
                backgroundColor: c,
                borderColor: color.toLowerCase() === c.toLowerCase() ? '#ffffff' : 'rgba(255,255,255,0.1)',
                boxShadow: color.toLowerCase() === c.toLowerCase() ? '0 0 8px rgba(255,255,255,0.4)' : 'none',
              }}
            />
          ))}
        </div>

        {/* Custom color picker option */}
        <div className="h-px bg-white/5 my-0.5" />
        
        <label className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-surface-800/80 hover:bg-surface-600/80 border border-white/5 transition-colors cursor-pointer text-[11px] font-semibold text-text-primary">
          <span>Personalizado...</span>
          <div className="w-5 h-5 rounded-md border border-white/10 relative overflow-hidden" style={{ backgroundColor: color }}>
            <input
              type="color"
              value={color}
              onChange={(e) => onChange(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
            />
          </div>
        </label>
      </div>
    </>,
    document.body
  );
}

export default App

