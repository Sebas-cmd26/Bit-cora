"use client"

import { useState, useEffect, useRef } from "react"
import { Iniciativa, BitacoraRegistro, ETAPAS, InitiativeMember, Profile, EtapaType } from "@/lib/types/database.types"
import Link from "next/link"
import {
    ArrowLeft, Edit3, Check, X, Plus, Trash2, Paperclip,
    Calendar, User, ListFilter, LayoutGrid, ChevronRight,
    Loader2, Users, UserPlus, Send, FileText, MoreVertical, CheckCircle, Flag, ChevronDown, Lightbulb, PenTool, Rocket, TrendingUp, AlertTriangle
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useProfile } from "@/hooks/use-profile"

const etapaColor: Record<string, string> = {
    "Identificación de oportunidad": "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
    "Diseño Integral": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800",
    "Implementación de piloto": "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800",
    "Escalamiento y mejora continua": "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800",
}

const stageConfig: Record<EtapaType, { icon: React.ElementType, color: string, desc: string }> = {
    "Identificación de oportunidad": { icon: Lightbulb, color: "text-blue-500", desc: "Definición del problema" },
    "Diseño Integral": { icon: PenTool, color: "text-amber-500", desc: "Diseño de solución" },
    "Implementación de piloto": { icon: Rocket, color: "text-purple-500", desc: "Pruebas piloto" },
    "Escalamiento y mejora continua": { icon: TrendingUp, color: "text-emerald-500", desc: "Expansión" }
}

type EditRegistro = {
    fecha: string
    descripcion: string
    adjunto_url: string | null
}

type MemberWithProfile = InitiativeMember & { profiles: Profile }

export default function DetalleBitacoraClient({
    iniciativa: initialIniciativa,
    registros: initialRegistros,
}: {
    iniciativa: Iniciativa
    registros: BitacoraRegistro[]
}) {
    const { isAdmin } = useProfile()
    const supabase = createClient()
    const formRef = useRef<HTMLDivElement>(null)

    // -- State --
    const [iniciativa, setIniciativa] = useState(initialIniciativa)
    const [editingIniciativa, setEditingIniciativa] = useState(false)
    const [iForm, setIForm] = useState({
        codigo: iniciativa.codigo,
        nombre: iniciativa.nombre,
        etapa: (iniciativa.etapa ?? "Identificación de oportunidad") as EtapaType
    })
    const [iSaving, setISaving] = useState(false)

    // Custom Confirmation Modal State
    const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false)

    // Open/Close state for custom select
    const [openSelect, setOpenSelect] = useState(false)
    const selectRef = useRef<HTMLDivElement>(null)

    const [registros, setRegistros] = useState<BitacoraRegistro[]>(initialRegistros)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editForm, setEditForm] = useState<EditRegistro>({ fecha: "", descripcion: "", adjunto_url: null })

    // New Record Form State
    const [newForm, setNewForm] = useState<EditRegistro>({
        fecha: new Date().toISOString().split("T")[0],
        descripcion: "",
        adjunto_url: null
    })
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    // Members State
    const [members, setMembers] = useState<MemberWithProfile[]>([])
    const [newMemberEmail, setNewMemberEmail] = useState("")
    const [inviting, setInviting] = useState(false)
    const [showInviteInput, setShowInviteInput] = useState(false)
    const [inviteFeedback, setInviteFeedback] = useState<{ type: 'success' | 'error', msg: string } | null>(null)

    useEffect(() => {
        if (iniciativa.id) loadMembers()
    }, [iniciativa.id])

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

    async function loadMembers() {
        const { data } = await supabase
            .from("initiative_members")
            .select("*, profiles(*)")
            .eq("iniciativa_id", iniciativa.id)
        if (data) setMembers(data as unknown as MemberWithProfile[])
    }

    // -- Actions --
    const inviteMember = async () => {
        if (!newMemberEmail.trim()) return
        setInviting(true)
        setInviteFeedback(null)

        try {
            const { data: userProfile, error: profileError } = await supabase
                .from("profiles")
                .select("id")
                .eq("email", newMemberEmail.trim())
                .single()

            if (profileError || !userProfile) throw new Error("Usuario no encontrado.")

            const { error: memberError } = await supabase
                .from("initiative_members")
                .insert({ iniciativa_id: iniciativa.id, user_id: userProfile.id })

            if (memberError) {
                if (memberError.code === '23505') throw new Error("Ya es miembro.")
                throw memberError
            }

            setInviteFeedback({ type: 'success', msg: 'Invitado' })
            setNewMemberEmail("")
            loadMembers()
            setTimeout(() => setShowInviteInput(false), 1500)
        } catch (err: any) {
            setInviteFeedback({ type: 'error', msg: err.message || "Error" })
        } finally {
            setInviting(false)
        }
    }

    const removeMember = async (memberId: string) => {
        if (!confirm("¿Quitar usuario del equipo?")) return
        await supabase.from("initiative_members").delete().eq("id", memberId)
        setMembers(prev => prev.filter(m => m.id !== memberId))
    }

    const saveIniciativa = async () => {
        if (!isAdmin) return
        setISaving(true)
        const { data, error } = await supabase
            .from("iniciativas")
            .update({ codigo: iForm.codigo, nombre: iForm.nombre, etapa: iForm.etapa })
            .eq("id", iniciativa.id)
            .select()
            .single()
        if (!error && data) setIniciativa(data)
        setISaving(false)
        setEditingIniciativa(false)
    }

    const confirmFinalize = async () => {
        if (!isAdmin) return

        setISaving(true)
        const { data, error } = await supabase
            .from("iniciativas")
            .update({ etapa: "Escalamiento y mejora continua" })
            .eq("id", iniciativa.id)
            .select()
            .single()

        if (!error && data) {
            setIniciativa(data)
            setIForm(prev => ({ ...prev, etapa: "Escalamiento y mejora continua" }))
        }
        setISaving(false)
        setShowFinalizeConfirm(false)
    }

    const handleUpload = async (file: File, target: "new" | "edit") => {
        setUploading(true)
        const ext = file.name.split(".").pop()
        const path = `${iniciativa.id}/${Date.now()}.${ext}`
        const { data, error } = await supabase.storage.from("adjuntos-bitacora").upload(path, file)
        if (!error && data) {
            const { data: urlData } = supabase.storage.from("adjuntos-bitacora").getPublicUrl(data.path)
            if (target === "new") setNewForm(f => ({ ...f, adjunto_url: urlData.publicUrl }))
            else setEditForm(f => ({ ...f, adjunto_url: urlData.publicUrl }))
        }
        setUploading(false)
    }

    const addRegistro = async () => {
        if (!newForm.descripcion.trim()) { setFormError("Escribe un detalle"); return }
        setSaving(true); setFormError(null)
        const { data, error } = await supabase
            .from("bitacora_registros")
            .insert({
                iniciativa_id: iniciativa.id,
                fecha: newForm.fecha || new Date().toISOString(),
                descripcion: newForm.descripcion,
                adjunto_url: newForm.adjunto_url
            })
            .select().single()

        if (!error && data) {
            setRegistros(prev => [data, ...prev])
            setNewForm({ fecha: new Date().toISOString().split("T")[0], descripcion: "", adjunto_url: null })
            const fileInput = document.getElementById("file-upload") as HTMLInputElement
            if (fileInput) fileInput.value = ""
        } else {
            setFormError("Error al guardar")
        }
        setSaving(false)
    }

    const startEdit = (r: BitacoraRegistro) => {
        setEditingId(r.id)
        setEditForm({
            fecha: r.fecha ? new Date(r.fecha).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
            descripcion: r.descripcion,
            adjunto_url: r.adjunto_url ?? null
        })
    }

    const saveEdit = async () => {
        if (!editingId || !isAdmin) return
        setSaving(true)
        const { data, error } = await supabase
            .from("bitacora_registros")
            .update({ fecha: editForm.fecha, descripcion: editForm.descripcion, adjunto_url: editForm.adjunto_url })
            .eq("id", editingId)
            .select().single()
        if (!error && data) setRegistros(prev => prev.map(r => r.id === editingId ? data : r))
        setSaving(false); setEditingId(null)
    }

    const deleteRegistro = async (id: string) => {
        if (!isAdmin) return
        if (!confirm("¿Eliminar este registro?")) return
        await supabase.from("bitacora_registros").delete().eq("id", id)
        setRegistros(prev => prev.filter(r => r.id !== id))
    }

    const fmt = (d: string | null | undefined) => d ? new Date(d).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }) : "-"

    const isFinalized = iniciativa.etapa === "Escalamiento y mejora continua"

    // Fallback for stage if not in config
    const currentStage = iForm.etapa || "Identificación de oportunidad"
    const CurrentStageIcon = stageConfig[currentStage]?.icon || Lightbulb

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700 pb-20 relative">

            {/* Custom Modal Overlay */}
            {showFinalizeConfirm && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm shadow-2xl shadow-black/50 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                        <div className="p-6 text-center space-y-4">
                            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2 animate-in zoom-in duration-500 delay-100">
                                <Flag className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">¿Finalizar Iniciativa?</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Esta acción marcará la iniciativa como <span className="text-emerald-600 dark:text-emerald-400 font-bold">completada</span>.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowFinalizeConfirm(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-sm transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmFinalize}
                                    disabled={iSaving}
                                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2"
                                >
                                    {iSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Finalizar"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 1. Navbar / Breadcrumbs */}
            <nav className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                    <Link href="/dashboard" className="hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1 group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver
                    </Link>
                    <span className="text-slate-300 dark:text-slate-700">/</span>
                    <span className="text-slate-900 dark:text-white font-semibold tracking-tight">{iniciativa.codigo}</span>
                </div>
            </nav>

            {/* 2. Header Card (Glassmorphism) */}
            <header className="relative overflow-visible rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 shadow-xl shadow-slate-200/20 dark:shadow-black/20 animate-in slide-in-from-top-4 duration-700 transition-all z-20">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none"></div>

                <div className="relative z-10 p-8">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                        <div className="space-y-2 flex-grow">
                            {editingIniciativa ? (
                                <input value={iForm.nombre} onChange={e => setIForm(f => ({ ...f, nombre: e.target.value }))}
                                    className="text-3xl font-bold bg-transparent border-b-2 border-slate-300 dark:border-slate-700 focus:border-primary-500 text-slate-900 dark:text-white outline-none w-full mb-3" />
                            ) : (
                                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                    {iniciativa.nombre}
                                    {isFinalized && <CheckCircle className="inline-block w-6 h-6 ml-3 text-emerald-500" />}
                                </h1>
                            )}
                            <div className="flex flex-wrap items-center gap-3">
                                {!editingIniciativa ? (
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${etapaColor[iniciativa.etapa ?? ""]}`}>
                                        {iniciativa.etapa}
                                    </span>
                                ) : (
                                    /* CUSTOM PREMIUM DROPDOWN */
                                    <div className="relative" ref={selectRef}>
                                        <button
                                            type="button"
                                            onClick={() => setOpenSelect(!openSelect)}
                                            className="flex items-center gap-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all min-w-[240px] justify-between"
                                        >
                                            <div className="flex items-center gap-2">
                                                <CurrentStageIcon className={`w-3.5 h-3.5 ${stageConfig[currentStage]?.color}`} />
                                                <span className="truncate max-w-[180px]">{currentStage}</span>
                                            </div>
                                            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${openSelect ? 'rotate-180' : ''}`} />
                                        </button>

                                        {openSelect && (
                                            <div className="absolute top-full left-0 mt-2 w-[280px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl shadow-black/20 z-[100] animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                                                <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
                                                    {ETAPAS.map((e) => {
                                                        const Icon = stageConfig[e].icon
                                                        return (
                                                            <button
                                                                key={e}
                                                                type="button"
                                                                onClick={() => { setIForm(f => ({ ...f, etapa: e })); setOpenSelect(false) }}
                                                                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors ${iForm.etapa === e ? 'bg-primary-50 dark:bg-primary-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                                            >
                                                                <div className={`p-1.5 rounded-md ${iForm.etapa === e ? 'bg-white dark:bg-slate-950 shadow-sm' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                                                    <Icon className={`w-3.5 h-3.5 ${stageConfig[e].color}`} />
                                                                </div>
                                                                <div>
                                                                    <p className={`text-sm font-semibold ${iForm.etapa === e ? 'text-primary-900 dark:text-primary-100' : 'text-slate-700 dark:text-slate-300'}`}>{e}</p>
                                                                </div>
                                                                {iForm.etapa === e && <Check className="w-4 h-4 text-primary-600 dark:text-primary-400 ml-auto" />}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <span className="text-sm text-slate-500 flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" /> Iniciado el {fmt(iniciativa.created_at)}
                                </span>
                            </div>
                        </div>

                        {/* Edit Controls */}
                        {isAdmin && (
                            <div className="flex gap-2 flex-shrink-0">
                                {!editingIniciativa ? (
                                    <>
                                        {!isFinalized && (
                                            <button
                                                onClick={() => setShowFinalizeConfirm(true)}
                                                title="Finalizar Iniciativa"
                                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition hover:scale-105 active:scale-95 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800"
                                            >
                                                <Flag className="w-5 h-5" />
                                            </button>
                                        )}
                                        <button onClick={() => { setIForm({ codigo: iniciativa.codigo, nombre: iniciativa.nombre, etapa: (iniciativa.etapa ?? "Identificación de oportunidad") as EtapaType }); setEditingIniciativa(true) }}
                                            className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100/50 dark:bg-slate-800/50 rounded-xl transition hover:scale-105 active:scale-95 border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                                            <Edit3 className="w-5 h-5" />
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex gap-2 animate-in fade-in slide-in-from-right-4">
                                        <button onClick={saveIniciativa} disabled={iSaving} className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-medium text-sm hover:opacity-90 transition shadow-lg shrink-0">
                                            Guardar
                                        </button>
                                        <button onClick={() => setEditingIniciativa(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-medium text-sm hover:bg-slate-200 transition shrink-0">
                                            Cancelar
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Collaborators Row (New Location) */}
                    <div className="flex items-center gap-4 py-4 border-t border-slate-100 dark:border-slate-800/50">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Equipo</span>
                        <div className="flex items-center -space-x-2 overflow-visible">
                            {/* Owner */}
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold ring-2 ring-white dark:ring-slate-950 z-10 shadow-sm" title="Owner">
                                <User className="w-4 h-4" />
                            </div>
                            {/* Members */}
                            {members.map(m => (
                                <div key={m.id} className="relative group w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 text-xs font-bold ring-2 ring-white dark:ring-slate-950 hover:z-20 hover:scale-110 transition cursor-help shadow-sm" title={m.profiles.email || ""}>
                                    {m.profiles.email?.charAt(0).toUpperCase()}
                                    {isAdmin && (
                                        <button onClick={(e) => { e.stopPropagation(); removeMember(m.id) }} className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-sm hover:scale-110">
                                            <X className="w-2 h-2" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {/* Add Member Button */}
                            {isAdmin && (
                                <div className="relative z-0 pl-4 flex items-center">
                                    {showInviteInput ? (
                                        <div className="flex items-center gap-1 animate-in slide-in-from-left-4 fade-in">
                                            <input
                                                autoFocus
                                                value={newMemberEmail}
                                                onChange={e => setNewMemberEmail(e.target.value)}
                                                placeholder="email@usuario.com"
                                                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1 text-xs focus:ring-2 focus:ring-primary-500 outline-none w-40 placeholder-slate-400 text-slate-900 dark:text-white"
                                            />
                                            <button onClick={inviteMember} disabled={inviting} className="w-6 h-6 bg-primary-600 rounded-full text-white flex items-center justify-center hover:bg-primary-500 transition shadow-md">
                                                {inviting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                            </button>
                                            <button onClick={() => setShowInviteInput(false)} className="w-6 h-6 bg-slate-200 dark:bg-slate-800 rounded-full text-slate-600 flex items-center justify-center hover:bg-slate-300 transition">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setShowInviteInput(true)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 text-slate-400 hover:text-primary-600 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition flex items-center justify-center -ml-2 z-0">
                                            <UserPlus className="w-4 h-4" />
                                        </button>
                                    )}
                                    {inviteFeedback && (
                                        <span className={`ml-3 text-xs font-medium ${inviteFeedback.type === 'success' ? 'text-emerald-600' : 'text-red-500'} animate-in fade-in`}>
                                            {inviteFeedback.msg}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>


            {/* 3. Main Content Grid */}
            <div className="grid lg:grid-cols-12 gap-8 items-start relative z-0">

                {/* LEFT: Timeline (7 cols) */}
                <div className="lg:col-span-7 space-y-8">
                    <div className="flex items-center justify-between pl-2">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            Bitácora
                        </h2>
                        <div className="text-xs font-medium px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500">
                            {registros.length} entradas
                        </div>
                    </div>

                    <div className="space-y-8 relative">
                        {/* Vertical Line */}
                        <div className="absolute left-4 top-4 bottom-0 w-px bg-slate-200 dark:bg-slate-800"></div>

                        {/* Create first-entry prompt if empty */}
                        {registros.length === 0 && (
                            <div className="pl-12 py-8 text-slate-400 text-sm">
                                Tu historia comienza aquí. Agrega el primer registro a la derecha.
                            </div>
                        )}

                        {registros.map((r, index) => (
                            <div key={r.id} className="relative pl-12 group animate-in slide-in-from-bottom-4 fade-in duration-700 fill-mode-both" style={{ animationDelay: `${index * 100}ms` }}>
                                {/* Timeline Dot */}
                                <div className="absolute left-[11px] top-5 w-2.5 h-2.5 rounded-full bg-white dark:bg-slate-900 border-2 border-primary-500 ring-4 ring-slate-50 dark:ring-slate-950 z-10 group-hover:scale-125 transition-transform duration-300"></div>

                                <div className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all hover:border-primary-200 dark:hover:border-primary-800/50">
                                    {editingId === r.id ? (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <input type="date" value={editForm.fecha} onChange={e => setEditForm(f => ({ ...f, fecha: e.target.value }))}
                                                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/20" />
                                            </div>
                                            <textarea value={editForm.descripcion} onChange={e => setEditForm(f => ({ ...f, descripcion: e.target.value }))}
                                                rows={4} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500/20 outline-none" />
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-lg transition">Cancelar</button>
                                                <button onClick={saveEdit} disabled={saving} className="px-3 py-1.5 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition shadow-lg shadow-primary-500/20">Guardar Cambios</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                                    {fmt(r.fecha)}
                                                </span>
                                                {isAdmin && (
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                                                        <button onClick={() => startEdit(r)} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"><Edit3 className="w-4 h-4" /></button>
                                                        <button onClick={() => deleteRegistro(r.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-slate-700 dark:text-slate-300 text-base leading-relaxed whitespace-pre-wrap font-regular">
                                                {r.descripcion}
                                            </p>
                                            {r.adjunto_url && (
                                                <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                                                    <a href={r.adjunto_url} target="_blank" className="inline-flex items-center gap-3 group/link">
                                                        <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 group-hover/link:bg-primary-100 transition">
                                                            <Paperclip className="w-4 h-4" />
                                                        </div>
                                                        <span className="text-sm font-medium text-primary-600 underline-offset-4 group-hover/link:underline">Ver archivo adjunto</span>
                                                    </a>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: Sticky Form (5 cols) */}
                <div className="lg:col-span-5 relative animate-in slide-in-from-right-8 fade-in duration-1000">
                    <div className="sticky top-8 space-y-6">

                        {/* Large Input Card */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-black/40 border border-slate-100 dark:border-slate-800 overflow-hidden">
                            <div className="p-1 bg-gradient-to-r from-indigo-500 via-primary-500 to-purple-500 opacity-80"></div>
                            <div className="p-6 md:p-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <Plus className="w-5 h-5 text-primary-500" /> Nuevo Registro
                                    </h3>
                                    {uploading && <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />}
                                </div>

                                <div className="space-y-5">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Fecha del evento</label>
                                        <input
                                            type="date"
                                            value={newForm.fecha}
                                            onChange={e => setNewForm(f => ({ ...f, fecha: e.target.value }))}
                                            className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-slate-950 transition-all outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Descripción</label>
                                        <textarea
                                            value={newForm.descripcion}
                                            onChange={e => setNewForm(f => ({ ...f, descripcion: e.target.value }))}
                                            rows={6}
                                            placeholder="¿Qué avances hubo hoy?"
                                            className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-base text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-slate-950 transition-all outline-none resize-none placeholder-slate-400"
                                        />
                                    </div>

                                    <div>
                                        <input
                                            id="file-upload"
                                            type="file"
                                            onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f, "new") }}
                                            className="hidden"
                                        />
                                        <label
                                            htmlFor="file-upload"
                                            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed bg-slate-50 dark:bg-slate-950/30 cursor-pointer transition-all ${newForm.adjunto_url ? 'border-emerald-400 bg-emerald-50 text-emerald-600' : 'border-slate-200 text-slate-500 hover:border-primary-400 hover:text-primary-600'}`}
                                        >
                                            {newForm.adjunto_url ? (
                                                <><Check className="w-4 h-4" /> Archivo adjuntado</>
                                            ) : (
                                                <><Paperclip className="w-4 h-4" /> Adjuntar archivo o imagen</>
                                            )}
                                        </label>
                                    </div>

                                    {formError && (
                                        <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" /> {formError}
                                        </div>
                                    )}

                                    <button
                                        onClick={addRegistro}
                                        disabled={saving || uploading}
                                        className="w-full bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold text-lg py-4 rounded-xl transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Registrar Avance"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Decorational element */}
                        <div className="flex justify-center">
                            <span className="text-xs text-slate-300 font-medium tracking-widest uppercase">Bitácora Enterprise v1.0</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}

function AlertCircle({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
    )
}
