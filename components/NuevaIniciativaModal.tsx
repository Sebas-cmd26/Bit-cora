"use client"

import { useState, useRef, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Iniciativa, ETAPAS, EtapaType } from "@/lib/types/database.types"
import { X, Loader2, BookPlus, ChevronDown, Check, Lightbulb, PenTool, Rocket, TrendingUp } from "lucide-react"

/**
 * Configuración de las etapas disponibles para una nueva iniciativa.
 * Asocia cada etapa con un icono, un color y una breve descripción.
 */
const stageConfig: Record<EtapaType, { icon: React.ElementType, color: string, desc: string }> = {
    "Identificación de oportunidad": { icon: Lightbulb, color: "text-blue-500", desc: "Definición del problema y oportunidad" },
    "Diseño Integral": { icon: PenTool, color: "text-amber-500", desc: "Planificación y diseño de solución" },
    "Implementación de piloto": { icon: Rocket, color: "text-purple-500", desc: "Pruebas en entorno controlado" },
    "Escalamiento y mejora continua": { icon: TrendingUp, color: "text-emerald-500", desc: "Expansión y optimización" }
}

/**
 * Modal para crear una nueva iniciativa.
 * Permite ingresar código, nombre y etapa inicial.
 * 
 * @param onClose - Función para cerrar el modal.
 * @param onCreated - Callback que se ejecuta cuando la iniciativa se crea exitosamente.
 */
export default function NuevaIniciativaModal({
    onClose,
    onCreated,
}: {
    onClose: () => void
    onCreated: (ini: Iniciativa) => void
}) {
    // -- Estado del Formulario --
    const [codigo, setCodigo] = useState("")
    const [nombre, setNombre] = useState("")
    const [etapa, setEtapa] = useState<EtapaType>("Identificación de oportunidad")

    // -- Estado del Select Personalizado --
    /** Controla si el menú desplegable de etapas está abierto o cerrado */
    const [openSelect, setOpenSelect] = useState(false)
    const selectRef = useRef<HTMLDivElement>(null)

    // -- Estado de Carga y Errores --
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()

    // -- Efectos --
    /** Cierra el select personalizado si se hace clic fuera de él */
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setOpenSelect(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    /**
     * Maneja el envío del formulario.
     * Valida la sesión del usuario y crea la iniciativa en Supabase.
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setError("No autenticado"); setLoading(false); return }

        const { data, error: err } = await supabase
            .from("iniciativas")
            .insert({ codigo: codigo.trim().toUpperCase(), nombre: nombre.trim(), etapa, owner_id: user.id })
            .select()
            .single()

        if (err) setError(err.message)
        else { onCreated(data); onClose() }
        setLoading(false)
    }

    const SelectedIcon = stageConfig[etapa].icon

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all animate-in fade-in duration-500 text-left">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl shadow-black/50 flex flex-col animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 max-h-[90vh]">

                {/* Header - Fixed Height */}
                <div className="flex-none flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-10 relative overflow-hidden rounded-t-3xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-purple-500/5 pointer-events-none"></div>
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="p-2 bg-primary-50 dark:bg-primary-500/10 rounded-xl border border-primary-100 dark:border-primary-500/20 shadow-sm">
                            <BookPlus className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Nueva Iniciativa</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Crear un nuevo proyecto</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition z-10">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Form Content */}
                <div className="flex-1 overflow-y-auto overflow-x-visible p-6 custom-scrollbar">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        <div className="space-y-2 group">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1 group-focus-within:text-primary-500 transition-colors">Codigo del Proyecto</label>
                            <input
                                value={codigo}
                                onChange={e => setCodigo(e.target.value)}
                                required
                                placeholder="Ej: PRJ-2024-001"
                                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 uppercase text-sm font-mono font-bold tracking-wide transition-all shadow-sm focus:shadow-md hover:border-primary-300 dark:hover:border-primary-700"
                            />
                        </div>

                        <div className="space-y-2 group">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1 group-focus-within:text-primary-500 transition-colors">Nombre de la Iniciativa</label>
                            <input
                                value={nombre}
                                onChange={e => setNombre(e.target.value)}
                                required
                                placeholder="Desarrollo de nueva plataforma..."
                                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium transition-all shadow-sm focus:shadow-md hover:border-primary-300 dark:hover:border-primary-700"
                            />
                        </div>

                        <div className="space-y-2 relative" ref={selectRef}>
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Etapa Inicial</label>

                            {/* Custom Select Trigger */}
                            <button
                                type="button"
                                onClick={() => setOpenSelect(!openSelect)}
                                className={`w-full bg-white dark:bg-slate-950 border ${openSelect ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-slate-200 dark:border-slate-800'} rounded-xl px-4 py-3 text-left flex items-center justify-between transition-all shadow-sm hover:border-primary-400 hover:shadow-md group`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors`}>
                                        <SelectedIcon className={`w-4 h-4 ${stageConfig[etapa].color}`} />
                                    </div>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{etapa}</span>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${openSelect ? 'rotate-180 text-primary-500' : ''}`} />
                            </button>

                            {/* Custom Options Dropdown */}
                            {openSelect && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl shadow-black/20 z-[200] animate-in fade-in slide-in-from-top-4 duration-300 origin-top overflow-hidden">
                                    {/* Added max-height and scrolling here */}
                                    <div className="max-h-60 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                        {ETAPAS.map((e, index) => {
                                            const Icon = stageConfig[e].icon
                                            return (
                                                <button
                                                    key={e}
                                                    type="button"
                                                    onClick={() => { setEtapa(e); setOpenSelect(false) }}
                                                    style={{ animationDelay: `${index * 50}ms` }}
                                                    className={`w-full text-left px-3 py-3 rounded-xl flex items-center justify-between group transition-all duration-200 animate-in slide-in-from-left-2 fade-in fill-mode-both ${etapa === e
                                                        ? "bg-primary-50 dark:bg-primary-900/30 shadow-inner"
                                                        : "hover:bg-slate-50 dark:hover:bg-slate-800 hover:translate-x-1"
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${etapa === e ? 'bg-white dark:bg-slate-900 shadow-sm' : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700'} transition-colors`}>
                                                            <Icon className={`w-4 h-4 ${stageConfig[e].color}`} />
                                                        </div>
                                                        <div>
                                                            <p className={`text-sm font-bold ${etapa === e ? 'text-primary-900 dark:text-primary-100' : 'text-slate-700 dark:text-slate-300'}`}>{e}</p>
                                                            <p className="text-[10px] text-slate-400 font-medium">{stageConfig[e].desc}</p>
                                                        </div>
                                                    </div>
                                                    {etapa === e && <Check className="w-5 h-5 text-primary-600 dark:text-primary-400 animate-in zoom-in spin-in-45 duration-300" />}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-xs font-medium flex items-center gap-2 animate-in slide-in-from-left-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-sm font-bold tracking-wide">
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50 text-white dark:text-slate-900 font-bold text-sm transition-all shadow-lg shadow-slate-900/20 active:scale-[0.98] hover:shadow-xl hover:-translate-y-0.5 duration-200"
                            >
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                Crear Iniciativa
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
