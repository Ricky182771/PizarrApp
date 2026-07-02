import { useCallback, useEffect, useRef, useState } from 'react'
import Cancha from './components/Cancha'
import FichaJugador from './components/FichaJugador'
import Toolbar from './components/Toolbar'
import DraggableElement from './components/DraggableElement'
import InteractiveArrow from './components/InteractiveArrow'
import { uid, isValidTacticaGuardada } from './types'
import type { Jugador, FieldElement, ArrowItem, TacticaGuardada, ElementType } from './types'
import { Users, ChevronDown, Plus, Minus, Save, RotateCcw, Download, Image, FileJson, FileText, Upload as UploadIcon, Pencil, Link2, Copy, Check, Maximize, Minimize } from 'lucide-react'

const LS_KEY = 'pizarra-tactica'

/* ── Default formations ───────────────────────────────────────────────── */
const formacionLocal: Jugador[] = [
  { numero: 1,  nombre: 'GK',       x: 6,   y: 50 },
  { numero: 4,  nombre: 'Ramos',    x: 18,  y: 20 },
  { numero: 3,  nombre: 'Piqué',    x: 18,  y: 42 },
  { numero: 15, nombre: 'Valverde', x: 18,  y: 62 },
  { numero: 2,  nombre: 'Carvajal', x: 18,  y: 82 },
  { numero: 8,  nombre: 'Kroos',    x: 35,  y: 35 },
  { numero: 10, nombre: 'Modric',   x: 35,  y: 65 },
  { numero: 22, nombre: 'Isco',     x: 42,  y: 50 },
  { numero: 7,  nombre: 'Mbappé',   x: 44,  y: 18 },
  { numero: 9,  nombre: 'Benzema',  x: 48,  y: 50 },
  { numero: 11, nombre: 'Vini Jr',  x: 44,  y: 82 },
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
  { numero: 10, nombre: 'Grealish', x: 56,  y: 82 },
]

const formacion7Local: Jugador[] = [
  { numero: 1,  nombre: 'GK',       x: 6,   y: 50 },
  { numero: 3,  nombre: 'Piqué',    x: 18,  y: 30 },
  { numero: 4,  nombre: 'Ramos',    x: 18,  y: 70 },
  { numero: 8,  nombre: 'Kroos',    x: 35,  y: 50 },
  { numero: 10, nombre: 'Modric',   x: 42,  y: 25 },
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
  { numero: 10, nombre: 'Modric',   x: 35,  y: 70 },
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
    }
  })

  const [local, setLocal] = useState<Jugador[]>(initialData.local)
  const [visitante, setVisitante] = useState<Jugador[]>(initialData.visitante)
  const [colorLocal, setColorLocal] = useState(initialData.colorLocal)
  const [colorVisitante, setColorVisitante] = useState(initialData.colorVisitante)
  const [elements, setElements] = useState<FieldElement[]>(initialData.elements)
  const [arrows, setArrows] = useState<ArrowItem[]>(initialData.arrows)
  const [tacticName, setTacticName] = useState(() => {
    const saved = loadFromLS()
    return saved?.tacticName ?? 'Pizarra de Tácticas'
  })

  /*
   * resetKey — Incrementing this forces React to unmount and remount every
   * FichaJugador/element/arrow, resetting Framer Motion's internal drag offsets.
   */
  const [resetKey, setResetKey] = useState(0)

  // Export dropdown & Import file ref
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [isTeamConfigOpen, setIsTeamConfigOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Share link state
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [isCopied, setIsCopied] = useState(false)

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false)
  const fieldContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.title = `${tacticName.slice(0, 100)} - Pizarra Táctica`
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

  const showToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(null), 2000)
  }

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
        setResetKey((k) => k + 1)
        window.history.replaceState(null, '', window.location.pathname)
        showToast('✓ Táctica cargada desde enlace')
      } catch { /* ignore malformed data */ }
    }
    loadFromHash()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── Share link helpers ───────────────────────────────────────────── */
  const generateShareLink = async () => {
    const data: TacticaGuardada = {
      local, visitante, colorLocal, colorVisitante, elements, arrows, tacticName,
    }
    const json = JSON.stringify(data)
    const compressed = await compressToUrlSafe(json)
    const url = `${window.location.origin}${window.location.pathname}#t=${compressed}`
    setShareUrl(url)
    setIsCopied(false)
    setIsShareOpen(true)
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
      showToast(`+ ${type === 'ball' ? 'Balón' : type === 'cone' ? 'Cono' : 'Texto'} añadido`)
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
    }
    localStorage.setItem(LS_KEY, JSON.stringify(data))
    showToast('✓ Táctica guardada')
  }

  /* ── Reset to initial formation ───────────────────────────────────── */
  const reiniciar = () => {
    setLocal(deepClone(formacionLocal))
    setVisitante(deepClone(formacionVisitante))
    setColorLocal('#2563eb')
    setColorVisitante('#dc2626')
    setElements([])
    setArrows([])
    localStorage.removeItem(LS_KEY)
    setResetKey((k) => k + 1)    // force re-mount to clear drag offsets
    showToast('↺ Formación reiniciada')
  }

  /* ── Render tactic to canvas (shared by PNG & PDF exports) ────────── */
  const renderTacticToCanvas = (): HTMLCanvasElement | null => {
    const canvas = document.createElement('canvas')
    canvas.width = 1600
    canvas.height = 900
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

    // 2. Mowing stripes (12 vertical stripes)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)'
    const stripeWidth = w / 12
    for (let i = 0; i < 12; i += 2) {
      ctx.fillRect(i * stripeWidth, 0, stripeWidth, h)
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
    ctx.arc(rightPenSpotX, h / 2, penArcRadius, Math.PI / 2, -Math.PI / 2, true)
    ctx.stroke()
    ctx.restore()

    // Corner Arcs
    const cornerRadius = fieldH * 0.025
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
      ctx.beginPath()
      ctx.moveTo((arr.x1 / 100) * w, (arr.y1 / 100) * h)
      ctx.lineTo((arr.x2 / 100) * w, (arr.y2 / 100) * h)
      ctx.stroke()

      ctx.fillStyle = '#facc15'
      ctx.beginPath()
      ctx.arc((arr.x1 / 100) * w, (arr.y1 / 100) * h, Math.max(5, 6 * scale), 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc((arr.x2 / 100) * w, (arr.y2 / 100) * h, Math.max(5, 6 * scale), 0, Math.PI * 2)
      ctx.fill()
    })

    // 5. Draw elements
    elements.forEach((el) => {
      const scale = el.scale ?? 1
      const elX = (el.x / 100) * w
      const elY = (el.y / 100) * h

      if (el.type === 'ball') {
        ctx.font = `${Math.round(28 * scale)}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('⚽', elX, elY)
      } else if (el.type === 'cone') {
        const coneW = 36 * scale
        const coneH = 24 * scale
        ctx.save()
        ctx.translate(elX, elY)
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
      } else if (el.type === 'text') {
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
        ctx.roundRect(elX - boxW / 2, elY - boxH / 2, boxW, boxH, 6 * scale)
        ctx.fill()
        ctx.stroke()

        ctx.fillStyle = '#ffffff'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(textVal, elX, elY)
      }
    })

    // 6. Draw players
    const drawPlayersOnCanvas = (playersList: typeof local, jerseyColor: string) => {
      playersList.forEach((j) => {
        const pX = (j.x / 100) * w
        const pY = (j.y / 100) * h

        // Draw t-shirt SVG silhouette path
        ctx.save()
        ctx.translate(pX, pY - 14)
        const jerseyScale = 1.0
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

    /* Note: toDataURL returns a data: URI (not an Object URL), so no
       revokeObjectURL is needed — unlike the JSON export's Blob URL. */
    const dataUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    const safeName = tacticName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') || 'pizarra-tactica'
    link.download = `${safeName}-${Date.now()}.png`
    link.href = dataUrl
    link.click()
    showToast('✓ Imagen PNG descargada')
  }

  /* ── Export as PDF (A4 landscape, 16:9 centered) ───────────────────── */
  const exportWhiteboardAsPdf = async () => {
    const canvas = renderTacticToCanvas()
    if (!canvas) return

    const { jsPDF } = await import('jspdf')
    const imgData = canvas.toDataURL('image/png')

    // A4 landscape: 297 mm × 210 mm.  Fit 16:9 image to full width.
    const pageW = 297
    const pageH = 210
    const imgH = (pageW * 9) / 16 // ≈ 167.06 mm
    const offsetY = (pageH - imgH) / 2

    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    pdf.addImage(imgData, 'PNG', 0, offsetY, pageW, imgH)
    const safeName = tacticName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') || 'pizarra-tactica'
    pdf.save(`${safeName}-${Date.now()}.pdf`)
    showToast('✓ PDF descargado')
  }

  /* ── Export as JSON Táctica ───────────────────────────────────────── */
  const exportWhiteboardAsJson = () => {
    const data: TacticaGuardada = {
      local,
      visitante,
      colorLocal,
      colorVisitante,
      elements,
      arrows,
      tacticName,
    }
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const safeName = tacticName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') || 'pizarra-tactica'
    link.download = `${safeName}-${Date.now()}.json`
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
    showToast('✓ Táctica exportada (JSON)')
  }

  /* ── Import from JSON ─────────────────────────────────────────────── */
  const importarTactica = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data: unknown = JSON.parse(event.target?.result as string)
        if (isValidTacticaGuardada(data)) {
          setLocal(deepClone(data.local))
          setVisitante(deepClone(data.visitante))
          setColorLocal(data.colorLocal)
          setColorVisitante(data.colorVisitante)
          setElements(deepClone(data.elements))
          setArrows(deepClone(data.arrows))
          setResetKey((k) => k + 1)
          if (data.tacticName && typeof data.tacticName === 'string') {
            setTacticName(data.tacticName)
            localStorage.setItem('pizarra_tactica_name', data.tacticName)
          }
          showToast('✓ Táctica importada con éxito')
        } else {
          showToast('⚠ Formato JSON inválido')
        }
      } catch {
        showToast('⚠ Error al leer el archivo JSON')
      }
    }
    reader.readAsText(file)
  }

  /* ── Shared field content (used in both mobile and desktop) ─────── */
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
            isMobile={isMobile}
          />
        )
      })}
    </Cancha>
  )

  /* ── Shared team-config popover content ─────────────────────────── */
  const teamConfigContent = (
    <div className="space-y-4">
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
                  setLocal(deepClone(sz === 7 ? formacion7Local : sz === 9 ? formacion9Local : formacionLocal))
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
          <label className="flex items-center justify-center w-7 h-7 rounded-lg bg-surface-800 hover:bg-surface-600 border border-border transition-colors cursor-pointer" title="Color de camiseta local">
            <svg viewBox="0 0 64 68" fill="none" className="w-4 h-4" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.25))' }}>
              <path d="M22 4 C24 2, 40 2, 42 4 L48 3 L56 14 L56 24 L48 21 L48 62 C48 64, 46 66, 44 66 L20 66 C18 66, 16 64, 16 62 L16 21 L8 24 L8 14 L16 3 Z" fill={colorLocal} stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
            </svg>
            <input type="color" value={colorLocal} onChange={(e) => setColorLocal(e.target.value)} className="sr-only" />
          </label>
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
                  setVisitante(deepClone(sz === 7 ? formacion7Visitante : sz === 9 ? formacion9Visitante : formacionVisitante))
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
          <label className="flex items-center justify-center w-7 h-7 rounded-lg bg-surface-800 hover:bg-surface-600 border border-border transition-colors cursor-pointer" title="Color de camiseta visitante">
            <svg viewBox="0 0 64 68" fill="none" className="w-4 h-4" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.25))' }}>
              <path d="M22 4 C24 2, 40 2, 42 4 L48 3 L56 14 L56 24 L48 21 L48 62 C48 64, 46 66, 44 66 L20 66 C18 66, 16 64, 16 62 L16 21 L8 24 L8 14 L16 3 Z" fill={colorVisitante} stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
            </svg>
            <input type="color" value={colorVisitante} onChange={(e) => setColorVisitante(e.target.value)} className="sr-only" />
          </label>
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

  /* ── Shared export dropdown content ─────────────────────────────── */
  const exportContent = (
    <>
      <button onClick={() => { setIsExportOpen(false); exportWhiteboardAsImage() }} className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-text-primary hover:bg-surface-600 transition-colors flex items-center gap-2 cursor-pointer">
        <Image size={14} className="text-emerald-400" /> Exportar PNG
      </button>
      <button onClick={() => { setIsExportOpen(false); exportWhiteboardAsJson() }} className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-text-primary hover:bg-surface-600 transition-colors flex items-center gap-2 cursor-pointer">
        <FileJson size={14} className="text-blue-400" /> Exportar JSON
      </button>
      <button onClick={() => { setIsExportOpen(false); exportWhiteboardAsPdf() }} className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-text-primary hover:bg-surface-600 transition-colors flex items-center gap-2 cursor-pointer">
        <FileText size={14} className="text-rose-400" /> Exportar PDF
      </button>
      <div className="h-px bg-white/5 my-1" />
      <button onClick={() => { setIsExportOpen(false); fileInputRef.current?.click() }} className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-text-primary hover:bg-surface-600 transition-colors flex items-center gap-2 cursor-pointer">
        <UploadIcon size={14} className="text-violet-400" /> Importar JSON
      </button>
    </>
  )

  /* ── Shared share popover content ───────────────────────────────── */
  const shareContent = (
    <>
      <h3 className="text-xs font-bold text-text-primary flex items-center gap-1.5 mb-1">
        <Link2 size={13} className="text-emerald-400" /> Compartir Táctica
      </h3>
      <p className="text-[10px] text-text-muted mb-3 leading-relaxed">
        Copia este enlace para guardar o compartir tu táctica.
      </p>
      <div className="flex items-center gap-1.5">
        <input readOnly value={shareUrl} onClick={(e) => (e.target as HTMLInputElement).select()}
          className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-surface-900/80 text-[11px] text-text-secondary border border-border font-mono truncate outline-none focus:ring-1 focus:ring-emerald-500/30" />
        <button onClick={copyShareLink}
          className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-150 cursor-pointer active:scale-90 shrink-0 ${
            isCopied ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-surface-600 text-text-secondary hover:text-text-primary border-border hover:bg-surface-500'
          }`} title="Copiar enlace">
          {isCopied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
    </>
  )

  const hiddenFileInput = (
    <input type="file" ref={fileInputRef} onChange={importarTactica} accept=".json" className="hidden" />
  )

  if (isMobile) {
    return (
      <div className="flex flex-col h-dvh overflow-hidden bg-surface-900">
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
        <nav className="shrink-0 bg-surface-800/90 backdrop-blur-md border-t border-white/5 px-2 py-2 safe-area-pb select-none" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
          <div className="flex items-center justify-around gap-1">
            <Toolbar onAdd={handleAddTool} onClearExtras={clearExtras} isMobile={true} />
            <div className="relative">
              <button
                onClick={() => { setIsTeamConfigOpen(!isTeamConfigOpen); setIsExportOpen(false); setIsShareOpen(false) }}
                className={`flex items-center justify-center w-10 h-10 rounded-xl border transition-all cursor-pointer active:scale-90 ${
                  isTeamConfigOpen
                    ? 'bg-accent-500/20 text-accent-400 border-accent-500/30'
                    : 'bg-surface-700/60 text-text-secondary border-border'
                }`}
                title="Alineaciones"
              >
                <Users size={18} />
              </button>
              {isTeamConfigOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsTeamConfigOpen(false)} />
                  <div className="popover-mobile rounded-xl border border-border bg-surface-700 p-4 shadow-2xl z-20 animate-in fade-in slide-in-from-bottom-2 duration-150">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-3 flex items-center gap-1.5">
                      <Users size={12} /> Alineaciones y Equipos
                    </h3>
                    {teamConfigContent}
                  </div>
                </>
              )}
            </div>
            <button onClick={guardarTactica} className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent-500/10 text-accent-400 border border-accent-500/20 transition-all cursor-pointer active:scale-90" title="Guardar">
              <Save size={18} />
            </button>
            <button onClick={reiniciar} className="flex items-center justify-center w-10 h-10 rounded-xl bg-surface-700/60 text-text-secondary border border-border transition-all cursor-pointer active:scale-90" title="Reiniciar">
              <RotateCcw size={18} />
            </button>
            <div className="relative">
              <button
                onClick={() => { setIsExportOpen(!isExportOpen); setIsTeamConfigOpen(false); setIsShareOpen(false) }}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20 transition-all cursor-pointer active:scale-90"
                title="Exportar"
              >
                <Download size={18} />
              </button>
              {isExportOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsExportOpen(false)} />
                  <div className="popover-mobile rounded-xl border border-border bg-surface-700 p-1.5 shadow-2xl z-20 animate-in fade-in slide-in-from-bottom-2 duration-150">
                    {exportContent}
                  </div>
                </>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => { generateShareLink(); setIsTeamConfigOpen(false); setIsExportOpen(false) }}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 transition-all cursor-pointer active:scale-90"
                title="Compartir"
              >
                <Link2 size={18} />
              </button>
              {isShareOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsShareOpen(false)} />
                  <div className="popover-mobile rounded-xl border border-border bg-surface-700 p-4 shadow-2xl z-20 animate-in fade-in slide-in-from-bottom-2 duration-150">
                    {shareContent}
                  </div>
                </>
              )}
            </div>
          </div>
        </nav>
        {hiddenFileInput}
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
      <header className="sticky top-0 z-50 flex items-center justify-between gap-4 px-6 py-2.5 bg-surface-800/60 backdrop-blur-md border-b border-white/5 shadow-[0_2px_15px_rgba(0,0,0,0.2)] select-none animate-in fade-in duration-300">
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
                className="text-xs font-semibold text-text-primary bg-transparent border-none outline-none focus:bg-surface-700/60 focus:ring-1 focus:ring-accent-500/30 px-1 py-0.5 rounded-md max-w-[140px] sm:max-w-[200px] transition-all"
                title="Editar nombre de táctica"
              />
              <Pencil size={11} className="text-text-muted hover:text-text-secondary cursor-pointer shrink-0" />
            </div>
            <span className="text-[9px] text-emerald-400/80 font-medium px-1 flex items-center gap-1 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Autoguardado
            </span>
          </div>
        </div>
        <Toolbar onAdd={handleAddTool} onClearExtras={clearExtras} isMobile={false} />
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              id="btn-equipos"
              onClick={() => setIsTeamConfigOpen(!isTeamConfigOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95 ${
                isTeamConfigOpen
                  ? 'bg-accent-500/20 text-accent-400 border-accent-500/30 shadow-[0_0_10px_rgba(99,102,241,0.15)]'
                  : 'bg-surface-700/60 text-text-secondary hover:text-text-primary border-border hover:bg-surface-700'
              }`}
              title="Configurar alineación y uniformes"
            >
              <Users size={14} className="shrink-0" />
              <span className="hidden md:inline">Alineaciones</span>
              <ChevronDown size={13} className={`transition-transform duration-200 shrink-0 ${isTeamConfigOpen ? 'rotate-180' : ''}`} />
            </button>
            {isTeamConfigOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsTeamConfigOpen(false)} />
                <div className="absolute right-0 mt-2 w-[320px] rounded-xl border border-border bg-surface-700 p-4 shadow-2xl z-20 animate-in fade-in slide-in-from-top-1 duration-150 select-none">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-3 flex items-center gap-1.5">
                    <Users size={12} /> Alineaciones y Equipos
                  </h3>
                  {teamConfigContent}
                </div>
              </>
            )}
          </div>
          <button
            id="btn-guardar"
            onClick={guardarTactica}
            className="flex items-center justify-center w-9 h-9 rounded-lg
                       bg-accent-500/10 text-accent-400 hover:bg-accent-500/20 hover:text-accent-300
                       border border-accent-500/20 hover:border-accent-500/40 transition-all duration-150 cursor-pointer active:scale-90"
            title="Guardar Táctica"
          >
            <Save size={15} />
          </button>
          <button
            id="btn-reiniciar"
            onClick={reiniciar}
            className="flex items-center justify-center w-9 h-9 rounded-lg
                       bg-surface-700/60 text-text-secondary hover:text-text-primary hover:bg-surface-700
                       border border-border transition-all duration-150 cursor-pointer active:scale-90"
            title="Reiniciar Cancha"
          >
            <RotateCcw size={15} />
          </button>
          <div className="relative">
            <button
              id="btn-exportar"
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="flex items-center justify-center w-9 h-9 rounded-lg
                         bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 hover:text-blue-300
                         border border-blue-500/20 hover:border-blue-500/40 transition-all duration-150 cursor-pointer active:scale-90"
              title="Exportar / Importar"
            >
              <Download size={15} />
            </button>
            {isExportOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsExportOpen(false)} />
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-surface-700 p-1.5 shadow-2xl z-20 animate-in fade-in slide-in-from-top-1 duration-150">
                  {exportContent}
                </div>
              </>
            )}
          </div>
          <div className="relative">
            <button
              id="btn-compartir"
              onClick={generateShareLink}
              className="flex items-center justify-center w-9 h-9 rounded-lg
                         bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20 hover:text-emerald-300
                         border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-150 cursor-pointer active:scale-90"
              title="Compartir táctica (generar enlace)"
            >
              <Link2 size={15} />
            </button>
            {isShareOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsShareOpen(false)} />
                <div className="absolute right-0 mt-2 w-[340px] rounded-xl border border-border bg-surface-700 p-4 shadow-2xl z-20 animate-in fade-in slide-in-from-top-1 duration-150 select-none">
                  {shareContent}
                  <div className="mt-3 pt-2.5 border-t border-white/5">
                    <p className="text-[10px] text-text-muted leading-relaxed">
                      <span className="font-semibold text-text-secondary">💡 Tip:</span>{' '}
                      Guarda este enlace en tus marcadores o compártelo por WhatsApp, correo o cualquier medio. La táctica viaja dentro del enlace, sin necesidad de cuenta ni servidor.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        {hiddenFileInput}
      </header>
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
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

          {/* Bottom info strip */}
          <div className="flex items-center justify-between mt-3 px-1 text-xs text-text-muted">
            <span>16 : 9 · Campo de fútbol</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Listo
            </span>
          </div>
        </div>
      </main>

      {/* ── Toast notification ─────────────────────────────────────────── */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50
                    px-4 py-2 rounded-xl text-sm font-medium
                    bg-surface-700/95 text-text-primary border border-border
                    shadow-xl backdrop-blur-sm transition-all duration-300
                    ${toast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
      >
        {toast}
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="flex items-center justify-center px-6 py-3 border-t border-border text-xs text-text-muted">
        Pizarra v0.1.0
      </footer>
    </div>
  )
}

export default App
