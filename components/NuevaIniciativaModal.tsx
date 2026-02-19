"use client"

import { useState, useRef, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Iniciativa, ETAPAS, EtapaType } from "@/lib/types/database.types"
import { X, Loader2, BookPlus, ChevronDown, Check } from "lucide-react"

export default function NuevaIniciativaModal({
    onClose,
    onCreated,
}: {
    onClose: () => void
    onCreated: (ini: Iniciativa) => void
}) {
    const [codigo, setCodigo] = useState("")
    const [nombre, setNombre] = useState("")
    const [etapa, setEtapa] = useState<EtapaType>("Identificación de oportunidad")

    // Custom Select State
    const [openSelect, setOpenSelect] = useState(false)
    const selectRef = useRef<HTMLDivElement>(null)

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()

    // Close select when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setOpenSelect(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl shadow-black/50 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-50 dark:bg-primary-500/10 rounded-xl border border-primary-100 dark:border-primary-500/20">
                            <BookPlus className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Nueva Iniciativa</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Crear un nuevo proyecto</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/50 flex-1 overflow-visible">

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Codigo del Proyecto</label>
                        <input
                            value={codigo}
                            onChange={e => setCodigo(e.target.value)}
                            required
                            placeholder="Ej: PRJ-2024-001"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 uppercase text-sm font-mono font-bold tracking-wide transition-all shadow-sm focus:shadow-md"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Nombre de la Iniciativa</label>
                        <input
                            value={nombre}
                            onChange={e => setNombre(e.target.value)}
                            required
                            placeholder="Desarrollo de nueva plataforma..."
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium transition-all shadow-sm focus:shadow-md"
                        />
                    </div>

                    <div className="space-y-2 relative" ref={selectRef}>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Etapa Inicial</label>

                        {/* Custom Select Trigger */}
                        <button
                            type="button"
                            onClick={() => setOpenSelect(!openSelect)}
                            className={`w-full bg-white dark:bg-slate-900 border ${openSelect ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-slate-200 dark:border-slate-800'} rounded-xl px-4 py-3 text-left flex items-center justify-between transition-all shadow-sm hover:border-primary-400`}
                        >
                            <span className="text-sm font-medium text-slate-900 dark:text-white truncate">{etapa}</span>
                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${openSelect ? 'rotate-180 text-primary-500' : ''}`} />
                        </button>

                        {/* Custom Options Dropdown */}
                        {openSelect && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="max-h-60 overflow-y-auto p-1.5 custom-scrollbar">
                                    {ETAPAS.map((e) => (
                                        <button
                                            key={e}
                                            type="button"
                                            onClick={() => { setEtapa(e); setOpenSelect(false) }}
                                            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between transition-all ${etapa === e
                                                    ? "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                                                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                                }`}
                                        >
                                            <span>{e}</span>
                                            {etapa === e && <Check className="w-4 h-4" />}
                                        </button>
                                    ))}
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
                        <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition text-sm font-bold tracking-wide">
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50 text-white dark:text-slate-900 font-bold text-sm transition-all shadow-lg shadow-slate-900/20 active:scale-[0.98]"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Crear Iniciativa
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
