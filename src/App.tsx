import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Pencil } from 'lucide-react'
import Cancha from './components/Cancha'
import FichaJugador from './components/FichaJugador'
import DraggableElement from './components/DraggableElement'
import InteractiveArrow from './components/InteractiveArrow'
import DesktopSidebar from './components/DesktopSidebar'
import FloatingMenu from './components/FloatingMenu'
import Scoreboard from './components/Scoreboard'
import ColorPickerPortal from './components/ColorPickerPortal'
import ZoomControls from './components/ZoomControls'
import TeamConfig, { type TeamSide } from './components/TeamConfig'
import { useIsMobile } from './hooks/useIsMobile'
import { useToast } from './hooks/useToast'
import { useZoomPan } from './hooks/useZoomPan'
import {
  defaultTeam,
  changeFormation,
  autoArrangeTeam,
  getNextUnusedNumber,
  findFreeSpot,
} from './constants/formations'
import {
  loadFromLS,
  saveToLS,
  loadSlot,
  saveSlot,
  deleteSlot,
  getSlotName,
  deepClone,
} from './utils/storage'
import { compressToUrlSafe, decompressFromUrlSafe } from './utils/share'
import { exportTacticAsImage, exportTacticAsPdf } from './utils/exportTactic'
import {
  isValidTacticaGuardada,
  uid,
  type Jugador,
  type FieldElement,
  type ArrowItem,
  type ElementType,
  type TacticaGuardada,
} from './types'

/** Grid step (%) used when magnetic snapping is enabled. */
const SNAP_STEP = 2.5

/* ── Component ────────────────────────────────────────────────────────── */
function App() {
  const canchaRef = useRef<HTMLDivElement>(null)
  const fieldContainerRef = useRef<HTMLDivElement>(null)

  // Hydrate from LocalStorage on first render (single read)
  const [initialData] = useState(() => {
    const saved = loadFromLS()
    // Migrate the tactic name from the legacy standalone key, if present
    let legacyName: string | null = null
    try {
      legacyName = localStorage.getItem('pizarra_tactica_name')
      if (legacyName !== null) localStorage.removeItem('pizarra_tactica_name')
    } catch { /* ignore */ }

    return {
      local: saved ? deepClone(saved.local) : defaultTeam('local'),
      visitante: saved ? deepClone(saved.visitante) : defaultTeam('visitante'),
      colorLocal: saved?.colorLocal ?? '#2563eb',
      colorVisitante: saved?.colorVisitante ?? '#dc2626',
      elements: saved?.elements ? deepClone(saved.elements) : [],
      arrows: saved?.arrows ? deepClone(saved.arrows) : [],
      tacticName: saved?.tacticName ?? legacyName ?? 'Pizarra de Tácticas',
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
  const [tacticName, setTacticName] = useState(initialData.tacticName)
  const [nombreLocal, setNombreLocal] = useState(initialData.nombreLocal)
  const [nombreVisitante, setNombreVisitante] = useState(initialData.nombreVisitante)
  const [golesLocal, setGolesLocal] = useState(initialData.golesLocal)
  const [golesVisitante, setGolesVisitante] = useState(initialData.golesVisitante)
  const [mostrarMarcador, setMostrarMarcador] = useState(initialData.mostrarMarcador)
  const [marcadorX, setMarcadorX] = useState(initialData.marcadorX)
  const [marcadorY, setMarcadorY] = useState(initialData.marcadorY)

  // UI state
  const [isTeamConfigOpen, setIsTeamConfigOpen] = useState(false)
  const [activeColorPicker, setActiveColorPicker] = useState<{
    team: TeamSide;
    rect: DOMRect;
  } | null>(null)
  const [shareUrl, setShareUrl] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [snapEnabled, setSnapEnabled] = useState(false)

  const isMobile = useIsMobile()
  const { toast, showToast } = useToast()
  const { zoom, pan, isPanning, zoomIn, zoomOut, resetZoom, pointerHandlers } =
    useZoomPan(fieldContainerRef)

  useEffect(() => {
    document.title = `${tacticName.slice(0, 100)} - PizarrApp Táctica`
  }, [tacticName])

  // Telegram Mini App initialisation
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      tg.ready()
      tg.expand()

      try {
        tg.setHeaderColor(tg.themeParams.secondary_bg_color || '#12121a')
        tg.setBackgroundColor(tg.themeParams.bg_color || '#0a0a0f')
      } catch (e) {
        console.warn('Could not set Telegram header/background colors:', e)
      }
    }
  }, [])

  /* ── Fullscreen API ───────────────────────────────────────────────── */
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await fieldContainerRef.current?.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch {
      showToast('⚠ Pantalla completa no disponible')
    }
  }, [showToast])

  // Reset zoom and pan when screen mode (mobile vs desktop) changes
  useEffect(() => {
    resetZoom()
  }, [isMobile, resetZoom])

  const toggleSnap = useCallback(() => {
    setSnapEnabled((prev) => {
      showToast(prev ? 'Cuadrícula magnética desactivada' : 'Cuadrícula magnética activada')
      return !prev
    })
  }, [showToast])

  /* ── Current tactic snapshot ──────────────────────────────────────── */
  const getCurrentTacticData = useCallback((): TacticaGuardada => ({
    local, visitante, colorLocal, colorVisitante, elements, arrows, tacticName,
    nombreLocal, nombreVisitante, golesLocal, golesVisitante, mostrarMarcador,
    marcadorX, marcadorY,
  }), [local, visitante, colorLocal, colorVisitante, elements, arrows, tacticName,
    nombreLocal, nombreVisitante, golesLocal, golesVisitante, mostrarMarcador,
    marcadorX, marcadorY])

  /* ── Autosave (debounced) — the "Autoguardado" badge is real now ──── */
  useEffect(() => {
    const t = setTimeout(() => saveToLS(getCurrentTacticData()), 600)
    return () => clearTimeout(t)
  }, [getCurrentTacticData])

  /* ── Apply a full tactic to the board (shared by URL hash & slots) ── */
  const applyTactic = useCallback((saved: TacticaGuardada) => {
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
        applyTactic(parsed)
        window.history.replaceState(null, '', window.location.pathname)
        showToast('✓ Táctica cargada desde enlace')
      } catch { /* ignore malformed data */ }
    }
    loadFromHash()
  }, [applyTactic, showToast])

  /* ── Prevent mobile pull-to-refresh / history swipe navigation ────── */
  useEffect(() => {
    // Elements that must keep native touch behaviour (scroll, tap, type)
    const isInteractive = (target: HTMLElement) =>
      target.closest('button') ||
      target.closest('input') ||
      target.closest('select') ||
      target.closest('textarea') ||
      target.closest('a') ||
      // Scrollable overlays need native touch scrolling
      target.closest('.popover-mobile') ||
      target.closest('.color-picker-mobile-sheet') ||
      target.closest('[role="dialog"]')

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        // Prevent multi-touch browser pinch zoom
        if (e.cancelable) e.preventDefault()
      }

      const touch = e.touches[0]
      const edgeThreshold = 25
      const isNearEdge =
        touch.clientX < edgeThreshold || touch.clientX > window.innerWidth - edgeThreshold

      if (isNearEdge) {
        const target = e.target as HTMLElement
        if (
          !isInteractive(target) &&
          !target.closest('.cursor-grab') &&
          !target.closest('.cursor-pointer') &&
          !target.closest('[role="button"]') &&
          e.cancelable
        ) {
          e.preventDefault()
        }
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement
      if (!isInteractive(target) && e.cancelable) {
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
  const generateShareLink = useCallback(async () => {
    const json = JSON.stringify(getCurrentTacticData())
    const compressed = await compressToUrlSafe(json)
    const url = `${window.location.origin}${window.location.pathname}#t=${compressed}`
    setShareUrl(url)
    setIsCopied(false)
  }, [getCurrentTacticData])

  const copyShareLink = useCallback(async () => {
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
  }, [shareUrl, showToast])

  /* ── Screen ↔ field coordinate mapping ─────────────────────────────
   * Field coordinates are stored in landscape space; the mobile pitch is
   * rotated 90°, so screen coordinates are transformed both ways.
   */
  const toField = useCallback(
    (sx: number, sy: number) => (isMobile ? { x: 100 - sy, y: sx } : { x: sx, y: sy }),
    [isMobile],
  )

  /* ── Player handlers (stable — players are memoized components) ──── */
  const setTeam = useCallback((team: TeamSide, updater: (prev: Jugador[]) => Jugador[]) => {
    if (team === 'local') setLocal(updater)
    else setVisitante(updater)
  }, [])

  const handlePlayerDragEnd = useCallback(
    (team: TeamSide) => (numero: number, sx: number, sy: number) => {
      const { x, y } = toField(sx, sy)
      setTeam(team, (prev) => prev.map((j) => (j.numero === numero ? { ...j, x, y } : j)))
    },
    [toField, setTeam],
  )
  const handleLocalDragEnd = useMemo(() => handlePlayerDragEnd('local'), [handlePlayerDragEnd])
  const handleVisitanteDragEnd = useMemo(() => handlePlayerDragEnd('visitante'), [handlePlayerDragEnd])

  const handleDeletePlayer = useCallback(
    (team: TeamSide) => (numero: number) => {
      setTeam(team, (prev) => prev.filter((j) => j.numero !== numero))
      showToast('Jugador eliminado')
    },
    [setTeam, showToast],
  )
  const handleDeleteLocalPlayer = useMemo(() => handleDeletePlayer('local'), [handleDeletePlayer])
  const handleDeleteVisitantePlayer = useMemo(() => handleDeletePlayer('visitante'), [handleDeletePlayer])

  const handleNameChange = useCallback(
    (team: TeamSide) => (numero: number, newName: string) => {
      setTeam(team, (prev) => prev.map((j) => (j.numero === numero ? { ...j, nombre: newName } : j)))
    },
    [setTeam],
  )
  const handleLocalNameChange = useMemo(() => handleNameChange('local'), [handleNameChange])
  const handleVisitanteNameChange = useMemo(() => handleNameChange('visitante'), [handleNameChange])

  const handleNumberChange = useCallback(
    (team: TeamSide) => (oldNumero: number, newNumero: number) => {
      const players = team === 'local' ? local : visitante
      if (players.some((j) => j.numero === newNumero)) {
        showToast(`El número ${newNumero} ya está ocupado`)
        return
      }
      setTeam(team, (prev) =>
        prev.map((j) => (j.numero === oldNumero ? { ...j, numero: newNumero } : j)),
      )
    },
    [local, visitante, setTeam, showToast],
  )
  const handleLocalNumberChange = useMemo(() => handleNumberChange('local'), [handleNumberChange])
  const handleVisitanteNumberChange = useMemo(() => handleNumberChange('visitante'), [handleNumberChange])

  /* ── Team configuration handlers ──────────────────────────────────── */
  const handleFormationChange = useCallback(
    (side: TeamSide, size: 7 | 9 | 11) => {
      setTeam(side, (prev) => changeFormation(prev, size, side))
      showToast(`${side === 'local' ? 'Local' : 'Visitante'}: Fútbol ${size}`)
    },
    [setTeam, showToast],
  )

  const handleAddPlayer = useCallback(
    (side: TeamSide) => {
      setTeam(side, (prev) => {
        const num = getNextUnusedNumber(prev)
        const spot = findFreeSpot(prev, side)
        showToast(`+ Jugador ${side} ${num}`)
        return [...prev, { numero: num, nombre: `Jugador ${num}`, x: spot.x, y: spot.y }]
      })
    },
    [setTeam, showToast],
  )

  const handleRemovePlayer = useCallback(
    (side: TeamSide) => {
      setTeam(side, (prev) => {
        if (prev.length === 0) return prev
        const lastPlayer = prev[prev.length - 1]
        showToast(`- Jugador ${side} ${lastPlayer.numero}`)
        return prev.filter((p) => p.numero !== lastPlayer.numero)
      })
    },
    [setTeam, showToast],
  )

  const handleAutoArrange = useCallback(() => {
    setLocal((prev) => autoArrangeTeam(prev, 'local'))
    setVisitante((prev) => autoArrangeTeam(prev, 'visitante'))
    showToast('✓ Jugadores ordenados')
  }, [showToast])

  const handleColorPickerOpen = useCallback((team: TeamSide, rect: DOMRect) => {
    setActiveColorPicker({ team, rect })
  }, [])

  /* ── Element & arrow handlers ─────────────────────────────────────── */
  const handleAddTool = useCallback(
    (type: ElementType | 'arrow') => {
      if (type === 'arrow') {
        const newArrow: ArrowItem = { id: uid(), x1: 45, y1: 45, x2: 55, y2: 55 }
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
    },
    [showToast],
  )

  const handleElementDragEnd = useCallback(
    (id: string, sx: number, sy: number) => {
      const { x, y } = toField(sx, sy)
      setElements((prev) => prev.map((el) => (el.id === id ? { ...el, x, y } : el)))
    },
    [toField],
  )

  const handleElementDelete = useCallback(
    (id: string) => {
      setElements((prev) => prev.filter((el) => el.id !== id))
      showToast('Elemento eliminado')
    },
    [showToast],
  )

  const handleElementTextChange = useCallback((id: string, text: string) => {
    setElements((prev) => prev.map((el) => (el.id === id ? { ...el, text } : el)))
  }, [])

  const handleElementScaleChange = useCallback((id: string, scale: number) => {
    setElements((prev) => prev.map((el) => (el.id === id ? { ...el, scale } : el)))
  }, [])

  const handleElementRotationChange = useCallback((id: string, rotation: number) => {
    setElements((prev) => prev.map((el) => (el.id === id ? { ...el, rotation } : el)))
  }, [])

  const handleArrowUpdate = useCallback(
    (id: string, updates: Partial<ArrowItem>) => {
      // Arrows are edited in screen coordinates — map back to field space
      const mapped: Partial<ArrowItem> = isMobile
        ? {
            ...(updates.x1 !== undefined && { y1: updates.x1 }),
            ...(updates.y1 !== undefined && { x1: 100 - updates.y1 }),
            ...(updates.x2 !== undefined && { y2: updates.x2 }),
            ...(updates.y2 !== undefined && { x2: 100 - updates.y2 }),
            ...(updates.scale !== undefined && { scale: updates.scale }),
          }
        : updates
      setArrows((prev) => prev.map((arr) => (arr.id === id ? { ...arr, ...mapped } : arr)))
    },
    [isMobile],
  )

  const handleArrowDelete = useCallback(
    (id: string) => {
      setArrows((prev) => prev.filter((arr) => arr.id !== id))
      showToast('Línea eliminada')
    },
    [showToast],
  )

  const handleArrowScaleChange = useCallback((id: string, scale: number) => {
    setArrows((prev) => prev.map((arr) => (arr.id === id ? { ...arr, scale } : arr)))
  }, [])

  /* ── Clear all extras (balls, cones, lines, text) ─────────────────── */
  const clearExtras = useCallback(() => {
    setElements([])
    setArrows([])
    showToast('🗑 Extras eliminados')
  }, [showToast])

  /* ── Tactic Slots (save/load 3 tactics) ───────────────────────────── */
  const [slotNames, setSlotNames] = useState<[string, string, string]>(() => [
    getSlotName(0),
    getSlotName(1),
    getSlotName(2),
  ])

  const refreshSlotNames = useCallback(() => {
    setSlotNames([getSlotName(0), getSlotName(1), getSlotName(2)])
  }, [])

  const guardarEnSlot = useCallback((slotIndex: number) => {
    if (saveSlot(slotIndex, getCurrentTacticData())) {
      refreshSlotNames()
      showToast(`✓ Guardada en Táctica ${slotIndex + 1}`)
    } else {
      showToast('⚠ No se pudo guardar la táctica')
    }
  }, [getCurrentTacticData, refreshSlotNames, showToast])

  const cargarDesdeSlot = useCallback((slotIndex: number) => {
    const saved = loadSlot(slotIndex)
    if (!saved) {
      showToast(`⚠ Táctica ${slotIndex + 1} está vacía`)
      return
    }
    applyTactic(saved)
    showToast(`✓ Táctica ${slotIndex + 1} cargada`)
  }, [applyTactic, showToast])

  const borrarSlot = useCallback((slotIndex: number) => {
    deleteSlot(slotIndex)
    refreshSlotNames()
    showToast(`🗑 Táctica ${slotIndex + 1} borrada`)
  }, [refreshSlotNames, showToast])

  /* ── Export ───────────────────────────────────────────────────────── */
  const exportWhiteboardAsImage = useCallback(() => {
    exportTacticAsImage(getCurrentTacticData(), { portrait: isMobile, notify: showToast })
  }, [getCurrentTacticData, isMobile, showToast])

  const exportWhiteboardAsPdf = useCallback(() => {
    exportTacticAsPdf(getCurrentTacticData(), { portrait: isMobile, notify: showToast })
  }, [getCurrentTacticData, isMobile, showToast])

  /* ── Derived rendering data ───────────────────────────────────────── */
  const snapStep = snapEnabled ? SNAP_STEP : undefined

  // Screen-space arrows/elements (mobile pitch is rotated 90°)
  const screenArrows = useMemo(
    () =>
      isMobile
        ? arrows.map((arr) => ({ ...arr, x1: arr.y1, y1: 100 - arr.x1, x2: arr.y2, y2: 100 - arr.x2 }))
        : arrows,
    [arrows, isMobile],
  )

  const screenElements = useMemo(
    () => (isMobile ? elements.map((el) => ({ ...el, x: el.y, y: 100 - el.x })) : elements),
    [elements, isMobile],
  )

  const scoreboard = mostrarMarcador && (
    <Scoreboard
      nombreLocal={nombreLocal}
      nombreVisitante={nombreVisitante}
      colorLocal={colorLocal}
      colorVisitante={colorVisitante}
      golesLocal={golesLocal}
      golesVisitante={golesVisitante}
      onNombreLocalChange={setNombreLocal}
      onNombreVisitanteChange={setNombreVisitante}
      onGolesLocalChange={setGolesLocal}
      onGolesVisitanteChange={setGolesVisitante}
    />
  )

  const fieldContent = (
    <div
      {...pointerHandlers}
      style={{
        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        transformOrigin: 'center center',
        width: '100%',
        height: '100%',
        touchAction: 'none',
        transition: isPanning ? 'none' : 'transform 0.15s ease-out',
      }}
      className="w-full h-full"
    >
      <Cancha ref={canchaRef} isVertical={isMobile}>
        {screenArrows.map((arr) => (
          <InteractiveArrow
            key={`arrow-${arr.id}`}
            arrow={arr}
            constraintsRef={canchaRef}
            onUpdate={handleArrowUpdate}
            onDelete={handleArrowDelete}
            onScaleChange={handleArrowScaleChange}
          />
        ))}
        {screenElements.map((el) => (
          <DraggableElement
            key={`element-${el.id}`}
            element={el}
            constraintsRef={canchaRef}
            onDragEnd={handleElementDragEnd}
            onDelete={handleElementDelete}
            onTextChange={handleElementTextChange}
            onScaleChange={handleElementScaleChange}
            onRotationChange={handleElementRotationChange}
            snapStep={snapStep}
          />
        ))}
        {local.map((j) => (
          <FichaJugador
            key={`local-${j.numero}`}
            numero={j.numero}
            nombre={j.nombre}
            color={colorLocal}
            x={isMobile ? j.y : j.x}
            y={isMobile ? 100 - j.x : j.y}
            constraintsRef={canchaRef}
            onDragEnd={handleLocalDragEnd}
            onDelete={handleDeleteLocalPlayer}
            onNameChange={handleLocalNameChange}
            onNumberChange={handleLocalNumberChange}
            isMobile={isMobile}
            snapStep={snapStep}
          />
        ))}
        {visitante.map((j) => (
          <FichaJugador
            key={`visit-${j.numero}`}
            numero={j.numero}
            nombre={j.nombre}
            color={colorVisitante}
            x={isMobile ? j.y : j.x}
            y={isMobile ? 100 - j.x : j.y}
            constraintsRef={canchaRef}
            onDragEnd={handleVisitanteDragEnd}
            onDelete={handleDeleteVisitantePlayer}
            onNameChange={handleVisitanteNameChange}
            onNumberChange={handleVisitanteNumberChange}
            isMobile={isMobile}
            snapStep={snapStep}
          />
        ))}
      </Cancha>
    </div>
  )

  const teamConfigContent = (
    <TeamConfig
      local={local}
      visitante={visitante}
      colorLocal={colorLocal}
      colorVisitante={colorVisitante}
      mostrarMarcador={mostrarMarcador}
      setMostrarMarcador={setMostrarMarcador}
      onFormationChange={handleFormationChange}
      onColorPickerOpen={handleColorPickerOpen}
      onAddPlayer={handleAddPlayer}
      onRemovePlayer={handleRemovePlayer}
      onAutoArrange={handleAutoArrange}
    />
  )

  const zoomControls = (
    <ZoomControls
      zoom={zoom}
      onZoomIn={zoomIn}
      onZoomOut={zoomOut}
      onResetZoom={resetZoom}
      isFullscreen={isFullscreen}
      onToggleFullscreen={toggleFullscreen}
      snapEnabled={snapEnabled}
      onToggleSnap={toggleSnap}
      compact={isMobile}
      placement={isMobile ? 'top' : 'bottom'}
    />
  )

  const colorPickerPortal = activeColorPicker && (
    <ColorPickerPortal
      color={activeColorPicker.team === 'local' ? colorLocal : colorVisitante}
      onChange={(c) => {
        if (activeColorPicker.team === 'local') setColorLocal(c)
        else setColorVisitante(c)
      }}
      rect={activeColorPicker.rect}
      onClose={() => setActiveColorPicker(null)}
    />
  )

  /* ── Mobile layout ────────────────────────────────────────────────── */
  if (isMobile) {
    return (
      <div className="flex flex-col h-dvh overflow-hidden bg-surface-900">
        {scoreboard}
        <main className="flex-1 flex items-center justify-center p-2 overflow-hidden">
          <div
            ref={fieldContainerRef}
            className={`relative rounded-xl overflow-hidden border border-border shadow-2xl shadow-black/40 ${
              isFullscreen ? 'w-full h-full' : 'pitch-container-mobile'
            }`}
          >
            {fieldContent}
            {zoomControls}
          </div>
        </main>
        <footer
          className="text-center py-3 text-[10px] text-text-muted shrink-0 border-t border-white/5 bg-surface-800/40 safe-area-pb select-none"
          style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
        >
          Junior y TeacherdhApps por nuestro amor al futbol. PizarrApp ® 2026.
        </footer>
        <FloatingMenu
          onAddTool={handleAddTool}
          onClearExtras={clearExtras}
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
        {colorPickerPortal}
        <div
          role="status"
          aria-live="polite"
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

  /* ── Desktop layout ───────────────────────────────────────────────── */
  return (
    <div className="flex flex-col min-h-dvh">
      {scoreboard}
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
                onChange={(e) => setTacticName(e.target.value)}
                className="text-sm font-semibold text-text-primary bg-transparent border-none outline-none focus:bg-surface-700/60 focus:ring-1 focus:ring-accent-500/30 px-1.5 py-0.5 rounded-md max-w-[300px] transition-all"
                title="Editar nombre de táctica"
                aria-label="Nombre de la táctica"
              />
              <Pencil size={12} className="text-text-muted shrink-0" aria-hidden="true" />
            </div>
            <span className="text-[9px] text-emerald-400/80 font-medium px-1.5 flex items-center gap-1 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Autoguardado
            </span>
          </div>
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
            <div className={isFullscreen ? 'w-full h-full' : 'contents'}>{fieldContent}</div>
            {zoomControls}
          </div>
        </div>
      </main>

      {/* ── Toast notification ─────────────────────────────────────────── */}
      <div
        role="status"
        aria-live="polite"
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
        onExportPng={exportWhiteboardAsImage}
        onExportPdf={exportWhiteboardAsPdf}
        generateShareLink={generateShareLink}
        copyShareLink={copyShareLink}
        shareUrl={shareUrl}
        isCopied={isCopied}
        teamConfigContent={teamConfigContent}
        mostrarMarcador={mostrarMarcador}
        setMostrarMarcador={setMostrarMarcador}
        slotNames={slotNames}
        onSaveSlot={guardarEnSlot}
        onLoadSlot={cargarDesdeSlot}
        onDeleteSlot={borrarSlot}
      />

      {colorPickerPortal}
    </div>
  )
}

export default App
